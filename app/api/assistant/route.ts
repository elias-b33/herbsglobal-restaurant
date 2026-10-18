import { env } from "cloudflare:workers";
import { handleAssistant } from "../../lib/assistant-server";
export const dynamic = "force-dynamic";
const settings = () => env as { OPENAI_API_KEY?: string; OPENAI_MODEL?: string };
export function GET(request: Request) { return handleAssistant(request, settings()); }
export function POST(request: Request) { return handleAssistant(request, settings()); }
