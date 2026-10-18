import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL("https://global-herbs-refined.duckzyyy.chatgpt.site"),
  title: { default: "Global Herbs · Nepali Restaurant & Bar in Bucharest", template: "%s · Global Herbs" },
  description: "Discover Nepal’s flavours at Global Herbs. Explore our menu, reserve a table and find us on Strada Nicolae Tonitza in Bucharest.",
  icons: { icon: "/assets/logo-original.webp" },
  openGraph: { title: "Global Herbs · Restaurant & Bar", description: "Nepali flavours, in the heart of Bucharest.", images: ["/assets/hero-original.webp"] },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
