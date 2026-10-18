"use client";

import { Icon } from "./chrome";
import { restaurant } from "../data/restaurant";

export function ServiceNotice({ booking = false }: { booking?: boolean }) {
  return <aside className="service-notice" aria-label="Preview information">
    <span className="eyebrow">Preview</span>
    <p>{booking ? "Online booking is being set up. Explore the form below; no reservation will be sent." : "Online ordering is being set up. Explore the menu and basket; no order will be sent."} <a href={restaurant.phoneHref}>Call us to {booking ? "book" : "order"} <Icon name="phone" size={15} /></a></p>
  </aside>;
}

export function ServiceHeading({ booking = false }: { booking?: boolean }) {
  return <div className="menu-heading container native-service-heading">
    <nav className="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span aria-current="page">{booking ? "Book a table" : "Order takeaway"}</span></nav>
    <div className="menu-title-row"><div><p className="eyebrow">{booking ? "COME SPEND SOME TIME WITH US" : "THE GLOBAL HERBS KITCHEN"}</p><h1>{booking ? "Book a table" : "Order takeaway"}</h1><p>{booking ? "Nepali flavours and a warm welcome, in the heart of Bucharest." : "A little Nepal, at your table. Choose your favourites for collection."}</p></div><a className="text-link" href="/menu">View our menu <Icon name="arrow" size={17} /></a></div>
  </div>;
}

export function PhoneToConfirm({ booking = false }: { booking?: boolean }) {
  return <div className="service-confirm-note"><p>{booking ? "This reservation has not been sent. Please call us to check availability and book your table." : "This order has not been sent. Please call us to confirm your dishes, collection time and payment."}</p><a href={restaurant.phoneHref} className="button button-green"><Icon name="phone" size={18} />{restaurant.phone}</a></div>;
}
