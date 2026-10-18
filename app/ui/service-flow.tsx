"use client";

import { useEffect, useState } from "react";
import { Icon } from "./chrome";
import { restaurant } from "../data/restaurant";

export default function ServiceFlow({ kind }: { kind: "order" | "book" }) {
  const ordering = kind === "order";
  const [loaded, setLoaded] = useState(false);
  const [slow, setSlow] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const source = ordering ? restaurant.ordering : restaurant.reservations;
  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), 12_000);
    return () => window.clearTimeout(timer);
  }, [attempt]);
  return <main id="main" className={`service-page ${ordering ? "order-page" : "reservation-page"}`}>
      <header className="service-toolbar"><a className="service-return" href={ordering ? "/menu" : "/"}><span className="rotate"><Icon name="arrow" size={18} /></span><span>Back to {ordering ? "our menu" : "Global Herbs"}</span></a><h1>{ordering ? "Order takeaway" : "Book a table"}</h1><a href={source} target="_blank" rel="noopener noreferrer">Open separately <Icon name="external" size={16} /></a></header>
      {!loaded && !slow && <p className="service-loading" role="status">Loading {ordering ? "the restaurant’s order menu" : "the reservation form"}…</p>}
      {!loaded && slow && <p className="service-loading" role="status">If the form hasn’t appeared, <a href={source} target="_blank" rel="noopener noreferrer">open it separately</a>.</p>}
      <iframe key={attempt} className="service-frame" src={source} title={ordering ? "Global Herbs live takeaway menu and checkout" : "Global Herbs live table reservations"} onLoad={() => setLoaded(true)} onError={() => { setLoaded(false); setSlow(true); }} allow="payment" referrerPolicy="strict-origin-when-cross-origin" />
      <div className="service-footnote"><p>{ordering ? "Your order goes directly to the restaurant’s existing ordering system. Pickup times, availability and payment options are shown at checkout." : "Your reservation goes directly to the restaurant’s existing booking system. Your table is booked only when that system shows a confirmation."}</p><p>Having trouble? <a href={source} target="_blank" rel="noopener noreferrer">Open the {ordering ? "order menu" : "booking form"} directly</a> or <button onClick={() => { setLoaded(false); setSlow(false); setAttempt(value => value + 1); }}>reload it</button>.</p></div>
  </main>;
}
