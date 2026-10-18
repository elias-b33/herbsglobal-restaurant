"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { restaurant } from "../data/restaurant";
import { openingStatus } from "../lib/opening";
import Assistant from "./assistant";

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
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] ?? paths.arrow}</svg>;
}

export function openDialog(id: string) { (document.getElementById(id) as HTMLDialogElement | null)?.showModal(); }

export function Dialog({ id, label, children, className = "" }: { id: string; label: string; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  return <dialog ref={ref} id={id} className={`dialog ${className}`} aria-labelledby={`${id}-title`} onClick={event => {
    if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) ref.current?.close(); }
  }}>
    <button className="icon-button dialog-close" aria-label={`Close ${label}`} onClick={() => ref.current?.close()}><Icon name="close" /></button>{children}
  </dialog>;
}

function Header({ active }: { active: "home" | "menu" }) {
  const [expanded, setExpanded] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const key = (event: KeyboardEvent) => { if (event.key === "Escape" && expanded) { setExpanded(false); toggle.current?.focus(); } };
    window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key);
  }, [expanded]);
  return <header className="site-header">
    <a href="#main" className="skip-link">Skip to content</a>
    <div className="header-inner container">
      <a className="brand" href="/" aria-label="Global Herbs home"><img src="/assets/logo-original.webp" width="112" height="77" alt="Global Herbs" /></a>
      <button ref={toggle} className="mobile-toggle icon-button" aria-controls="main-nav" aria-expanded={expanded} aria-label={expanded ? "Close navigation" : "Open navigation"} onClick={() => setExpanded(!expanded)}><Icon name={expanded ? "close" : "menu"} size={24} /></button>
      <nav id="main-nav" aria-label="Main navigation" className={expanded ? "main-nav expanded" : "main-nav"} onClick={() => setExpanded(false)}>
        <a href="/" aria-current={active === "home" ? "page" : undefined}>Home</a><a href="/#about">About</a><a href="/menu" aria-current={active === "menu" ? "page" : undefined}>Our menu</a><a href="/#contact">Contact</a><a href={restaurant.ordering} target="_blank" rel="noopener noreferrer" className="order-link">Order online <Icon name="external" size={14} /></a>
      </nav>
      <button className="button button-gold header-book" onClick={() => openDialog("booking-dialog")}>Book a table</button>
    </div>
  </header>;
}

export function OpenStatus() {
  const [status, setStatus] = useState<{ open: boolean; text: string } | null>(null);
  useEffect(() => { setStatus(openingStatus()); const id = setInterval(() => setStatus(openingStatus()), 60_000); return () => clearInterval(id); }, []);
  return <span className="opening-status"><span className={`status-dot ${status?.open ? "is-open" : ""}`} />{status?.text ?? "See opening hours"}</span>;
}

export function Hours() {
  return <dl className="hours-list"><div><dt>Monday</dt><dd>15:00 – 00:00</dd></div><div><dt>Tuesday</dt><dd>Closed</dd></div><div><dt>Wednesday – Friday</dt><dd>15:00 – 00:00</dd></div><div><dt>Saturday – Sunday</dt><dd>13:00 – 01:00</dd></div></dl>;
}

function Footer() {
  return <footer className="site-footer" id="contact"><div className="container footer-grid">
    <section className="footer-hours"><h2>Opening hours</h2><Hours /><p className="small muted">Local time in Bucharest</p></section>
    <section><h2>Come find us</h2><p>{restaurant.building}<br />Str. Nicolae Tonitza 13<br />București 030167, Romania</p><a className="text-link" href={restaurant.maps} target="_blank" rel="noopener noreferrer">Get directions <Icon name="external" size={15} /></a></section>
    <section><h2>Let’s talk</h2><a className="phone-link" href={restaurant.phoneHref}>{restaurant.phone}</a><button className="text-link" onClick={() => openDialog("booking-dialog")}>Make a reservation <Icon name="arrow" size={16} /></button><button className="text-link" onClick={() => openDialog("assistant-dialog")}>Menu assistance <Icon name="chat" size={16} /></button></section>
    <section><h2>Follow along</h2><a className="social-link" href={restaurant.instagram} target="_blank" rel="noopener noreferrer">Instagram <Icon name="external" size={14} /></a><a className="social-link" href={restaurant.facebook} target="_blank" rel="noopener noreferrer">Facebook <Icon name="external" size={14} /></a><a className="social-link" href={restaurant.tiktok} target="_blank" rel="noopener noreferrer">TikTok <Icon name="external" size={14} /></a><a className="social-link" href={restaurant.experiences} target="_blank" rel="noopener noreferrer">Experiences <Icon name="external" size={14} /></a></section>
  </div><div className="footer-bottom container"><span>Global Herbs · Restaurant & Bar</span><span>Nepali flavours. Bucharest hospitality.</span><a href="#top">Back to top ↑</a></div></footer>;
}

function Booking() {
  return <Dialog id="booking-dialog" label="reservations" className="booking-dialog"><p className="eyebrow">WE’D LOVE TO WELCOME YOU</p><h2 id="booking-dialog-title">A table at<br />Global Herbs</h2><p>Join us for a little taste of Nepal. Choose your date, time and party size in our reservation system.</p><a className="button button-green" href={restaurant.reservations} target="_blank" rel="noopener noreferrer">Find a table <Icon name="external" size={17} /></a><p className="small">Opens our existing booking page. Your table is confirmed there.</p><div className="booking-contact"><span>For groups or a personal request</span><a href={restaurant.phoneHref}>{restaurant.phone}</a></div><Hours /></Dialog>;
}

export default function SiteShell({ active, children }: { active: "home" | "menu"; children: ReactNode }) {
  return <div id="top"><Header active={active} />{children}<Footer /><Booking /><Assistant /></div>;
}
