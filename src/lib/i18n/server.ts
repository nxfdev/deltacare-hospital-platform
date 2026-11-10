import { cookies } from "next/headers";
import type { Locale } from "@/types/domain";

export const LOCALE_COOKIE = "evercare_locale";

/** Reads the visitor's selected language on the server (defaults to English). */
export async function getServerLocale(): Promise<Locale> {
  try {
    const store = await cookies();
    return store.get(LOCALE_COOKIE)?.value === "bn" ? "bn" : "en";
  } catch {
    return "en";
  }
}

/** Picks the English or Bangla variant of a field. */
export function pick<T>(locale: Locale, en: T, bn: T): T {
  return locale === "bn" ? bn : en;
}
