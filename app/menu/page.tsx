import Menu from "../ui/menu";
import { LanguageProvider } from "../ui/language";
import { pageLocale, type LocalePageProps } from "../lib/i18n";
import { pageMetadata } from "../lib/page-metadata";
import StructuredData from "../ui/structured-data";
export const generateMetadata = (props: LocalePageProps) => pageMetadata("menu", props);
export default async function Page({ searchParams }: LocalePageProps) {
  const locale = await pageLocale(searchParams);
  return <><StructuredData page="menu" locale={locale} hasSearch={Object.hasOwn(await searchParams ?? {}, "q")} /><LanguageProvider locale={locale}><Menu /></LanguageProvider></>;
}
