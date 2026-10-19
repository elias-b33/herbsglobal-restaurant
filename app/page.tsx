import Home from "./ui/home";
import { LanguageProvider } from "./ui/language";
import { pageLocale, type LocalePageProps } from "./lib/i18n";
import { pageMetadata } from "./lib/page-metadata";
import StructuredData from "./ui/structured-data";
export const generateMetadata = (props: LocalePageProps) => pageMetadata("home", props);
export default async function Page({ searchParams }: LocalePageProps) {
  const locale = await pageLocale(searchParams);
  return <><StructuredData page="home" locale={locale} /><LanguageProvider locale={locale}><Home /></LanguageProvider></>;
}
