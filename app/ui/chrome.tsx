"use client";
import { useLanguage } from "./language";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { restaurant } from "../data/restaurant";
import { openingStatus } from "../lib/opening";
import { resolveLocale } from "../lib/i18n";
import Assistant from "./assistant";
import DirectionsLink from "./directions-link";

export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    arrow: <path d="M4 12h15M13 6l6 6-6 6" />,
    external: <path d="M6 18 18 6M6 6h12v12" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    heart: <path d="M20.5 5.5a5 5 0 0 0-7.1 0L12 7l-1.4-1.5a5 5 0 0 0-7.1 7L12 21l8.5-8.5a5 5 0 0 0 0-7Z" />,
    pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z" /><circle cx="12" cy="10" r="2" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 6v6l4 2" /></>,
    phone: <path d="m8 3 3 5-3 2c1 3 3 5 6 6l2-3 5 3-1 4c-1 2-8 0-12-4S2 5 4 4l4-1Z" />,
    chat: <><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-1 1v-9.5A8.5 8.5 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5Z" /><path d="M7 9h10M7 13h7" /></>,
    expand: <path d="M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5" />,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] ?? paths.arrow}</svg>;
}

export function openDialog(id: string) { (document.getElementById(id) as HTMLDialogElement | null)?.showModal(); }

export function Dialog({ id, label, children, className = "" }: { id: string; label: string; children: ReactNode; className?: string }) {
  const { t } = useLanguage();
  const ref = useRef<HTMLDialogElement>(null);
  return <dialog ref={ref} id={id} className={`dialog ${className}`} aria-labelledby={`${id}-title`} onClick={event => {
    if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) ref.current?.close(); }
  }}>
    <button className="icon-button dialog-close" aria-label={t("Close {label}", { label })} onClick={() => ref.current?.close()}><Icon name="close" /></button>{children}
  </dialog>;
}

function Header({ active }: { active: "home" | "menu" | "order" | "book" }) {
  const { t, l, locale, changeLanguage } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const key = (event: KeyboardEvent) => { if (event.key === "Escape" && expanded) { setExpanded(false); toggle.current?.focus(); } };
    window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key);
  }, [expanded]);
  return <header className="site-header">
    <a href="#main" className="skip-link">{t("Skip to content")}</a>
    <div className="header-inner container">
      <a className="brand" href={l("/")} aria-label={t("Global Herbs home")}><img src="/assets/logo-original.webp" width="112" height="77" alt="Global Herbs" /></a>
      <button ref={toggle} className="mobile-toggle icon-button" aria-controls="main-nav" aria-expanded={expanded} aria-label={expanded ? t("Close navigation") : t("Open navigation")} onClick={() => setExpanded(!expanded)}><Icon name={expanded ? "close" : "menu"} size={24} /></button>
      <nav id="main-nav" aria-label={t("Main navigation")} className={expanded ? "main-nav expanded" : "main-nav"} onClick={() => setExpanded(false)}>
        <a href={l("/")} aria-current={active === "home" ? "page" : undefined}>{t("Home")}</a><a href={l("/#about")}>{t("About")}</a><a href={l("/menu")} aria-current={active === "menu" ? "page" : undefined}>{t("Our menu")}</a><a href={l("/#contact")}>{t("Contact")}</a><a href={l("/order")} aria-current={active === "order" ? "page" : undefined} className="order-link">{t("Order online")} <Icon name="arrow" size={16} /></a>
      </nav>
      <label className="language-switcher"><span><Icon name="globe" size={17} />{t("Language")}</span>
        <select aria-label={t("Choose language")} value={locale} onChange={event => changeLanguage(resolveLocale(event.target.value))}>
          <option value="en" lang="en">English</option><option value="ro" lang="ro">Română</option><option value="ne" lang="ne">नेपाली</option>
        </select>
      </label>
      <a className="button button-gold header-book" href={l("/book")} aria-current={active === "book" ? "page" : undefined}>{t("Book a table")}</a>
    </div>
  </header>;
}

export function OpenStatus() {
  const { t, locale } = useLanguage();
  const [status, setStatus] = useState<{ open: boolean; text: string } | null>(null);
  useEffect(() => { setStatus(openingStatus(new Date(), locale)); const id = setInterval(() => setStatus(openingStatus(new Date(), locale)), 60_000); return () => clearInterval(id); }, [locale]);
  return <span className="opening-status"><span className={`status-dot ${status?.open ? "is-open" : ""}`} />{status?.text ?? t("See opening hours")}</span>;
}

export function Hours() {
  const { t } = useLanguage();
  return <dl className="hours-list"><div><dt>{t("Monday")}</dt><dd>15:00 – 00:00</dd></div><div><dt>{t("Tuesday")}</dt><dd>{t("Closed")}</dd></div><div><dt>{t("Wednesday – Friday")}</dt><dd>15:00 – 00:00</dd></div><div><dt>{t("Saturday – Sunday")}</dt><dd>13:00 – 01:00</dd></div></dl>;
}

function Footer() {
  const { t, l } = useLanguage();
  return <footer className="site-footer" id="contact"><div className="container footer-grid">
    <section className="footer-hours"><h2>{t("Opening hours")}</h2><Hours /><p className="small muted">{t("Local time in Bucharest")}</p></section>
    <section><h2><DirectionsLink className="footer-directions-title">{t("Come find us")} <Icon name="external" size={18} /></DirectionsLink></h2><p>{restaurant.building}<br />Str. Nicolae Tonitza 13<br />București 030167, Romania</p><DirectionsLink className="text-link">{t("Get directions")} <Icon name="external" size={15} /></DirectionsLink></section>
    <section><h2>{t("Let’s talk")}</h2><a className="phone-link" href={restaurant.phoneHref}>{restaurant.phone}</a><a className="text-link" href={l("/book")}>{t("Make a reservation")} <Icon name="arrow" size={16} /></a><button className="text-link" onClick={() => openDialog("assistant-dialog")}>{t("AI menu assistant")} <Icon name="chat" size={16} /></button></section>
    <section><h2>{t("Follow along")}</h2><a className="social-link" href={restaurant.instagram} target="_blank" rel="noopener noreferrer">Instagram <Icon name="external" size={14} /></a><a className="social-link" href={restaurant.facebook} target="_blank" rel="noopener noreferrer">Facebook <Icon name="external" size={14} /></a><a className="social-link" href={restaurant.tiktok} target="_blank" rel="noopener noreferrer">TikTok <Icon name="external" size={14} /></a><a className="social-link" href={restaurant.experiences} target="_blank" rel="noopener noreferrer">{t("Experiences")} <Icon name="external" size={14} /></a></section>
  </div><div className="footer-bottom container"><span>{t("Global Herbs · Restaurant & Bar")}</span><span>{t("Nepali flavours. Bucharest hospitality.")}</span><a href="#top">{t("Back to top ↑")}</a></div></footer>;
}

export default function SiteShell({ active, children }: { active: "home" | "menu" | "order" | "book"; children: ReactNode }) {
  return <div id="top"><Header active={active} />{children}<Footer /><Assistant /></div>;
}
