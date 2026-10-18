"use client";
import { useEffect, useRef, useState } from "react";
import SiteShell, { Icon, OpenStatus, openDialog } from "./chrome";
import { gallery, restaurant } from "../data/restaurant";

export default function Home() {
  const rail = useRef<HTMLDivElement>(null);
  const lightbox = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [position, setPosition] = useState(0);
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (!lightbox.current?.open) return; if (e.key === "ArrowRight") setSelected(i => ((i ?? 0) + 1) % gallery.length); if (e.key === "ArrowLeft") setSelected(i => ((i ?? 0) + gallery.length - 1) % gallery.length); };
    document.addEventListener("keydown", key); return () => document.removeEventListener("keydown", key);
  }, []);
  function scrollGallery(direction: number) { if (rail.current) rail.current.scrollBy({ left: direction * (rail.current.clientWidth / (window.innerWidth < 700 ? 1.15 : 3)), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }); }
  return <SiteShell active="home"><main id="main">
    <section className="hero-wrap" aria-labelledby="hero-title"><div className="hero container">
      <div className="hero-photo"><img src="/assets/hero-original.webp" alt="Golden fried shrimp with fresh herbs and dipping sauce at Global Herbs" width="1289" height="932" fetchPriority="high" /></div>
      <div className="hero-copy"><p className="eyebrow">RESTAURANT & BAR · BUCHAREST</p><h1 id="hero-title">Global<br /> Herbs</h1><p className="hero-intro">A taste of Nepal,<br /> a place to feel at home.</p><p>Discover the warmth of Nepali cooking, from handmade mo:mo to fragrant curries and hearty dal bhat. Familiar traditions, fresh ingredients, and a warm welcome in the heart of Bucharest.</p><div className="hero-actions"><a href="/menu" className="button button-gold">Explore our menu <Icon name="arrow" size={18} /></a><a className="text-link" href="/book">Book a table</a></div></div>
    </div><div className="visit-strip container"><a href="#contact"><Icon name="clock" size={18} /><OpenStatus /></a><a href={restaurant.maps} target="_blank" rel="noopener noreferrer"><Icon name="pin" size={18} /><span>Str. Nicolae Tonitza 13, Bucharest</span><Icon name="external" size={13} /></a><a href={restaurant.phoneHref} className="strip-phone"><Icon name="phone" size={17} />{restaurant.phone}</a></div></section>
    <section className="food-section" aria-labelledby="food-title"><div className="container"><div className="section-heading"><div><p className="eyebrow">FROM OUR KITCHEN</p><h2 id="food-title">Some of our food</h2></div><div className="kitchen-links"><a className="text-link" href="/menu">View the menu <Icon name="arrow" size={18} /></a><button className="text-link" onClick={() => openDialog("assistant-dialog")}><Icon name="chat" size={18} />AI menu assistant</button></div></div>
      <div className="gallery-rail" ref={rail} onScroll={() => { const el = rail.current; if (el) setPosition(el.scrollLeft / Math.max(1, el.scrollWidth - el.clientWidth)); }}>{gallery.map((item, index) => <button className="gallery-image" key={item.file} aria-label={`Enlarge photo ${index + 1}: ${item.alt}`} onClick={() => { setSelected(index); lightbox.current?.showModal(); }}><img src={`/assets/${item.thumb}`} alt={item.alt} width="480" height="640" loading="lazy" /><span className="gallery-enlarge"><Icon name="expand" size={18} /></span></button>)}</div>
      <div className="gallery-bottom"><p>Made to be shared. Made to be enjoyed.</p><div className="gallery-controls"><button className="icon-button" aria-label="Previous food photos" disabled={position < .01} onClick={() => scrollGallery(-1)}><span className="rotate"><Icon name="arrow" /></span></button><button className="icon-button" aria-label="Next food photos" disabled={position > .99} onClick={() => scrollGallery(1)}><Icon name="arrow" /></button></div></div>
    </div></section>
    <section id="about" className="about-section" aria-labelledby="about-title"><div className="about-card"><p className="eyebrow">OUR KITCHEN, OUR ROOTS</p><h2 id="about-title">About us</h2><span className="ornament" aria-hidden="true">❧</span><p>At Global Herbs, the heart of South Asian cooking meets a love of good, honest food. Our kitchen brings together the vibrant spices and comforting recipes of Nepal and its neighbours.</p><p>From a plate of mo:mo to a slowly cooked curry, we believe a meal is best enjoyed with good company. Come for the flavours. Stay for another conversation around the table.</p><a className="button button-gold" href="/book">Book a table <Icon name="arrow" size={17} /></a></div></section>
  </main><dialog className="lightbox" ref={lightbox} aria-label="Food gallery" onClick={e => { if (e.target === e.currentTarget) lightbox.current?.close(); }}><button className="icon-button lightbox-close" aria-label="Close food gallery" onClick={() => lightbox.current?.close()}><Icon name="close" size={28} /></button><button className="icon-button lightbox-prev" aria-label="Previous photo" onClick={() => setSelected(i => ((i ?? 0) + gallery.length - 1) % gallery.length)}><span className="rotate"><Icon name="arrow" size={26} /></span></button>{selected !== null && <figure><img src={`/assets/${gallery[selected].file}`} alt={gallery[selected].alt} /><figcaption>{gallery[selected].alt}<span>{selected + 1} / {gallery.length}</span></figcaption></figure>}<button className="icon-button lightbox-next" aria-label="Next photo" onClick={() => setSelected(i => ((i ?? 0) + 1) % gallery.length)}><Icon name="arrow" size={26} /></button></dialog></SiteShell>;
}


