"use client";
import { useEffect, useMemo, useState } from "react";
import SiteShell, { Icon, openDialog } from "./chrome";
import items from "../data/menu.json";
import { restaurant } from "../data/restaurant";

const categories = [...new Set(items.map(item => item.category))];
const storageKey = "global-herbs-favourites-v1";
const normalize = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

export default function Menu() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All dishes & drinks");
  const [savedOnly, setSavedOnly] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    try { const value = JSON.parse(localStorage.getItem(storageKey) ?? "[]"); if (Array.isArray(value)) setSaved(value.filter(id => typeof id === "string" && items.some(item => item.id === id))); } catch { /* A blocked storage area does not prevent menu browsing. */ }
    const parameters = new URLSearchParams(window.location.search); if (parameters.get("q")) setQuery(parameters.get("q")!.slice(0, 120));
  }, []);
  function toggleSaved(id: string) {
    const next = saved.includes(id) ? saved.filter(value => value !== id) : [...saved, id];
    setSaved(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); setNotice(next.includes(id) ? "Added to your favourites." : "Removed from your favourites."); }
    catch { setNotice("Saved for this visit. Your browser does not allow local storage."); }
  }
  const filtered = useMemo(() => items.filter(item =>
    (category === "All dishes & drinks" || item.category === category) &&
    (!savedOnly || saved.includes(item.id)) &&
    normalize(`${item.name} ${item.category}`).includes(normalize(query))
  ), [query, category, saved, savedOnly]);
  return <SiteShell active="menu"><main id="main" className="menu-page">
    <div className="menu-heading container"><a className="breadcrumb" href="/">Home <span>/</span> Our menu</a><div className="menu-title-row"><div><p className="eyebrow">THE GLOBAL HERBS KITCHEN</p><h1>Food & drinks</h1><p>From a little something to share to a full Nepali feast.</p></div><button className="text-link assistant-invitation" onClick={() => openDialog("assistant-dialog")}><Icon name="chat" />Need a hand choosing?</button></div></div>
    <div className="menu-content container"><div className="menu-tools">
      <label className="search-field"><Icon name="search" size={19} /><span className="sr-only">Search the menu</span><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search a dish or drink…" maxLength={120} />{query && <button className="icon-button" onClick={() => setQuery("")} aria-label="Clear search"><Icon name="close" size={16} /></button>}</label>
      <label className="category-field"><span className="sr-only">Menu category</span><select value={category} onChange={e => setCategory(e.target.value)}><option>All dishes & drinks</option>{categories.map(value => <option key={value}>{value}</option>)}</select></label>
      <button className={`favourites-toggle ${savedOnly ? "selected" : ""}`} aria-pressed={savedOnly} onClick={() => setSavedOnly(!savedOnly)}><Icon name="heart" size={18} />Favourites <span>{saved.length}</span></button>
    </div><div className="menu-meta"><p role="status">{filtered.length} {filtered.length === 1 ? "item" : "items"}{savedOnly ? " in your favourites" : " on the menu"}</p><span>Prices in RON</span></div>
    {filtered.length === 0 ? <div className="empty-state"><h2>{savedOnly && saved.length === 0 ? "Your favourites start here" : "Nothing found just yet"}</h2><p>{savedOnly && saved.length === 0 ? "Use the heart beside a dish to keep it for later on this device." : "Try another dish name or choose a different category."}</p><button className="button button-green" onClick={() => { setCategory("All dishes & drinks"); setQuery(""); setSavedOnly(false); }}>See the full menu</button></div> : <div className="menu-sections">{categories.filter(value => filtered.some(item => item.category === value)).map(value => <section className="menu-category" key={value} aria-labelledby={`category-${categories.indexOf(value)}`}><h2 id={`category-${categories.indexOf(value)}`}>{value}</h2><div className="dish-grid">{filtered.filter(item => item.category === value).map(item => <article className="dish" key={item.id}><div className="dish-info"><h3>{item.name}</h3>{item.portion && <p>{item.portion}</p>}</div><span className="dish-price">{item.price}<small>RON</small></span><button className={`icon-button save-dish ${saved.includes(item.id) ? "saved" : ""}`} aria-pressed={saved.includes(item.id)} aria-label={`${saved.includes(item.id) ? "Remove" : "Save"} ${item.name}${item.portion ? ` ${item.portion}` : ""}${saved.includes(item.id) ? " from" : " to"} favourites`} onClick={() => toggleSaved(item.id)}><Icon name="heart" size={18} /></button></article>)}</div></section>)}</div>}
    <div className="menu-note"><p>Please ask our team about ingredients and allergens. Prices and availability are confirmed by the restaurant.</p><a href={`${restaurant.source}menu`} target="_blank" rel="noopener noreferrer">Original menu & dish descriptions <Icon name="external" size={14} /></a></div>
    <div className="menu-order"><div><h2>A meal at your place?</h2><p>Order from our existing online menu.</p></div><a className="button button-green" href={restaurant.ordering} target="_blank" rel="noopener noreferrer">Order online <Icon name="external" size={17} /></a></div>
    <p className="sr-only" aria-live="polite">{notice}</p></div>
  </main></SiteShell>;
}
