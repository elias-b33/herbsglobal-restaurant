import menu from "../data/menu.json";
import { hours, restaurant } from "../data/restaurant";
import { publicSearchPaths, searchConfig } from "../data/search-config";
import { translate, type Locale } from "./i18n";

export const pageCopy = {
  home: ["Global Herbs · Nepali Restaurant & Bar in Bucharest", "Nepali restaurant and bar on Str. Nicolae Tonitza 13, Bucharest. Explore mo:mo, curries, dal bhat and drinks, with menu prices and opening hours."],
  menu: ["Nepali food & drinks menu in Bucharest · Global Herbs", "Browse the Global Herbs menu: mo:mo, curries, dal bhat, biryani and drinks. See portions and prices in RON at our Nepali restaurant in Bucharest."],
  order: ["Takeaway menu preview · Global Herbs, Bucharest", "Explore the Global Herbs takeaway menu and build your order. Call the restaurant to confirm collection."],
  book: ["Plan your visit · Global Herbs, Bucharest", "Request a table or plan a group visit at Global Herbs, Bucharest. Send your preferences and our team will confirm availability personally."],
} as const;
export type SearchPage = keyof typeof pageCopy;
export const pagePath = (page: SearchPage) => page === "home" ? "/" : `/${page}`;
export const canonicalUrl = (path: string) => new URL(path, searchConfig.canonicalOrigin).href;
const restaurantId = canonicalUrl("/#restaurant");
const websiteId = canonicalUrl("/#website");
const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const clock = (minutes: number) => `${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

export function searchIndexable(path: string, locale: Locale, parameters: Record<string, unknown> = {}, publicLaunch = searchConfig.publicLaunch) {
  return publicLaunch && locale === "en" && publicSearchPaths.some(value => value === path)
    && !Object.hasOwn(parameters, "lang") && !Object.hasOwn(parameters, "q");
}

export function restaurantSchema() {
  return {
    "@type": "Restaurant", "@id": restaurantId,
    name: restaurant.name, url: canonicalUrl("/"),
    description: "Nepali restaurant and bar on Str. Nicolae Tonitza 13 in Bucharest, Romania.",
    telephone: restaurant.phoneHref.slice(4),
    address: { "@type": "PostalAddress", streetAddress: restaurant.streetAddress, addressLocality: restaurant.locality, postalCode: restaurant.postalCode, addressCountry: restaurant.countryCode },
    servesCuisine: "Nepalese", currenciesAccepted: "RON",
    image: [canonicalUrl("/assets/hero-original.webp"), canonicalUrl("/assets/gallery-06-chicken-steam-momo.png")],
    logo: canonicalUrl("/assets/logo-original.webp"),
    hasMap: restaurant.maps,
    sameAs: [restaurant.instagram, restaurant.facebook, restaurant.tiktok],
    hasMenu: { "@id": canonicalUrl("/menu#menu"), url: canonicalUrl("/menu") },
    openingHoursSpecification: weekdays.map((day, index) => ({
      "@type": "OpeningHoursSpecification", dayOfWeek: `https://schema.org/${day}`,
      // A closing time before opening is the next day. 00:00/00:00 means closed.
      opens: hours[index] ? clock(hours[index]!.open) : "00:00",
      closes: hours[index] ? clock(hours[index]!.close) : "00:00",
    })),
  };
}

export function menuSchema(locale: Locale) {
  const categories = [...new Set(menu.map(item => item.category))];
  return {
    "@type": "Menu", "@id": canonicalUrl("/menu#menu"), url: canonicalUrl("/menu"),
    name: translate(locale, "Food & drinks menu"), inLanguage: locale,
    hasMenuSection: categories.map((category, index) => ({
      "@type": "MenuSection", name: translate(locale, category), url: canonicalUrl(`/menu#category-${index}`),
      hasMenuItem: menu.filter(item => item.category === category).map(item => ({
        "@type": "MenuItem", "@id": canonicalUrl(`/menu#dish-${item.id}`), url: canonicalUrl(`/menu#dish-${item.id}`),
        name: translate(locale, item.name),
        ...(item.portion ? { description: translate(locale, item.portion) } : {}),
        offers: { "@type": "Offer", price: item.price, priceCurrency: "RON" },
      })),
    })),
  };
}

export function structuredData(page: SearchPage, locale: Locale, hasSearch = false) {
  const url = canonicalUrl(pagePath(page));
  const [title, description] = pageCopy[page];
  const graph: object[] = [restaurantSchema(),
    { "@type": "WebSite", "@id": websiteId, name: restaurant.name, url: canonicalUrl("/"), inLanguage: "en", publisher: { "@id": restaurantId } },
    { "@type": "WebPage", "@id": `${url}#webpage`, url, name: translate(locale, title), description: translate(locale, description), inLanguage: locale, isPartOf: { "@id": websiteId }, about: { "@id": restaurantId }, ...(page === "menu" && !hasSearch ? { mainEntity: { "@id": canonicalUrl("/menu#menu") } } : {}) },
  ];
  if (page !== "home") graph.push({ "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: translate(locale, "Home"), item: canonicalUrl("/") },
    { "@type": "ListItem", position: 2, name: translate(locale, page === "menu" ? "Our menu" : page === "order" ? "Order online" : "Book a table"), item: url },
  ] });
  // Filtered views must not advertise dishes that disappear after hydration.
  if (page === "menu" && !hasSearch) graph.push(menuSchema(locale));
  return { "@context": "https://schema.org", "@graph": graph };
}

export function jsonLd(value: unknown) { return JSON.stringify(value).replace(/</g, "\\u003c"); }

export function robotsText(publicLaunch = searchConfig.publicLaunch) {
  if (!publicLaunch) return "User-agent: *\nDisallow: /\n";
  // OAI-SearchBot is for ChatGPT search; no training crawler is required for this.
  // Keep preview pages crawlable so their noindex metadata can be read.
  const rules = "Allow: /\nDisallow: /api/\n";
  return `User-agent: *\n${rules}\nUser-agent: OAI-SearchBot\n${rules}\nSitemap: ${canonicalUrl("/sitemap.xml")}\n`;
}

export function sitemapXml(publicLaunch = searchConfig.publicLaunch) {
  const entries = publicLaunch ? publicSearchPaths.map(path => `  <url><loc>${canonicalUrl(path)}</loc></url>`).join("\n") : "";
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}
