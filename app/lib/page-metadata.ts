import type { Metadata } from "next";
import { pageLocale, translate, type LocalePageProps } from "./i18n";
import { canonicalUrl, pageCopy, pagePath, searchIndexable, type SearchPage } from "./seo";

export async function pageMetadata(page: SearchPage, props: LocalePageProps): Promise<Metadata> {
  const locale = await pageLocale(props.searchParams);
  const [titleKey, descriptionKey] = pageCopy[page];
  const title = translate(locale, titleKey), description = translate(locale, descriptionKey);
  return {
    title: { absolute: title },
    description,
    robots: { index: searchIndexable(pagePath(page), locale, await props.searchParams), follow: true, "max-image-preview": "large" },
    // Translation indexing stays separate from the visible language selector.
    alternates: { canonical: canonicalUrl(pagePath(page)) },
    openGraph: { title, description, type: "website", siteName: "Global Herbs", locale: { en: "en_GB", ro: "ro_RO", ne: "ne_NP", es: "es_ES", de: "de_DE" }[locale], url: canonicalUrl(pagePath(page)), images: [{ url: canonicalUrl("/assets/hero-original.webp"), width: 1289, height: 932, alt: translate(locale, "Golden fried shrimp with fresh herbs and dipping sauce at Global Herbs") }] },
    twitter: { card: "summary_large_image", title, description, images: [canonicalUrl("/assets/hero-original.webp")] },
  };
}
