import { localDate, preferredTimes, visitError } from "./service-drafts";

export const groupThreshold = 10;
export const groupOccasions = ["celebration", "company", "tour", "other"] as const;
export const groupMenus = ["discuss", "individual", "unsure"] as const;
export type BookingRequest = {
  date: string;
  time: string;
  guests: number;
  name: string;
  email: string;
  phone: string;
  notes: string;
  flexibleDate: boolean;
  flexibleTime: boolean;
  occasion: string;
  menu: string;
  budget: string;
};
export const occasionLabels: Record<string, string> = {
  celebration: "Birthday or celebration", company: "Company or team meal",
  tour: "Tour or organised group", other: "Another occasion",
};
export const menuLabels: Record<string, string> = {
  discuss: "Discuss a group menu", individual: "Individual menu choices", unsure: "Help us decide",
};

export function validateBooking(value: unknown, now = new Date()): { data: BookingRequest; error?: never } | { error: string; data?: never } {
  const fail = (error: string) => ({ error });
  if (!value || typeof value !== "object" || Array.isArray(value)) return fail("Please check your booking details.");
  const v = value as Record<string, unknown>;
  const fields = ["date", "time", "name", "email", "phone", "notes", "occasion", "menu", "budget"] as const;
  if (fields.some(key => typeof v[key] !== "string")) return fail("Please check your booking details.");
  if (typeof v.guests !== "number" || !Number.isInteger(v.guests) || v.guests < 1 || v.guests > 999) return fail("Please enter a guest count between 1 and 999.");
  if (typeof v.flexibleDate !== "boolean" || typeof v.flexibleTime !== "boolean") return fail("Please check your booking details.");
  const data = Object.fromEntries(fields.map(key => [key, (v[key] as string).trim()])) as Omit<BookingRequest, "guests" | "flexibleDate" | "flexibleTime">;
  const isGroup = v.guests > groupThreshold;
  const date = new Date(`${data.date}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== data.date) return fail("Please choose a valid date.");
  if (data.date < localDate(now)) return fail("Please choose today or a future date.");
  const times = preferredTimes(data.date);
  if (!times.length) return fail("We’re closed on Tuesdays. Please choose another day.");
  const flexibleTime = isGroup && v.flexibleTime;
  if (!flexibleTime) {
    const error = visitError(data.date, data.time, now);
    if (error) return fail(error);
  }
  if (data.name.length < 2 || data.name.length > 100 || /[\r\n\x00-\x1f]/.test(data.name)) return fail("Please enter your full name.");
  if (data.email.length > 200 || /[\x00-\x1f\x7f]/.test(data.email) || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(data.email)) return fail("Please enter a valid email address.");
  if (!/^[+0-9 .()\-]{7,30}$/.test(data.phone) || data.phone.replace(/\D/g, "").length < 7) return fail("Please enter a valid phone number.");
  if (data.notes.length > 1500 || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(data.notes)) return fail("Please keep your message within 1,500 characters.");
  if (isGroup && data.occasion && !(groupOccasions as readonly string[]).includes(data.occasion)) return fail("Please check your group preferences.");
  if (isGroup && !(groupMenus as readonly string[]).includes(data.menu)) return fail("Please check your group preferences.");
  if (isGroup && data.budget && (!/^\d{1,5}(\.\d{1,2})?$/.test(data.budget) || Number(data.budget) <= 0)) return fail("Please enter a valid budget in RON or leave it empty.");
  return { data: { ...data, guests: v.guests, flexibleDate: isGroup && v.flexibleDate,
    flexibleTime, time: flexibleTime ? "" : data.time,
    occasion: isGroup ? data.occasion : "", menu: isGroup ? data.menu : "", budget: isGroup ? data.budget : "" } };
}
