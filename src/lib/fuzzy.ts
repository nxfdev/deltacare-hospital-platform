// ============================================================================
// Fuzzy matching (Levenshtein edit distance + trigram similarity).
// Isomorphic: used by server search and client-side search boxes.
// Tolerates typos like "kardiology", "mahabub", "dengu", "gynocology".
// ============================================================================

export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

function trigrams(s: string): Set<string> {
  const padded = `  ${s} `;
  const out = new Set<string>();
  for (let i = 0; i < padded.length - 2; i++) out.add(padded.slice(i, i + 3));
  return out;
}

export function trigramSimilarity(a: string, b: string): number {
  const ta = trigrams(a);
  const tb = trigrams(b);
  let shared = 0;
  ta.forEach((t) => {
    if (tb.has(t)) shared++;
  });
  return shared / (ta.size + tb.size - shared || 1);
}

/** Similarity (0..1) between a single query token and a single word. */
function tokenWordSimilarity(token: string, word: string): number {
  if (word === token) return 1;
  if (word.startsWith(token)) return token.length >= 2 ? 0.95 : 0.6;
  if (token.length >= 3 && word.includes(token)) return 0.85;
  if (token.length < 3) return 0;

  const full = 1 - levenshtein(token, word) / Math.max(token.length, word.length);
  // Allow typo'd prefixes, e.g. "cardio" typed as "kardio" against "cardiology".
  let pre = 0;
  for (let len = token.length - 1; len <= token.length + 1; len++) {
    const prefix = word.slice(0, len);
    if (prefix.length < 3) continue;
    pre = Math.max(pre, 1 - levenshtein(token, prefix) / Math.max(token.length, prefix.length));
  }
  const tri = trigramSimilarity(token, word);
  return Math.max(full, pre * 0.92, tri);
}

function minSimilarityFor(token: string): number {
  if (token.length <= 3) return 0.95;
  if (token.length <= 5) return 0.74;
  return 0.76;
}

/**
 * Scores how well `query` matches `text` (0 = no match, 1 = exact).
 * Every query token must find a sufficiently similar word in the text.
 */
export function fuzzyScore(query: string, text: string): number {
  const q = normalizeText(query);
  const t = normalizeText(text);
  if (!q || !t) return 0;
  if (t.includes(q)) return t === q ? 1 : t.startsWith(q) ? 0.98 : 0.94;

  const words = t.split(" ");
  const tokens = q.split(" ").filter(Boolean);
  let total = 0;
  for (const token of tokens) {
    let best = 0;
    for (const w of words) {
      const s = tokenWordSimilarity(token, w);
      if (s > best) best = s;
      if (best === 1) break;
    }
    if (best < minSimilarityFor(token)) return 0;
    total += best;
  }
  return (total / tokens.length) * 0.92;
}

/**
 * Scores a record with weighted fields: primary fields (names) count fully,
 * secondary fields (descriptions, tags) are discounted.
 */
export function fuzzyRecordScore(
  query: string,
  primary: Array<string | undefined | null>,
  secondary: Array<string | undefined | null> = []
): number {
  let best = 0;
  for (const f of primary) if (f) best = Math.max(best, fuzzyScore(query, f));
  if (best >= 0.94) return best;
  for (const f of secondary) if (f) best = Math.max(best, fuzzyScore(query, f) * 0.8);
  return best;
}

export const FUZZY_THRESHOLD = 0.5;

/** Filters and ranks items by fuzzy relevance. */
export function fuzzyFilter<T>(
  items: T[],
  query: string,
  fields: (item: T) => { primary: Array<string | undefined | null>; secondary?: Array<string | undefined | null> }
): T[] {
  if (!normalizeText(query)) return items;
  return items
    .map((item) => {
      const f = fields(item);
      return { item, score: fuzzyRecordScore(query, f.primary, f.secondary) };
    })
    .filter((x) => x.score >= FUZZY_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item);
}
