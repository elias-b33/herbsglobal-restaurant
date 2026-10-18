import { localizedHref, pageLocale, translate, type LocalePageProps } from "./i18n";

const pageCopy = {
  home: ["Global Herbs · Nepali Restaurant & Bar in Bucharest", "Discover Nepal’s flavours at Global Herbs. Explore our menu, reserve a table and find us on Strada Nicolae Tonitza in Bucharest."],
  menu: ["Food & drinks menu", "Discover Nepal’s flavours at Global Herbs. Explore our menu, reserve a table and find us on Strada Nicolae Tonitza in Bucharest."],
  order: ["Order online", "Explore the Global Herbs takeaway menu and build your order. Call the restaurant to confirm collection."],
  book: ["Book a table", "Plan your visit to Global Herbs, Bucharest. Choose your preferred details and call us to confirm your table."],
} as const;
export async function pageMetadata(page: keyof typeof pageCopy, props: LocalePageProps) {
  const locale = await pageLocale(props.searchParams);
  const [titleKey, descriptionKey] = pageCopy[page];
  const title = translate(locale, titleKey), description = translate(locale, descriptionKey);
  return {
    title: page === "home" ? { absolute: title } : title,
    description,
    // Unlisted translations can be reviewed without advertising them to search engines.
    ...(locale !== "en" ? { robots: { index: false, follow: true } } : {}),
    alternates: { canonical: page === "home" ? "/" : `/${page}` },
    openGraph: { title, description, locale: { en: "en_GB", ro: "ro_RO", ne: "ne_NP" }[locale], url: localizedHref(page === "home" ? "/" : `/${page}`, locale), images: ["/assets/hero-original.webp"] },
  };
}
