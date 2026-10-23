"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { formatCount, formatMoney, isLocale, localizedHref, resolveLocale, translate, type Locale } from "../lib/i18n";
import { pageCopy, type SearchPage } from "../lib/seo";

const LanguageContext = createContext<{ locale: Locale; changeLanguage: (locale: Locale) => void }>({ locale: "en", changeLanguage: () => {} });
const languageStorageKey = "global-herbs-language";
export function LanguageProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const [selected, setSelected] = useState(locale);
  useEffect(() => {
    // An explicit shared language link wins; otherwise restore this browser's choice.
    const explicit = new URLSearchParams(window.location.search).get("lang");
    let chosen = locale;
    try {
      const saved = window.localStorage.getItem(languageStorageKey);
      if (isLocale(explicit)) { chosen = explicit; window.localStorage.setItem(languageStorageKey, chosen); }
      else if (isLocale(saved)) chosen = saved;
    } catch { /* Storage can be blocked; switching still works for this visit. */ }
    const href = localizedHref(`${window.location.pathname}${window.location.search}${window.location.hash}`, chosen);
    window.history.replaceState(window.history.state, "", href);
    setSelected(chosen);
  }, [locale]);
  const changeLanguage = useCallback((next: Locale) => {
    const chosen = resolveLocale(next);
    try { window.localStorage.setItem(languageStorageKey, chosen); } catch { /* Keep working without storage. */ }
    // Update in place so booking fields, menu filters and the basket stay intact.
    const href = localizedHref(`${window.location.pathname}${window.location.search}${window.location.hash}`, chosen);
    window.history.replaceState(window.history.state, "", href);
    setSelected(chosen);
  }, []);
  useEffect(() => {
    document.documentElement.lang = selected;
    const page: SearchPage = window.location.pathname === "/menu" ? "menu" : window.location.pathname === "/order" ? "order" : window.location.pathname === "/book" ? "book" : "home";
    const [title, description] = pageCopy[page];
    document.title = translate(selected, title);
    document.querySelector('meta[name="description"]')?.setAttribute("content", translate(selected, description));
  }, [selected]);
  const context = useMemo(() => ({ locale: selected, changeLanguage }), [selected, changeLanguage]);
  // The SSR wrapper marks translated content correctly even before hydration.
  return <LanguageContext.Provider value={context}><div lang={selected} className="language-root">{children}</div></LanguageContext.Provider>;
}
export function useLanguage() {
  const { locale, changeLanguage } = useContext(LanguageContext);
  return useMemo(() => ({
    locale, changeLanguage,
    t: (key: string, values?: Record<string, string | number>) => translate(locale, key, values),
    l: (href: string) => localizedHref(href, locale),
    money: (value: number) => formatMoney(value, locale),
    countText: (count: number, noun: "item" | "guest" = "item") => formatCount(count, noun, locale),
  }), [locale, changeLanguage]);
}
