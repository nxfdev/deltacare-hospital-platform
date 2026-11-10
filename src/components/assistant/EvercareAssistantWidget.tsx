"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X, ArrowUp } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleContext";
import type { AssistantReply } from "@/server/services/assistantService";

interface ChatTurn {
  id: string;
  sender: "user" | "assistant";
  text: string;
  replyMeta?: AssistantReply;
}

const COPY = {
  en: {
    title: "Evercare Assistant",
    subtitle: "Doctors, schedules, fees & booking",
    open: "Chat with us",
    welcome:
      "Hello! I can help you find the right doctor, check chamber hours and fees, or book an appointment. How can I help?",
    placeholder: "Type your question…",
    note: "Not medical advice. Emergency: 10666",
    error: "Sorry, I couldn't reach the hospital records just now. Please call 10666.",
    prompts: ["I have fever for 3 days", "Cardiology doctors", "How do I book?", "Branch hours"],
  },
  bn: {
    title: "এভারকেয়ার সহায়ক",
    subtitle: "ডাক্তার, সময়সূচী, ফি ও অ্যাপয়েন্টমেন্ট",
    open: "কথা বলুন",
    welcome:
      "আসসালামু আলাইকুম! সঠিক ডাক্তার খোঁজা, চেম্বারের সময় ও ফি জানা অথবা অ্যাপয়েন্টমেন্ট নিতে আমি আপনাকে সাহায্য করতে পারি। কীভাবে সাহায্য করব?",
    placeholder: "আপনার প্রশ্ন লিখুন…",
    note: "এটি চিকিৎসা পরামর্শ নয়। জরুরি: ১০৬৬৬",
    error: "দুঃখিত, এই মুহূর্তে তথ্য পাওয়া যাচ্ছে না। অনুগ্রহ করে ১০৬৬৬ নম্বরে কল করুন।",
    prompts: ["৩ দিন ধরে জ্বর", "হৃদরোগ বিশেষজ্ঞ", "কীভাবে সিরিয়াল নেব?", "শাখার সময়সূচী"],
  },
} as const;

/** Renders plain text, turning internal paths like /appointments into links. */
function RichText({ text, onNavigate }: { text: string; onNavigate: () => void }) {
  const parts = text.split(/(\s\/[a-z0-9\-/]+)/gi);
  return (
    <p className="whitespace-pre-line">
      {parts.map((part, i) => {
        const m = part.match(/^(\s)(\/[a-z0-9\-/]+)$/i);
        if (m) {
          const href = m[2].replace(/[.,)]+$/, "");
          return (
            <React.Fragment key={i}>
              {m[1]}
              <Link href={href} onClick={onNavigate} className="underline underline-offset-2 font-medium">
                {href}
              </Link>
            </React.Fragment>
          );
        }
        return <React.Fragment key={i}>{part.replace(/\*\*/g, "")}</React.Fragment>;
      })}
    </p>
  );
}

export function EvercareAssistantWidget() {
  const { locale } = useLocale();
  const t = COPY[locale === "bn" ? "bn" : "en"];
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Restart the conversation when the site language changes so it stays single-language.
  useEffect(() => {
    setTurns([]);
  }, [locale]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, loading]);

  const sendMessage = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || loading) return;

    const history = turns.map((tn) => ({
      role: tn.sender === "user" ? ("user" as const) : ("assistant" as const),
      content: tn.text.slice(0, 2000),
    }));
    setTurns((prev) => [...prev, { id: `u-${Date.now()}`, sender: "user", text: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/v1/public/assistant/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, locale, history: history.slice(-12) }),
      });
      const data = await res.json();
      const reply: AssistantReply | undefined = data.reply;
      setTurns((prev) => [
        ...prev,
        reply
          ? { id: `a-${Date.now()}`, sender: "assistant", text: reply.answer, replyMeta: reply }
          : { id: `e-${Date.now()}`, sender: "assistant", text: t.error },
      ]);
    } catch {
      setTurns((prev) => [...prev, { id: `e-${Date.now()}`, sender: "assistant", text: t.error }]);
    } finally {
      setLoading(false);
    }
  };

  const close = () => setIsOpen(false);

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.button
            key="launcher"
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label={t.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            whileHover={{ y: -2 }}
            className="inline-flex items-center gap-2 pl-4 pr-5 py-3 rounded-full bg-[#0057b8] text-white shadow-lg hover:bg-[#004a9c] transition-colors"
          >
            <MessageCircle className="w-5 h-5" aria-hidden="true" />
            <span className="text-sm font-medium">{t.open}</span>
          </motion.button>
        ) : (
          <motion.div
            key="panel"
            role="dialog"
            aria-label={t.title}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="w-[calc(100vw-2.5rem)] sm:w-[380px] h-[560px] max-h-[80vh] flex flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#eef0f3]">
              <div className="flex items-center gap-3">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                <div>
                  <h2 className="text-[15px] font-semibold text-[#0b1b33] leading-tight">{t.title}</h2>
                  <p className="text-xs text-[#6b7280]">{t.subtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="p-1.5 rounded-full text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#0b1b33]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#fafbfc]">
              <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-sm leading-relaxed text-[#1f2937] ring-1 ring-[#eef0f3]">
                {t.welcome}
              </div>

              {turns.map((turn) => (
                <motion.div
                  key={turn.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${turn.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      turn.sender === "user"
                        ? "rounded-tr-sm bg-[#0057b8] text-white"
                        : "rounded-tl-sm bg-white text-[#1f2937] ring-1 ring-[#eef0f3]"
                    }`}
                  >
                    <RichText text={turn.text} onNavigate={close} />
                    {turn.replyMeta?.suggestedActions?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {turn.replyMeta.suggestedActions.slice(0, 2).map((act) => (
                          <Link
                            key={act.href + act.label}
                            href={act.href}
                            onClick={close}
                            className="text-xs px-3 py-1.5 rounded-full bg-[#eef4fb] text-[#0057b8] hover:bg-[#0057b8] hover:text-white transition-colors"
                          >
                            {act.label}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </motion.div>
              ))}

              {loading && (
                <div className="flex gap-1 px-4 py-3 w-fit rounded-2xl bg-white ring-1 ring-[#eef0f3]" aria-label="Typing">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-[#9ca3af]"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              )}
            </div>

            {turns.length === 0 && (
              <div className="px-4 pb-2 pt-1 flex flex-wrap gap-2 bg-[#fafbfc]">
                {t.prompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="text-xs px-3 py-1.5 rounded-full bg-white ring-1 ring-[#e5e7eb] text-[#374151] hover:ring-[#0057b8] hover:text-[#0057b8] transition"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="px-3 pt-3 pb-2 border-t border-[#eef0f3] bg-white"
            >
              <div className="flex items-center gap-2 rounded-full bg-[#f3f4f6] pl-4 pr-1.5 py-1.5">
                <label htmlFor="assistant-chat-input" className="sr-only">
                  {t.placeholder}
                </label>
                <input
                  id="assistant-chat-input"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t.placeholder}
                  className="flex-1 bg-transparent text-sm text-[#0b1b33] placeholder:text-[#9ca3af] outline-none"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  aria-label="Send"
                  className="w-8 h-8 rounded-full bg-[#0057b8] disabled:bg-[#cbd5e1] text-white flex items-center justify-center transition-colors"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-1.5 text-center text-[11px] text-[#9ca3af]">{t.note}</p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
