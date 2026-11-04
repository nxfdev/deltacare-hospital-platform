"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MessageCircle,
  X,
  Send,
  ShieldAlert,
  Bot,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { AssistantReply } from "@/server/services/assistantService";

interface ChatTurn {
  id: string;
  sender: "user" | "assistant";
  text: string;
  replyMeta?: AssistantReply;
}

export function DeltaCareAssistantWidget() {
  const { locale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [turns, setTurns] = useState<ChatTurn[]>([
    {
      id: "welcome",
      sender: "assistant",
      text:
        locale === "bn"
          ? "স্বাগতম! আমি ডেল্টাকেয়ার অ্যাসিস্ট্যান্ট (স্বয়ংক্রিয় তথ্য সহায়ক)। আপনি আমাদের অনুমোদিত চিকিৎসকদের সময়সূচী, কনসালটেশন ফি, শাখার ঠিকানা বা অ্যাপয়েন্টমেন্ট প্রক্রিয়া সম্পর্কে প্রশ্ন করতে পারেন।"
          : "Welcome! I am DeltaCare Assistant, your automated hospital information guide. Ask me about verified specialist schedules, consultation fees, branch hours, or appointment tracking.",
    },
  ]);

  const quickPrompts =
    locale === "bn"
      ? [
          "কার্ডিওলজি বিশেষজ্ঞ কারা আছেন?",
          "ধানমন্ডি শাখার সময়সূচী ও ফোন নম্বর কী?",
          "ডা. রফিকুল ইসলামের কনসালটেশন ফি কত?",
          "আমার অ্যাপয়েন্টমেন্ট DC-2026-1041 কি নিশ্চিত?",
        ]
      : [
          "Which Cardiology specialists are available?",
          "What are the hours and phone for Dhanmondi Flagship?",
          "Consultation fee for Prof. Dr. M. Rafiqul Islam?",
          "Is my appointment request DC-2026-1041 confirmed?",
        ];

  const sendMessage = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || loading) return;

    const userTurn: ChatTurn = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: trimmed,
    };
    setTurns((prev) => [...prev, userTurn]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/v1/public/assistant/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, locale }),
      });
      const data = await res.json();
      if (res.ok && data.reply) {
        const reply: AssistantReply = data.reply;
        setTurns((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            sender: "assistant",
            text: reply.answer,
            replyMeta: reply,
          },
        ]);
      } else {
        setTurns((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: "assistant",
            text:
              data.error ||
              "Unable to retrieve verified hospital information right now. Please call 10678.",
          },
        ]);
      }
    } catch {
      setTurns((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "assistant",
          text: "Network error contacting DeltaCare Assistant. Please call 10678.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open DeltaCare Assistant"
          className="inline-flex items-center gap-2.5 px-5 py-3.5 rounded-full bg-[#0057b8] hover:bg-[#1371d5] text-white font-medium shadow-xl border-2 border-white transition-all"
        >
          <MessageCircle className="w-5 h-5" aria-hidden="true" />
          <span className="text-sm font-semibold">
            {locale === "bn" ? "ডেল্টাকেয়ার অ্যাসিস্ট্যান্ট" : "DeltaCare Assistant"}
          </span>
        </button>
      ) : (
        <div
          role="dialog"
          aria-label="DeltaCare Assistant — Automated Hospital Information"
          className="w-[360px] sm:w-[410px] max-h-[82vh] flex flex-col rounded-2xl bg-white border border-[#d6d6d6] shadow-2xl overflow-hidden"
        >
          {/* Header with Automated Disclosure (FR-AI-01) */}
          <div className="bg-[#012d61] text-white p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#0057b8] flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm text-white">
                    {locale === "bn"
                      ? "ডেল্টাকেয়ার অ্যাসিস্ট্যান্ট"
                      : "DeltaCare Assistant"}
                  </h2>
                  <p className="text-[11px] text-[#c5e2f9]">
                    {locale === "bn"
                      ? "স্বয়ংক্রিয় সহায়ক • অনুমোদিত তথ্যভিত্তিক"
                      : "Automated Assistant • Verified Hospital Sources"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close DeltaCare Assistant"
                className="p-1.5 rounded-full hover:bg-white/15 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-2.5 px-2.5 py-1.5 rounded bg-white/10 text-[11px] text-[#e8f0f9] flex items-start gap-1.5">
              <ShieldAlert className="w-4 h-4 text-[#c5e2f9] shrink-0 mt-0.5" />
              <span>
                {locale === "bn"
                  ? "জরুরি শারীরিক সমস্যায় ১০৬৭৮ নম্বরে কল করুন। এই সহায়ক কোনো রোগ নির্ণয় বা ওষুধের পরামর্শ দেয় না।"
                  : "No clinical diagnosis or prescription advice. For medical emergencies, call 10678 immediately."}
              </span>
            </div>
          </div>

          {/* Conversation Messages */}
          <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[360px] bg-[#f8fafc]">
            {turns.map((turn) => (
              <div
                key={turn.id}
                className={`flex flex-col ${
                  turn.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[90%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    turn.sender === "user"
                      ? "bg-[#0057b8] text-white"
                      : turn.replyMeta?.wasClinicalRefusal
                      ? "bg-[#fef2f2] border border-[#dc2626] text-[#7f1d1d]"
                      : "bg-white border border-[#d6d6d6] text-[#080808]"
                  }`}
                >
                  <p className="whitespace-pre-line">{turn.text}</p>

                  {turn.replyMeta?.citations &&
                    turn.replyMeta.citations.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-[#d6d6d6] space-y-1">
                        <p className="text-[11px] font-semibold text-[#004181] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#0057b8]" />
                          <span>
                            {locale === "bn"
                              ? "অনুমোদিত উৎস (Published Sources):"
                              : "Verified Published Sources:"}
                          </span>
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {turn.replyMeta.citations.map((cit) => (
                            <Link
                              key={cit.id}
                              href={cit.href}
                              onClick={() => setIsOpen(false)}
                              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-[#e8f0f9] text-[#004181] hover:underline font-medium"
                            >
                              <span>{cit.title}</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                  {turn.replyMeta?.suggestedActions &&
                    turn.replyMeta.suggestedActions.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {turn.replyMeta.suggestedActions.map((act) => (
                          <Link
                            key={act.href + act.label}
                            href={act.href}
                            onClick={() => setIsOpen(false)}
                            className="inline-block text-xs px-2.5 py-1 rounded-full border border-[#0057b8] text-[#0057b8] hover:bg-[#0057b8] hover:text-white font-medium transition-colors"
                          >
                            {act.label}
                          </Link>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="text-xs text-[#686868] italic px-2">
                {locale === "bn"
                  ? "অনুমোদিত হাসপাতাল তথ্য অনুসন্ধান করা হচ্ছে..."
                  : "Checking verified DeltaCare hospital records..."}
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-2 bg-[#f2f2f2] border-t border-[#d6d6d6] flex gap-1.5 overflow-x-auto">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendMessage(prompt)}
                className="shrink-0 text-xs px-2.5 py-1 rounded-full bg-white border border-[#d6d6d6] text-[#004181] hover:border-[#0057b8] transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="p-3 bg-white border-t border-[#d6d6d6] flex items-center gap-2"
          >
            <label htmlFor="assistant-chat-input" className="sr-only">
              Ask DeltaCare Assistant
            </label>
            <input
              id="assistant-chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                locale === "bn"
                  ? "ডাক্তার, ফি, সময়সূচী বা শাখা সম্পর্কে জিজ্ঞাসা করুন..."
                  : "Ask about doctors, fees, hours, or branches..."
              }
              className="flex-1 h-10 px-3 rounded-lg border border-[#757575] text-sm text-[#080808]"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send question"
              className="h-10 px-3.5 rounded-lg bg-[#0057b8] hover:bg-[#1371d5] disabled:opacity-50 text-white flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

