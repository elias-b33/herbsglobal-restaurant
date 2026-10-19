import test from "node:test";
import assert from "node:assert/strict";
import { createBookingHandler, bookingEmail } from "../app/lib/booking-server";
import { validateBooking } from "../app/lib/booking-request";
import { submitBooking } from "../app/lib/booking-delivery";

const origin = "https://restaurant.example";
const now = new Date("2026-10-19T13:00:00Z");
const setup = { recipient: "bookings@example.test", formUrl: `${origin}/book`, platform: "vercel" as const };
const valid = { date: "2026-10-24", time: "1080", guests: 2, name: "Test Guest", email: "guest@example.test", phone: "+40700000000", notes: "", flexibleDate: false, flexibleTime: false, occasion: "", menu: "unsure", budget: "" };
const group = { ...valid, guests: 60, occasion: "company", flexibleDate: true, flexibleTime: true, time: "", menu: "discuss", budget: "150.50", notes: "We would like to sit together." };
const request = (changes: Record<string, unknown> = {}, headers: Record<string, string> = {}) => new Request(`${origin}/api/bookings`, {
  method: "POST", headers: { Origin: origin, "Content-Type": "application/json", "x-vercel-forwarded-for": "192.0.2.1", ...headers },
  body: JSON.stringify({ ...valid, website: "", requestId: crypto.randomUUID(), ...changes }),
});

test("Bookings validate real dates, hours, contact details and whole guest counts", () => {
  for (const guests of [1, 10, 11, 30, 60]) assert.ok(validateBooking({ ...valid, guests }, now).data);
  for (const change of [{ guests: 0 }, { guests: 1000 }, { guests: 10.5 }, { guests: "60" }, { date: "2026-02-30" }, { date: "2026-10-18" }, { date: "2026-10-20" }, { time: "17:00" }, { date: "2026-10-19", time: "900" }, { email: "guest\r\nBcc: other@example.test" }, { name: "A\r\nB" }, { phone: "-------" }, { notes: "a".repeat(1501) }]) {
    assert.ok(validateBooking({ ...valid, ...change }, now).error, JSON.stringify(change).slice(0,100));
  }
  assert.ok(validateBooking({ ...valid, email: "guest\u0000@example.test" }, now).error);
});

test("Only groups may request flexible times; stale group details are removed from ordinary bookings", () => {
  assert.ok(validateBooking(group, now).data?.flexibleTime);
  assert.ok(validateBooking({ ...group, guests: 10 }, now).error);
  const small = validateBooking({ ...group, time: "1080", guests: 2 }, now).data!;
  assert.equal(small.flexibleTime, false); assert.equal(small.flexibleDate, false);
  assert.equal(small.menu, ""); assert.equal(small.budget, ""); assert.equal(small.occasion, "");
  for (const change of [{ occasion: "invented" }, { menu: "invented" }, { budget: "-5" }, { budget: "NaN" }]) assert.ok(validateBooking({ ...group, ...change }, now).error);
});

test("Booking email clearly requests manual confirmation and preserves overnight times", () => {
  const data = validateBooking({ ...valid, time: "1470" }, now).data!;
  const email = bookingEmail(data, "GH-TEST", setup.formUrl);
  assert.equal(email["Preferred arrival"], "00:30 (next day)");
  assert.equal(email["Time zone"], "Europe/Bucharest");
  assert.match(email.Status, /NOT CONFIRMED/);
  assert.equal(email._replyto, valid.email);
  const large = bookingEmail(validateBooking(group, now).data!, "GH-TEST", setup.formUrl);
  assert.match(large._subject, /GROUP ENQUIRY.*60 guests/);
  assert.match(large["Budget per person"]!, /150.50 RON.*not an agreed price/);
  assert.match(large["Preferred arrival"], /Flexible/);
});

test("Booking endpoint rejects foreign origins, oversized bodies, bots and invalid requests", async () => {
  const handler = createBookingHandler(setup, { now: () => now });
  assert.equal((await handler(request({}, { Origin: "https://another.example" }))).status, 403);
  assert.equal((await handler(request({}, { "Content-Type": "text/plain" }))).status, 415);
  assert.equal((await handler(request({ notes: "x".repeat(17000) }))).status, 413);
  assert.equal((await handler(request({}, { "Content-Length": "20000" }))).status, 413);
  assert.equal((await handler(request({ website: "spam.example" }))).status, 400);
  assert.equal((await handler(request({ requestId: "not-a-uuid" }))).status, 400);
  assert.equal((await handler(request({ guests: 0 }))).status, 400);
  assert.equal((await handler(new Request(`${origin}/api/bookings`))).status, 405);
});

