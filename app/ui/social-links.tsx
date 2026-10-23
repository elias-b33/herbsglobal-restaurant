"use client";
import { restaurant } from "../data/restaurant";
import { useLanguage } from "./language";

// Both placements use the restaurant's existing destinations, without redirects.
const links = [
  { name: "Experiences", href: restaurant.experiences, icon: "experiences" },
  { name: "TikTok", href: restaurant.tiktok, icon: "tiktok" },
  { name: "Facebook", href: restaurant.facebook, icon: "facebook" },
  { name: "Instagram", href: restaurant.instagram, icon: "instagram" },
] as const;

function SocialIcon({ icon }: { icon: typeof links[number]["icon"] }) {
  return <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" focusable="false">
    {icon === "experiences" && <path fill="currentColor" d="M10 1h4v6l4-4 3 3-5 4h7v4h-7l5 4-3 3-4-5v7h-4v-7l-4 5-3-3 5-4H1v-4h7L3 6l3-3 4 4Z" />}
    {icon === "tiktok" && <><circle cx="12" cy="12" r="12" fill="currentColor" /><path fill="var(--gold)" d="M14 5h2.6c.2 1.8 1.2 2.8 3 3v2.7a7 7 0 0 1-3-1v6.1a4.7 4.7 0 1 1-4.7-4.7v2.7a2 2 0 1 0 2.1 2Z" /></>}
    {icon === "facebook" && <path fill="currentColor" d="M15.7 24V13.1h3.7l.6-4.3h-4.3V6c0-1.2.4-2.1 2.2-2.1h2.3V.1C19.8 0 18.4 0 16.8 0c-3.4 0-5.7 2-5.7 5.8v3H7.3v4.3h3.8V24Z" />}
    {icon === "instagram" && <g fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="6" /><circle cx="12" cy="12" r="4.5" /><circle cx="18" cy="6" r="1" fill="currentColor" stroke="none" /></g>}
  </svg>;
}

export default function SocialLinks({ rail = false }: { rail?: boolean }) {
  const { t } = useLanguage();
  return <nav className={rail ? "social-icons social-rail" : "social-icons"} aria-label={t("Follow along")}>
    {links.map(link => <a key={link.icon} href={link.href} target="_blank" rel="noopener noreferrer" aria-label={t(link.name)} title={t(link.name)}><SocialIcon icon={link.icon} /></a>)}
  </nav>;
}
