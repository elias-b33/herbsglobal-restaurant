import type { BookingRequest } from "./booking-request";

export type DeliveryResult = { sent: true; reference: string } | { sent?: false; message: string; unknown?: boolean };
const unavailable = "We couldn’t send your request. Please try again or call us.";
const uncertain = "We couldn’t confirm delivery. Please call us before sending again.";

// FormSubmit supports browser AJAX submissions. Its servers reject requests
// from the Vercel deployment with HTTP 403, so the server validates/prepares
// the email and the browser performs the documented provider handoff.
export async function submitBooking(details: BookingRequest, requestId: string, website: string, fetcher: typeof fetch = fetch): Promise<DeliveryResult> {
  let prepared: { prepared?: unknown; reference?: unknown; delivery?: { endpoint?: unknown; fields?: unknown }; message?: unknown };
  try {
    const response = await fetcher("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...details, website, requestId }), signal: AbortSignal.timeout(15_000) });
    prepared = await response.json();
    if (!response.ok) return { message: typeof prepared.message === "string" ? prepared.message : unavailable };
    if (prepared.prepared !== true || typeof prepared.reference !== "string" || !prepared.delivery ||
      typeof prepared.delivery.endpoint !== "string" || !/^https:\/\/formsubmit\.co\/ajax\/[A-Za-z0-9%._+@-]+$/.test(prepared.delivery.endpoint) ||
      !prepared.delivery.fields || typeof prepared.delivery.fields !== "object" || Array.isArray(prepared.delivery.fields)) return { message: unavailable };
  } catch { return { message: unavailable }; }

  try {
    const response = await fetcher(prepared.delivery!.endpoint as string, {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(prepared.delivery!.fields), signal: AbortSignal.timeout(15_000),
      // Send the public /book page as the referrer, without language/search data.
      referrer: new URL("/book", typeof location === "undefined" ? "https://herbsglobal-restaurants.vercel.app" : location.origin).href,
      referrerPolicy: "unsafe-url", credentials: "omit",
    });
    if (!response.ok) return response.status >= 500 ? { message: uncertain, unknown: true } : { message: unavailable };
    const answer = await response.json() as { success?: unknown; message?: unknown };
    if (answer.success === true || answer.success === "true") return { sent: true, reference: prepared.reference as string };
    if (typeof answer.message === "string" && /activat/i.test(answer.message)) return { message: "Online requests are not available yet. Please call us to arrange your visit." };
    return { message: unavailable };
  } catch { return { message: uncertain, unknown: true }; }
}
