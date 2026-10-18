import Home from "./ui/home";
import { LanguageProvider } from "./ui/language";
import { pageLocale, type LocalePageProps } from "./lib/i18n";
import { pageMetadata } from "./lib/page-metadata";
export const generateMetadata = (props: LocalePageProps) => pageMetadata("home", props);
export default async function Page({ searchParams }: LocalePageProps) { return <LanguageProvider locale={await pageLocale(searchParams)}><Home /></LanguageProvider>; }
