import { hours, restaurant } from "../data/restaurant";
import { translate, type Locale } from "./i18n";

export function openingStatus(now = new Date(), locale: Locale = "en") {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: restaurant.timezone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(now);
  const part = (name: string) => parts.find(p => p.type === name)?.value ?? "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(part("weekday"));
  const minute = Number(part("hour")) * 60 + Number(part("minute"));
  const today = hours[day];
  const yesterday = hours[(day + 6) % 7];
  const format = (minutes: number) => `${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  if (yesterday && yesterday.close > 1440 && minute < yesterday.close - 1440) {
    return { open: true, text: translate(locale, "Open until {time}", { time: format(yesterday.close) }) };
  }
  if (today && minute >= today.open && minute < today.close) return { open: true, text: translate(locale, "Open until {time}", { time: format(today.close) }) };
  if (today && minute < today.open) return { open: false, text: translate(locale, "Opens today at {time}", { time: format(today.open) }) };
  return { open: false, text: translate(locale, "Currently closed · see opening hours") };
}
