import { jsonLd, structuredData, type SearchPage } from "../lib/seo";
import type { Locale } from "../lib/i18n";

export default function StructuredData({ page, locale, hasSearch = false }: { page: SearchPage; locale: Locale; hasSearch?: boolean }) {
  return <script id="global-herbs-structured-data" type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData(page, locale, hasSearch)) }} />;
}
