"use client";
import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { formatCount, formatMoney, localizedHref, translate, type Locale } from "../lib/i18n";

const LanguageContext = createContext<Locale>("en");
export function LanguageProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  // The SSR wrapper marks translated content correctly even before hydration.
  return <LanguageContext.Provider value={locale}><div lang={locale} className="language-root">{children}</div></LanguageContext.Provider>;
}
export function useLanguage() {
  const locale = useContext(LanguageContext);
  return useMemo(() => ({
    locale,
    t: (key: string, values?: Record<string, string | number>) => translate(locale, key, values),
    l: (href: string) => localizedHref(href, locale),
    money: (value: number) => formatMoney(value, locale),
    countText: (count: number, noun: "item" | "guest" = "item") => formatCount(count, noun, locale),
  }), [locale]);
}
