"use client";
import { useLanguage } from "./language";

import { Icon } from "./chrome";
import { restaurant } from "../data/restaurant";

export function ServiceNotice({ booking = false }: { booking?: boolean }) {
  const { t } = useLanguage();
  return <aside className="service-notice" aria-label={t("Preview information")}>
    <span className="eyebrow">{t("Preview")}</span>
    <p>{booking ? t("Online booking is being set up. Explore the form below; no reservation will be sent.") : t("Online ordering is being set up. Explore the menu and basket; no order will be sent.")} <a href={restaurant.phoneHref}>{t(booking ? "Call us to book" : "Call us to order")} <Icon name="phone" size={15} /></a></p>
  </aside>;
}

export function ServiceHeading({ booking = false }: { booking?: boolean }) {
  const { t, l } = useLanguage();
  return <div className="menu-heading container native-service-heading">
    <nav className="breadcrumb" aria-label={t("Breadcrumb")}><a href={l("/")}>{t("Home")}</a><span aria-hidden="true">/</span><span aria-current="page">{booking ? t("Book a table") : t("Order takeaway")}</span></nav>
    <div className="menu-title-row"><div><p className="eyebrow">{booking ? t("COME SPEND SOME TIME WITH US") : t("THE GLOBAL HERBS KITCHEN")}</p><h1>{booking ? t("Book a table") : t("Order takeaway")}</h1><p>{booking ? t("Nepali flavours and a warm welcome, in the heart of Bucharest.") : t("A little Nepal, at your table. Choose your favourites for collection.")}</p></div><a className="text-link" href={l("/menu")}>{t("View our menu")} <Icon name="arrow" size={17} /></a></div>
  </div>;
}

export function PhoneToConfirm({ booking = false }: { booking?: boolean }) {
  const { t } = useLanguage();
  return <div className="service-confirm-note"><p>{booking ? t("This reservation has not been sent. Please call us to check availability and book your table.") : t("This order has not been sent. Please call us to confirm your dishes, collection time and payment.")}</p><a href={restaurant.phoneHref} className="button button-green"><Icon name="phone" size={18} />{restaurant.phone}</a></div>;
}
