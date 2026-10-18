import menu from "../data/menu.json";
import { hours, restaurant } from "../data/restaurant";

export type BasketLine = { id: string; quantity: number };
export const basketKey = "global-herbs-basket-v1";
const itemsById = new Map(menu.map(item => [item.id, item]));

// A basket is a device-local draft. Stored prices and unknown items are never trusted.
export function readBasket(value: unknown): BasketLine[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.filter((line): line is BasketLine => {
    if (!line || typeof line !== "object" || typeof line.id !== "string" || !itemsById.has(line.id) || seen.has(line.id) || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 20) return false;
    seen.add(line.id);
    return true;
  }).slice(0, 50).map(({ id, quantity }) => ({ id, quantity }));
}

export function basketDetails(lines: BasketLine[]) {
  return readBasket(lines).map(line => ({ ...itemsById.get(line.id)!, quantity: line.quantity }));
}

export function basketTotal(lines: BasketLine[]) {
  return basketDetails(lines).reduce((total, item) => total + Math.round(item.price * 100) * item.quantity, 0) / 100;
}

export const money = (value: number) => new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 }).format(value);

export function localDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: restaurant.timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const part = (name: string) => parts.find(value => value.type === name)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function preferredTimes(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
  const day = new Date(`${date}T12:00:00Z`);
  if (!Number.isFinite(day.getTime()) || day.toISOString().slice(0, 10) !== date) return [];
  const schedule = hours[day.getUTCDay()];
  if (!schedule) return [];
  const times = [];
  for (let minute = schedule.open; minute < schedule.close; minute += 30) {
    const time = `${String(Math.floor(minute / 60) % 24).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
    times.push({ value: String(minute), label: `${time}${minute >= 1440 ? " (next day)" : ""}` });
  }
  return times;
}

export function visitError(date: string, time: string, now = new Date()) {
  const today = localDate(now);
  if (!date || date < today) return "Please choose today or a future date.";
  const times = preferredTimes(date);
  if (!times.length) return "We’re closed on Tuesdays. Please choose another day.";
  if (!times.some(option => option.value === time)) return "Please choose a preferred time.";
  if (date === today) {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: restaurant.timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
    const minutes = Number(parts.find(part => part.type === "hour")?.value) * 60 + Number(parts.find(part => part.type === "minute")?.value);
    if (Number(time) <= minutes) return "That time has passed. Please choose a later time.";
  }
  return "";
}

export function displayDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
}
