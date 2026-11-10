"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Locale } from "@/types/domain";
import { dictionaries, getDictionary } from "./dictionaries";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  toggleLocale: () => void;
  t: (typeof dictionaries)["en"];
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

const STORAGE_KEY = "evercare_locale";

export function LocaleProvider({
  children,
  initialLocale = "en",
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    try {
      // Cookie lets server-rendered pages render in the same single language.
      document.cookie = `${STORAGE_KEY}=${next}; path=/; max-age=31536000; samesite=lax`;
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore storage errors in restricted environments
    }
    router.refresh();
  };

  const toggleLocale = () => {
    setLocale(locale === "en" ? "bn" : "en");
  };

  const value: LocaleContextValue = {
    locale,
    setLocale,
    toggleLocale,
    t: getDictionary(locale) as (typeof dictionaries)["en"],
  };

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return ctx;
}

