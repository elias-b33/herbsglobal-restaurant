import { translations } from "../data/translations";
import { menuTranslations } from "../data/menu-translations";
import { europeanTranslations } from "../data/european-translations";

export const locales = ["en", "ro", "ne", "es", "de"] as const;
export type Locale = typeof locales[number];
export const intlLocales: Record<Locale, string> = { en: "en-GB", ro: "ro-RO", ne: "ne-NP", es: "es-ES", de: "de-DE" };
export function isLocale(value: unknown): value is Locale { return locales.some(locale => locale === value); }
export function resolveLocale(value: unknown): Locale { return isLocale(value) ? value : "en"; }
export type LocalePageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };
export async function pageLocale(searchParams: LocalePageProps["searchParams"]) { return resolveLocale((await searchParams)?.lang); }

export function translate(locale: Locale, key: string, values: Record<string, string | number> = {}): string {
  const translated = translations[key] ?? menuTranslations[key];
  const message = locale === "es" || locale === "de" ? europeanTranslations[key]?.[locale === "es" ? 0 : 1] ?? key
    : locale === "en" || !translated ? key : translated[locale === "ro" ? 0 : 1];
  return message.replace(/\{(\w+)\}/g, (placeholder, name: string) => String(values[name] ?? placeholder));
}

// Keep the chosen language in links, preserving searches and section anchors.
export function localizedHref(href: string, locale: Locale) {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const url = new URL(href, "https://global-herbs.invalid");
  if (locale === "en") url.searchParams.delete("lang");
  else url.searchParams.set("lang", locale);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function normalizeSearch(text: string) {
  // Remove Latin accents for Romanian searches, but keep Devanagari vowel marks.
  return text.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").normalize("NFC").replace(/[^\p{L}\p{M}\p{N}]+/gu, "");
}
export function matchesMenuSearch(item: { name: string; category: string }, query: string, locale: Locale) {
  const search = normalizeSearch(query);
  return [item.name, item.category, translate(locale, item.name), translate(locale, item.category)].some(field => normalizeSearch(field).includes(search));
}
export function formatMoney(value: number, locale: Locale = "en") { return new Intl.NumberFormat(intlLocales[locale], { maximumFractionDigits: 2 }).format(value); }
export function formatCount(count: number, noun: "item" | "guest", locale: Locale) {
  const plural = new Intl.PluralRules(intlLocales[locale]).select(count);
  const number = new Intl.NumberFormat(intlLocales[locale]).format(count);
  // Romanian uses "de" with the many/other form (20 de produse, 100 de produse).
  if (locale === "ro" && plural === "other") return `${number} de ${noun === "item" ? "produse" : "persoane"}`;
  return translate(locale, `{count} ${noun}${count === 1 ? "" : "s"}`, { count: number });
}
