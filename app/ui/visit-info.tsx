"use client";
import { restaurant } from "../data/restaurant";
import { Hours, Icon } from "./chrome";
import { useLanguage } from "./language";
import DirectionsLink from "./directions-link";

export default function VisitInfo() {
  const { t, l } = useLanguage();
  return <section className="visit-info container" aria-labelledby="visit-title">
    <div className="visit-info-heading"><p className="eyebrow">{t("NEPALI COOKING IN BUCHAREST")}</p><h2 id="visit-title">{t("Planning your visit")}</h2><p>{t("A few things to know before you join us.")}</p></div>
    <div className="visit-questions">
      <details open><summary>{t("Where can I find Global Herbs?")}</summary><div><p>{restaurant.building}<br />{restaurant.streetAddress}<br />{restaurant.locality} {restaurant.postalCode}, Romania</p><DirectionsLink className="text-link">{t("Get directions")} <Icon name="external" size={15} /></DirectionsLink></div></details>
      <details><summary>{t("What food do you serve?")}</summary><div><p>{t("Our Nepali menu includes mo:mo dumplings, curries, dal bhat and biryani, alongside drinks from the bar. Browse the menu for dishes, portions and prices in RON.")}</p><a className="text-link" href={l("/menu")}>{t("View the menu")} <Icon name="arrow" size={16} /></a></div></details>
      <details><summary>{t("When are you open?")}</summary><div><Hours /><p className="small muted">{t("Local time in Bucharest")}. {t("Weekend closing time is 01:00 the following morning.")}</p></div></details>
      <details><summary>{t("Can I ask about ingredients or a table?")}</summary><div><p>{t("Please call our team to discuss ingredients, allergens or a table before your visit. The restaurant will confirm your arrangements directly.")}</p><a className="text-link" href={restaurant.phoneHref}>{restaurant.phone} <Icon name="phone" size={16} /></a></div></details>
    </div>
  </section>;
}
