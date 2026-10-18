"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import SiteShell, { Dialog, Icon, openDialog } from "./chrome";
import { PhoneToConfirm, ServiceHeading, ServiceNotice } from "./service-parts";
import menu from "../data/menu.json";
import { restaurant } from "../data/restaurant";
import { basketDetails, basketKey, basketTotal, money, readBasket, type BasketLine } from "../lib/service-drafts";

const categories = [...new Set(menu.map(item => item.category))];
const normalize = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

export default function Order() {
  const [basket, setBasket] = useState<BasketLine[]>([]);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All dishes & drinks");
  const [notice, setNotice] = useState("");
  const [review, setReview] = useState(false);
  const [basketVisible, setBasketVisible] = useState(false);
  const basketRef = useRef<HTMLElement>(null);
  const reviewTitle = useRef<HTMLHeadingElement>(null);
  const [details, setDetails] = useState({ name: "", phone: "", notes: "" });

  useEffect(() => {
    try { setBasket(readBasket(JSON.parse(localStorage.getItem(basketKey) ?? "[]"))); } catch { /* The basket still works when storage is unavailable. */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(basketKey, JSON.stringify(basket)); } catch { /* Preserve the current visit in memory. */ }
  }, [basket, ready]);
  useEffect(() => { if (review) reviewTitle.current?.focus(); }, [review]);
  useEffect(() => {
    if (!basketRef.current) return;
    const observer = new IntersectionObserver(([entry]) => setBasketVisible(entry.isIntersecting), { threshold: 0.1 });
    observer.observe(basketRef.current);
    return () => observer.disconnect();
  }, []);

  const filtered = useMemo(() => menu.filter(item => (category === "All dishes & drinks" || item.category === category) && normalize(`${item.name} ${item.category}`).includes(normalize(query))), [query, category]);
  const lines = basketDetails(basket);
  const count = lines.reduce((total, item) => total + item.quantity, 0);
  const total = basketTotal(basket);

  function changeQuantity(id: string, delta: number) {
    const item = menu.find(item => item.id === id);
    if (!item) return;
    setBasket(current => {
      const existing = current.find(line => line.id === id);
      if (!existing) return current.length < 50 ? [...current, { id, quantity: 1 }] : current;
      const quantity = Math.min(20, existing.quantity + delta);
      return quantity < 1 ? current.filter(line => line.id !== id) : current.map(line => line.id === id ? { id, quantity } : line);
    });
    setNotice(`${item.name} ${delta > 0 ? "added to" : "removed from"} your basket.`);
  }

  function reviewOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!count) return;
    setReview(true);
  }

  return <SiteShell active="order"><main id="main" className="menu-page native-service-page">
    <ServiceHeading />
    <div className="container"><ServiceNotice />
      <div className="takeaway-layout">
        <section className="takeaway-menu" aria-label="Takeaway menu">
          <div className="menu-tools">
            <label className="search-field"><Icon name="search" size={19} /><span className="sr-only">Search takeaway menu</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search a dish or drink…" maxLength={120} />{query && <button className="icon-button" aria-label="Clear search" onClick={() => setQuery("")}><Icon name="close" size={16} /></button>}</label>
            <label className="category-field"><span className="sr-only">Takeaway category</span><select value={category} onChange={event => setCategory(event.target.value)}><option>All dishes & drinks</option>{categories.map(value => <option key={value}>{value}</option>)}</select></label>
          </div>
          <div className="menu-meta"><p>{filtered.length} {filtered.length === 1 ? "item" : "items"}</p><span>Prices in RON</span></div>
          {!filtered.length ? <div className="empty-state"><h2>Nothing found just yet</h2><p>Try another dish name or choose a different category.</p><button className="button button-green" onClick={() => { setQuery(""); setCategory("All dishes & drinks"); }}>See the full menu</button></div> : <div className="menu-sections">{categories.filter(value => filtered.some(item => item.category === value)).map(value => <section className="menu-category" key={value} aria-labelledby={`takeaway-category-${categories.indexOf(value)}`}>
            <h2 id={`takeaway-category-${categories.indexOf(value)}`}>{value}</h2>
            {filtered.filter(item => item.category === value).map(item => {
              const quantity = basket.find(line => line.id === item.id)?.quantity ?? 0;
              const itemLabel = `${item.name}${item.portion ? ` ${item.portion}` : ""}`;
              return <article className="dish takeaway-dish" key={item.id}>
                <div className="dish-info"><h3>{item.name}</h3>{item.portion && <p>{item.portion}</p>}</div>
                <span className="dish-price">{money(item.price)}<small>RON</small></span>
                <div className={`dish-actions ${quantity ? "quantity-control" : ""}`} role="group" aria-label={`${itemLabel} quantity`}>
                  {quantity > 0 && <button key="remove" aria-label={`Remove one ${itemLabel}`} onClick={() => changeQuantity(item.id, -1)}>−</button>}
                  {quantity > 0 && <span key="quantity" aria-label={`${quantity} in basket`}>{quantity}</span>}
                  <button key="add" className={quantity ? undefined : "add-dish"} aria-label={quantity ? `Add one ${itemLabel}` : `Add ${itemLabel} to basket`} disabled={!ready || quantity >= 20 || (!quantity && basket.length >= 50)} onClick={() => changeQuantity(item.id, 1)}>{quantity ? "+" : <>Add <span aria-hidden="true">+</span></>}</button>
                </div>
              </article>;
            })}
          </section>)}</div>}
          <div className="menu-note"><p>Please ask our team about ingredients and allergens. Takeaway availability and final prices will be confirmed by the restaurant.</p></div>
        </section>
        <aside ref={basketRef} className="takeaway-basket" id="basket" aria-labelledby="basket-title">
          <img className="basket-photo" src="/assets/gallery-01-herbs-food.jpg" alt="A Nepali thali from the Global Herbs kitchen" width="2048" height="1087" />
          <div className="basket-body"><div className="basket-heading"><h2 id="basket-title">Your order</h2><span>{count} {count === 1 ? "item" : "items"}</span></div>
            <p className="basket-collection"><Icon name="pin" size={17} /><span>Collection from Global Herbs<br /><span>Str. Nicolae Tonitza 13, Bucharest</span></span></p>
            {count ? <><ul className="basket-lines">{lines.map(item => <li key={item.id}><div><p>{item.name}</p><span className="small">{item.portion}</span><div className="quantity-control" role="group" aria-label={`${item.name} basket quantity`}><button aria-label={`Remove one ${item.name} from basket`} onClick={() => changeQuantity(item.id, -1)}>−</button><span>{item.quantity}</span><button aria-label={`Add one ${item.name} to basket`} disabled={item.quantity >= 20} onClick={() => changeQuantity(item.id, 1)}>+</button></div></div><span>{money(item.price * item.quantity)} <small>RON</small></span></li>)}</ul><div className="basket-total"><span>Estimated total</span><span>{money(total)} <small>RON</small></span></div><button className="button button-green basket-review" onClick={() => { setReview(false); openDialog("order-review"); }}>Review order <Icon name="arrow" size={18} /></button><p className="small basket-disclosure">Preview only. Your basket is saved on this device; no order is sent.</p></> : <div className="basket-empty"><h3>Your basket is empty</h3><p>Add a dish from the menu to get started.</p></div>}
            <a href={restaurant.phoneHref} className="basket-phone"><Icon name="phone" size={16} />Prefer to call? {restaurant.phone}</a>
          </div>
        </aside>
      </div>
    </div>
    {count > 0 && !basketVisible && <a className="mobile-basket-bar" href="#basket"><span>View basket <span>({count})</span></span><span>{money(total)} RON <Icon name="arrow" size={18} /></span></a>}
    <p className="sr-only" role="status">{notice}</p>
    <Dialog id="order-review" label="order review" className="order-review-dialog">
      <p className="eyebrow">TAKEAWAY · PREVIEW</p><h2 id="order-review-title" ref={reviewTitle} tabIndex={-1}>{review ? "Your order details" : "Review your takeaway"}</h2>
      <p className="review-intro">{review ? "Keep these details to hand when you call us." : "Add your details to preview the next step. Nothing is sent or reserved."}</p>
      <ul className="order-summary-lines">{lines.map(item => <li key={item.id}><span>{item.quantity} × {item.name}</span><span>{money(item.price * item.quantity)} RON</span></li>)}</ul>
      <div className="basket-total"><span>Estimated total</span><span>{money(total)} RON</span></div>
      {review ? <><dl className="review-details"><div><dt>Name</dt><dd>{details.name}</dd></div><div><dt>Phone</dt><dd>{details.phone}</dd></div><div><dt>Collection</dt><dd>Global Herbs, Str. Nicolae Tonitza 13<br />Time to be confirmed by phone</dd></div>{details.notes && <div><dt>Notes</dt><dd>{details.notes}</dd></div>}</dl><button className="text-link" onClick={() => setReview(false)}>Edit your details <Icon name="arrow" size={16} /></button><PhoneToConfirm /></> : <form className="service-form order-details-form" onSubmit={reviewOrder}><label>Your name<input autoComplete="name" value={details.name} onChange={event => setDetails({ ...details, name: event.target.value })} required maxLength={100} /></label><label>Phone number<input type="tel" autoComplete="tel" value={details.phone} onChange={event => setDetails({ ...details, phone: event.target.value })} required pattern={"[+0-9 .\\(\\)\\-]{7,30}"} title="Enter a phone number, including your country code." maxLength={30} /></label><label>Order notes <span className="field-optional">(optional)</span><textarea value={details.notes} onChange={event => setDetails({ ...details, notes: event.target.value })} maxLength={500} rows={3} placeholder="Anything you’d like to ask the team" /></label><p className="small">Collection time and payment will be agreed with the restaurant. These details stay on this page and are cleared when you leave.</p><button className="button button-green" type="submit" disabled={!count}>Preview order details <Icon name="arrow" size={18} /></button></form>}
    </Dialog>
  </main></SiteShell>;
}
