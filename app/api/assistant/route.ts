import { handleAssistant } from "../../lib/assistant-server";
export const dynamic = "force-dynamic";
// Server-only runtime variables work on Vercel and on the Sites Worker with
// nodejs_compat. Read them per request; never expose them through NEXT_PUBLIC_.
const settings = () => ({
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
});
export function GET(request: Request) { return handleAssistant(request, settings()); }
export function POST(request: Request) { return handleAssistant(request, settings()); }
