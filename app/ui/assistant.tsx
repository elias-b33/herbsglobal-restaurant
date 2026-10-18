"use client";
import { useLanguage } from "./language";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Dialog, Icon } from "./chrome";
import { restaurant } from "../data/restaurant";

type Message = { role: "user" | "assistant"; content: string };
export default function Assistant() {
  const { t, l, locale } = useLanguage();
  const [enabled, setEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;
    const timeout = setTimeout(() => controller.abort(), 12_000);
    setLoaded(false); setConnectionError(false);
    fetch("/api/assistant", { signal: controller.signal }).then(async r => {
      if (!r.ok) throw new Error("Status unavailable");
      const data = await r.json() as { enabled?: boolean };
      if (typeof data.enabled !== "boolean") throw new Error("Invalid status");
      if (mounted) setEnabled(data.enabled);
    }).catch(() => { if (mounted) { setEnabled(false); setConnectionError(true); } }).finally(() => { clearTimeout(timeout); if (mounted) setLoaded(true); });
    return () => { mounted = false; clearTimeout(timeout); controller.abort(); };
  }, [attempt]);
  useEffect(() => { end.current?.scrollIntoView({ block: "nearest" }); }, [messages, busy]);
  async function send(text: string) {
    if (!text.trim() || busy || !enabled) return;
    const next: Message[] = [...messages, { role: "user", content: text.trim() }];
    setMessages(next); setInput(""); setError(""); setBusy(true);
    try {
      const response = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json", "X-Site-Language": locale }, body: JSON.stringify({ messages: next.slice(-7) }), signal: AbortSignal.timeout(30_000) });
      const data = await response.json() as { reply?: string; message?: string };
      if (!response.ok || typeof data.reply !== "string") throw new Error(t(data.message ?? "The assistant is temporarily unavailable. Please try again or call us."));
      setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch (e) { setMessages(messages); setInput(text); setError(e instanceof Error && e.name === "TimeoutError" ? t("The response took too long. Please try again.") : e instanceof TypeError ? t("The assistant couldn’t connect. Please try again or contact us directly.") : e instanceof Error ? e.message : t("The assistant is temporarily unavailable. Please try again or call us.")); }
    finally { setBusy(false); }
  }
  function submit(e: FormEvent) { e.preventDefault(); void send(input); }
  return <Dialog id="assistant-dialog" label={t("AI menu assistant")} className="assistant-dialog"><div className="assistant-header"><p className="eyebrow">{t("A LITTLE HELP FROM GLOBAL HERBS")}</p><h2 id="assistant-dialog-title">{t("AI menu assistant")}</h2><p>{enabled ? t("Questions about dishes, prices or your visit") : connectionError ? t("Temporarily unavailable") : loaded ? t("Not connected yet") : t("Checking availability…")}</p></div>
    {!loaded ? <div className="assistant-body"><p role="status">{t("Checking availability…")}</p></div> : !enabled ? <div className="assistant-body"><h3>{connectionError ? t("We couldn’t reach the assistant") : t("AI replies are not available yet")}</h3><p>{connectionError ? t("Please try again in a moment. You can still browse our menu and use our booking and takeaway services.") : t("The restaurant’s AI assistant has not been connected yet. For now, these shortcuts will help you explore the menu.")}</p>{connectionError && <button className="button button-green" onClick={() => setAttempt(value => value + 1)}>{t("Try again")}</button>}<div className="assistant-quick-links"><a href={l("/menu?q=momo")}>{t("Explore mo:mo")}</a><a href={l("/menu?q=curry")}>{t("Browse curries")}</a></div><div className="assistant-links"><a href={l("/menu")}>{t("Full menu & prices")} <Icon name="arrow" /></a><a href={l("/book")}>{t("Book a table")} <Icon name="arrow" /></a><a href={l("/order")}>{t("Order takeaway")} <Icon name="arrow" /></a><a href={restaurant.phoneHref}>{t("Call")} {restaurant.phone} <Icon name="phone" /></a></div><p className="small muted">{t("For ingredients, allergies or special requests, please contact the restaurant.")}</p></div> : <>
      <div className="conversation" role="log" aria-live="polite" aria-label={t("Conversation with the AI menu assistant")}><p className="message assistant">{t("Welcome to Global Herbs. I can help you explore dishes, compare menu prices, or plan your visit. What would you like to know?")}</p>{messages.map((message, index) => <p key={index} className={`message ${message.role}`}><span className="sr-only">{message.role === "user" ? t("You") : t("AI assistant")}: </span>{message.content}</p>)}{busy && <p className="assistant-thinking" role="status">{t("Looking through our menu…")}</p>}<div ref={end} /></div>
      {messages.length === 0 && <div className="assistant-prompts"><button onClick={() => void send(t("Which mo:mo are on the menu?"))}>{t("Help me choose mo:mo")}</button><button onClick={() => void send(t("When are you open?"))}>{t("Opening hours")}</button></div>}
      {error && <p className="assistant-error" role="alert">{error}</p>}
      <form className="assistant-form" onSubmit={submit}><label htmlFor="assistant-question" className="sr-only">{t("Your question")}</label><input id="assistant-question" value={input} onChange={e => setInput(e.target.value)} maxLength={1000} placeholder={t("Ask about the menu or your visit…")} autoComplete="off" disabled={busy} required /><button className="icon-button" type="submit" aria-label={t("Send question")} disabled={busy || !input.trim()}><Icon name="arrow" /></button></form><p className="assistant-disclosure">{t("AI can make mistakes. Confirm allergies with our team. Your messages are sent to OpenAI; please leave out personal details.")}</p>
    </>}</Dialog>;
}
