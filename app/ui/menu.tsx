"use client";
import { useLanguage } from "./language";
import { matchesMenuSearch } from "../lib/i18n";
import { useEffect, useMemo, useState } from "react";
import SiteShell, { Icon, openDialog } from "./chrome";
import items from "../data/menu.json";
import { restaurant } from "../data/restaurant";

const categories = [...new Set(items.map(item => item.category))];
const storageKey = "global-herbs-favourites-v1";

export default function Menu() {
  const { t, l, locale, money, countText } = useLanguage();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
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
    try { localStorage.setItem(storageKey, JSON.stringify(next)); setNotice(next.includes(id) ? t("Added to your favourites.") : t("Removed from your favourites.")); }
    catch { setNotice(t("Saved for this visit. Your browser does not allow local storage.")); }
  }
  const filtered = useMemo(() => items.filter(item =>
    (category === "all" || item.category === category) &&
    (!savedOnly || saved.includes(item.id)) &&
    matchesMenuSearch(item, query, locale)
  ), [query, category, saved, savedOnly, locale]);
  return <SiteShell active="menu"><main id="main" className="menu-page">
    <div className="menu-heading container"><a className="breadcrumb" href={l("/")}>{t("Home")} <span>/</span>  {t("Our menu")}</a><div className="menu-title-row"><div><p className="eyebrow">{t("THE GLOBAL HERBS KITCHEN")}</p><h1>{t("Food & drinks")}</h1><p>{t("From a little something to share to a full Nepali feast.")}</p></div><button className="text-link assistant-invitation" onClick={() => openDialog("assistant-dialog")}><Icon name="chat" />{t("Ask the AI menu assistant")}</button></div></div>
    <div className="menu-content container"><div className="menu-tools">
      <label className="search-field"><Icon name="search" size={19} /><span className="sr-only">{t("Search the menu")}</span><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={t("Search a dish or drink…")} maxLength={120} />{query && <button className="icon-button" onClick={() => setQuery("")} aria-label={t("Clear search")}><Icon name="close" size={16} /></button>}</label>
      <label className="category-field"><span className="sr-only">{t("Menu category")}</span><select value={category} onChange={e => setCategory(e.target.value)}><option value="all">{t("All dishes & drinks")}</option>{categories.map(value => <option key={value} value={value}>{t(value)}</option>)}</select></label>
      <button className={`favourites-toggle ${savedOnly ? "selected" : ""}`} aria-pressed={savedOnly} onClick={() => setSavedOnly(!savedOnly)}><Icon name="heart" size={18} />{t("Favourites")} <span>{saved.length}</span></button>
    </div><div className="menu-meta"><p role="status">{countText(filtered.length)}{savedOnly ? t(" in your favourites") : t(" on the menu")}</p><span>{t("Prices in RON")}</span></div>
    {filtered.length === 0 ? <div className="empty-state"><h2>{savedOnly && saved.length === 0 ? t("Your favourites start here") : t("Nothing found just yet")}</h2><p>{savedOnly && saved.length === 0 ? t("Use the heart beside a dish to keep it for later on this device.") : t("Try another dish name or choose a different category.")}</p><button className="button button-green" onClick={() => { setCategory("all"); setQuery(""); setSavedOnly(false); }}>{t("See the full menu")}</button></div> : <div className="menu-sections">{categories.filter(value => filtered.some(item => item.category === value)).map(value => <section className="menu-category" key={value} aria-labelledby={`category-${categories.indexOf(value)}`}><h2 id={`category-${categories.indexOf(value)}`}>{t(value)}</h2><div className="dish-grid">{filtered.filter(item => item.category === value).map(item => <article className="dish" id={`dish-${item.id}`} key={item.id}><div className="dish-info"><h3>{t(item.name)}</h3>{item.portion && <p>{t(item.portion)}</p>}</div><span className="dish-price">{money(item.price)}<small>RON</small></span><button className={`icon-button save-dish ${saved.includes(item.id) ? "saved" : ""}`} aria-pressed={saved.includes(item.id)} aria-label={t(saved.includes(item.id) ? "Remove {item} from favourites" : "Save {item} to favourites", { item: `${t(item.name)}${item.portion ? ` ${t(item.portion)}` : ""}` })} onClick={() => toggleSaved(item.id)}><Icon name="heart" size={18} /></button></article>)}</div></section>)}</div>}
    <div className="menu-note"><p>{t("Please ask our team about ingredients and allergens. Prices and availability are confirmed by the restaurant.")}</p><a href={`${restaurant.source}menu`} target="_blank" rel="noopener noreferrer">{t("Original menu & dish descriptions")} <Icon name="external" size={14} /></a></div>
    <div className="menu-order"><div><h2>{t("A meal at your place?")}</h2><p>{t("Choose your dishes and order for takeaway.")}</p></div><a className="button button-green" href={l("/order")}>{t("Order online")} <Icon name="arrow" size={17} /></a></div>
    <p className="sr-only" aria-live="polite">{notice}</p></div>
  </main></SiteShell>;
}
