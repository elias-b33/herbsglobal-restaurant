import { createBookingHandler } from "../../lib/booking-server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;
export const POST = createBookingHandler({
  // Delivery configuration is server-owned; submissions cannot change it.
  recipient: "ayush.giri2006@gmail.com",
  formUrl: "https://herbsglobal-restaurants.vercel.app/book",
  platform: process.env.VERCEL === "1" ? "vercel" : "cloudflare",
});
