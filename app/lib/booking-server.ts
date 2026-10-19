import { groupThreshold, occasionLabels, validateBooking, type BookingRequest } from "./booking-request";
import { preferredTimes } from "./service-drafts";

type Settings = { recipient: string; formUrl: string; platform?: "vercel" | "cloudflare" };
type Result = { status: number; body: { code?: string; message?: string; reference?: string; prepared?: boolean; delivery?: { endpoint: string; fields: Record<string, string> } } };
type Dependencies = { now?: () => Date };
const limitBytes = 16_000;
const retention = 15 * 60_000;
const reply = (result: Result) => Response.json(result.body, { status: result.status, headers: {
  "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...(result.status === 429 ? { "Retry-After": "900" } : {}),
} });
const failure = (status: number, code: string, message: string): Result => ({ status, body: { code, message } });

export function bookingEmail(data: BookingRequest, reference: string, formUrl: string) {
  const group = data.guests > groupThreshold;
  return {
    _subject: `Global Herbs | ${group ? "GROUP ENQUIRY" : "Table request"} | ${data.guests} guests | ${data.date} | ${reference}`,
    _template: "table", _url: formUrl, _replyto: data.email, _honey: "",
    "Request type": group ? "Group enquiry — capacity and seating must be discussed" : "Table booking request",
    "Status": "NOT CONFIRMED. Please reply to the guest or call them before reserving any table.",
    "Reference": reference, "Guests": String(data.guests), "Preferred date": data.date,
    "Preferred arrival": data.flexibleTime ? "Flexible — please arrange with the guest" : preferredTimes(data.date).find(time => time.value === data.time)!.label,
    "Time zone": "Europe/Bucharest", "Date flexibility": data.flexibleDate ? "Alternative dates are possible" : "Preferred date as shown",
    name: data.name, email: data.email, "Phone": data.phone,
    ...(group ? { "Occasion": occasionLabels[data.occasion] || "Not specified" } : {}),
    "Guest notes": data.notes || "None", "Next step": "Use Reply to contact the guest. This email does not confirm availability or a booking.",
  };
}

export function createBookingHandler(settings: Settings, dependencies: Dependencies = {}) {
  const now = dependencies.now ?? (() => new Date());
  const rates = new Map<string, { count: number; expires: number }>();
  // Keep only fingerprints and references in memory, never contact details.
  // Delivery uses FormSubmit's documented browser AJAX flow.
  const submissions = new Map<string, { fingerprint: string; expires: number; reference: string }>();
  const prepared = (data: BookingRequest, reference: string) => reply({ status: 200, body: {
    prepared: true, reference, delivery: {
      endpoint: `https://formsubmit.co/ajax/${encodeURIComponent(settings.recipient)}`,
      fields: bookingEmail(data, reference, settings.formUrl),
    },
  } });

  return async (request: Request): Promise<Response> => {
    if (request.method !== "POST") return reply(failure(405, "METHOD", "Method not allowed."));
    if (request.headers.get("origin") !== new URL(request.url).origin) return reply(failure(403, "ORIGIN", "Please use the booking form on our website."));
    if (!request.headers.get("content-type")?.startsWith("application/json")) return reply(failure(415, "CONTENT_TYPE", "Please check your booking details."));
    if (Number(request.headers.get("content-length") || 0) > limitBytes) return reply(failure(413, "TOO_LARGE", "Please keep your message within 1,500 characters."));
    let payload: Record<string, unknown>;
    try {
      const reader = request.body?.getReader();
      if (!reader) throw new Error("Missing body");
      const decoder = new TextDecoder(); let text = "", bytes = 0;
      while (true) {
        const chunk = await reader.read(); if (chunk.done) break;
        bytes += chunk.value.byteLength;
        if (bytes > limitBytes) { await reader.cancel(); return reply(failure(413, "TOO_LARGE", "Please keep your message within 1,500 characters.")); }
        text += decoder.decode(chunk.value, { stream: true });
      }
      payload = JSON.parse(text + decoder.decode());
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Invalid body");
    } catch { return reply(failure(400, "INVALID", "Please check your booking details.")); }
    if (payload.website !== "") return reply(failure(400, "INVALID", "Please check your booking details."));
    if (typeof payload.requestId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.requestId)) return reply(failure(400, "INVALID", "Please check your booking details."));
    const checked = validateBooking(payload, now());
    if (checked.error) return reply(failure(400, "INVALID", checked.error));
    const data = checked.data!;
    const tick = now().getTime();
    for (const [key, value] of rates) if (value.expires <= tick) rates.delete(key);
    for (const [key, value] of submissions) if (value.expires <= tick) submissions.delete(key);
    const fingerprint = [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(data))))].map(byte => byte.toString(16).padStart(2, "0")).join("");
    const existing = submissions.get(payload.requestId);
    if (existing) return existing.fingerprint === fingerprint ? prepared(data, existing.reference) : reply(failure(409, "CHANGED", "Your details changed. Please review your request again."));
    // Vercel overwrites this forwarding header. On Workers, use Cloudflare's
    // connecting IP. Do not trust arbitrary client headers as identities.
    const address = (settings.platform === "vercel" ? request.headers.get("x-vercel-forwarded-for") : settings.platform === "cloudflare" ? request.headers.get("cf-connecting-ip") : null)?.split(",")[0]?.trim() || "unknown";
    const rate = rates.get(address) ?? { count: 0, expires: tick + retention };
    if (rate.count >= 5 || rates.size >= 5000 || submissions.size >= 1000) return reply(failure(429, "RATE_LIMIT", "Please wait 15 minutes before sending another request, or call us."));
    rate.count++; rates.set(address, rate);
    const reference = `GH-${payload.requestId.toUpperCase()}`;
    submissions.set(payload.requestId, { fingerprint, expires: tick + retention, reference });
    // This prepares an enquiry; it does not claim that mail has been sent.
    return prepared(data, reference);
  };
}
