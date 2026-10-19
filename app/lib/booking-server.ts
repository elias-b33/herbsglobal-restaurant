import { groupThreshold, menuLabels, occasionLabels, validateBooking, type BookingRequest } from "./booking-request";
import { preferredTimes } from "./service-drafts";

type Settings = { recipient: string; formUrl: string; platform?: "vercel" | "cloudflare" };
type Result = { status: number; body: { code?: string; message?: string; reference?: string; sent?: boolean } };
type Dependencies = { fetcher?: typeof fetch; now?: () => Date };
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
    _template: "table", _url: formUrl, _replyto: data.email,
    "Request type": group ? "Group enquiry — capacity, seating and menu must be discussed" : "Table booking request",
    "Status": "NOT CONFIRMED. Please reply to the guest or call them before reserving any table.",
    "Reference": reference, "Guests": String(data.guests), "Preferred date": data.date,
    "Preferred arrival": data.flexibleTime ? "Flexible — please arrange with the guest" : preferredTimes(data.date).find(time => time.value === data.time)!.label,
    "Time zone": "Europe/Bucharest", "Date flexibility": data.flexibleDate ? "Alternative dates are possible" : "Preferred date as shown",
    name: data.name, email: data.email, "Phone": data.phone,
    ...(group ? { "Occasion": occasionLabels[data.occasion] || "Not specified", "Menu preference": menuLabels[data.menu],
      "Budget per person": data.budget ? `${data.budget} RON (guest's preference, not an agreed price)` : "To discuss" } : {}),
    "Guest notes": data.notes || "None", "Next step": "Use Reply to contact the guest. This email does not confirm availability or a booking.",
  };
}

export function createBookingHandler(settings: Settings, dependencies: Dependencies = {}) {
  const fetcher = dependencies.fetcher ?? fetch;
  const now = dependencies.now ?? (() => new Date());
  const rates = new Map<string, { count: number; expires: number }>();
  // Prevent double-clicks and retries within this process. The reference is also
  // included in email because separate serverless instances do not share memory.
  const submissions = new Map<string, { fingerprint: string; expires: number; task: Promise<Result> }>();

  async function send(data: BookingRequest, reference: string): Promise<Result> {
    try {
      const result = await fetcher(`https://formsubmit.co/ajax/${encodeURIComponent(settings.recipient)}`, {
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json",
          Referer: settings.formUrl, Origin: new URL(settings.formUrl).origin },
        body: JSON.stringify(bookingEmail(data, reference, settings.formUrl)), signal: AbortSignal.timeout(15_000),
      });
      // Keep a non-sensitive status code for diagnosing provider failures.
      // Never return the provider's raw response or any guest details.
      if (!result.ok) return failure(502, `DELIVERY_HTTP_${result.status}`, "We couldn’t send your request. Please try again or call us.");
      const answer = await result.json() as { success?: unknown; message?: unknown };
      if (answer.success === true || answer.success === "true") return { status: 200, body: { sent: true, reference } };
      if (typeof answer.message === "string" && /activat/i.test(answer.message)) return failure(503, "EMAIL_NOT_READY", "Online requests are not available yet. Please call us to arrange your visit.");
      const code = typeof answer.message === "string" && /web server|HTML files/i.test(answer.message) ? "DELIVERY_SOURCE" : "DELIVERY_REJECTED";
      return failure(502, code, "We couldn’t send your request. Please try again or call us.");
    } catch {
      return failure(504, "DELIVERY_UNKNOWN", "We couldn’t confirm delivery. Please call us before sending again.");
    }
  }

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
    if (existing) return reply(existing.fingerprint === fingerprint ? await existing.task : failure(409, "CHANGED", "Your details changed. Please review your request again."));
    // Vercel overwrites this forwarding header. On Workers, use Cloudflare's
    // connecting IP. Do not trust arbitrary client headers as identities.
    const address = (settings.platform === "vercel" ? request.headers.get("x-vercel-forwarded-for") : settings.platform === "cloudflare" ? request.headers.get("cf-connecting-ip") : null)?.split(",")[0]?.trim() || "unknown";
    const rate = rates.get(address) ?? { count: 0, expires: tick + retention };
    if (rate.count >= 5 || rates.size >= 5000 || submissions.size >= 1000) return reply(failure(429, "RATE_LIMIT", "Please wait 15 minutes before sending another request, or call us."));
    rate.count++; rates.set(address, rate);
    const reference = `GH-${payload.requestId.toUpperCase()}`;
    const task = send(data, reference);
    submissions.set(payload.requestId, { fingerprint, expires: tick + retention, task });
    const result = await task;
    // An unknown result may already have reached the provider: keep its key so
    // retrying cannot immediately send the same request a second time.
    if (result.status !== 200 && result.status !== 504) submissions.delete(payload.requestId);
    return reply(result);
  };
}