test("The server prepares safe table/group payloads without claiming an email was sent", async () => {
  const handler = createBookingHandler(setup, { now: () => now });
  for (const guests of [2, 10, 11, 30, 60]) {
    const response = await handler(request({ guests, _cc: "attacker@example.test", recipient: "attacker@example.test" }));
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.prepared, true); assert.equal(body.sent, undefined);
    assert.equal(body.delivery.endpoint, "https://formsubmit.co/ajax/bookings%40example.test");
    assert.equal(body.delivery.fields._replyto, valid.email);
    assert.equal(body.delivery.fields._url, setup.formUrl);
    assert.equal(body.delivery.fields._cc, undefined);
    assert.equal(body.delivery.fields.recipient, undefined);
    assert.match(body.delivery.fields.Status, /NOT CONFIRMED/);
    assert.equal(body.delivery.fields.Guests, String(guests));
  }
});

test("Preparing the same request keeps its reference and rejects changed details", async () => {
  const handler = createBookingHandler(setup, { now: () => now });
  const requestId = crypto.randomUUID();
  const responses = await Promise.all([handler(request({ requestId })), handler(request({ requestId }))]);
  assert.deepEqual(await responses[0].json(), await responses[1].json());
  assert.equal((await handler(request({ requestId, guests: 3 }))).status, 409);
});

test("Only explicit provider acceptance produces the browser success acknowledgement", async () => {
  const handler = createBookingHandler(setup, { now: () => now });
  const prepared = await (await handler(request())).json();
  for (const accepted of [true, "true"]) {
    let calls = 0;
    const result = await submitBooking(valid, crypto.randomUUID(), "", (async (url, options) => {
      calls++;
      if (url === "/api/bookings") return Response.json(prepared);
      assert.equal(url, prepared.delivery.endpoint);
      assert.deepEqual(JSON.parse(String(options?.body)), prepared.delivery.fields);
      assert.equal(options?.credentials, "omit");
      assert.equal(options?.referrer, "https://herbsglobal-restaurants.vercel.app/book");
      return Response.json({ success: accepted });
    }) as typeof fetch);
    assert.deepEqual(result, { sent: true, reference: prepared.reference }); assert.equal(calls, 2);
  }
  for (const provider of [
    () => Response.json({ success: "false", message: "This form needs Activation." }),
    () => Response.json({ success: "false", message: "Internal sensitive information" }),
    () => new Response("Internal sensitive information", { status: 403 }),
    () => Response.json({ success: false }),
  ]) {
    const result = await submitBooking(valid, crypto.randomUUID(), "", (async url =>
      url === "/api/bookings" ? Response.json(prepared) : provider()
    ) as typeof fetch);
    assert.equal(result.sent, undefined);
    assert.doesNotMatch(JSON.stringify(result), /Internal sensitive information/);
  }
});

test("Browser delivery rejects invalid preparation and treats ambiguous provider results cautiously", async () => {
  const handler = createBookingHandler(setup, { now: () => now });
  const prepared = await (await handler(request())).json();
  for (const bad of [
    () => Response.json({ message: "Please check your booking details." }, { status: 400 }),
    () => Response.json({ sent: true, reference: "false-success" }),
    () => Response.json({ ...prepared, delivery: { ...prepared.delivery, endpoint: "https://another.example/collect" } }),
    () => { throw new Error("Preparation connection lost"); },
  ]) {
    let calls = 0;
    const result = await submitBooking(valid, crypto.randomUUID(), "", (async () => { calls++; return bad(); }) as typeof fetch);
    assert.equal(result.sent, undefined); assert.equal(calls, 1);
  }
  for (const fail of [
    () => { throw new Error("Provider connection lost"); },
    () => new Response("Provider error", { status: 500 }),
    () => new Response("Not JSON"),
  ]) {
    let calls = 0;
    const result = await submitBooking(valid, crypto.randomUUID(), "", (async url => {
      calls++; return url === "/api/bookings" ? Response.json(prepared) : fail();
    }) as typeof fetch);
    assert.equal(result.sent, undefined);
    assert.ok(!result.sent && result.unknown); assert.equal(calls, 2);
  }
});

test("Booking preparation limits use the platform address, expire, and keep visitors separate", async () => {
  let tick = now.getTime();
  const handler = createBookingHandler(setup, { now: () => new Date(tick) });
  for (let i = 0; i < 5; i++) assert.equal((await handler(request())).status, 200);
  const limited = await handler(request({}, { "x-forwarded-for": "spoofed-address" }));
  assert.equal(limited.status, 429); assert.equal(limited.headers.get("retry-after"), "900");
  assert.equal((await handler(request({}, { "x-vercel-forwarded-for": "192.0.2.2" }))).status, 200);
  tick += 15 * 60_000 + 1;
  assert.equal((await handler(request())).status, 200);
});
