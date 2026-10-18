"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Dialog, Icon } from "./chrome";
import { restaurant } from "../data/restaurant";

type Message = { role: "user" | "assistant"; content: string };
export default function Assistant() {
  const [enabled, setEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/assistant", { signal: controller.signal }).then(r => r.json() as Promise<{ enabled?: boolean }>).then(data => setEnabled(data.enabled === true)).catch(() => {}).finally(() => setLoaded(true));
    return () => controller.abort();
  }, []);
  useEffect(() => { end.current?.scrollIntoView({ block: "nearest" }); }, [messages, busy]);
  async function send(text: string) {
    if (!text.trim() || busy || !enabled) return;
    const next: Message[] = [...messages, { role: "user", content: text.trim() }];
    setMessages(next); setInput(""); setError(""); setBusy(true);
    try {
      const response = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next.slice(-7) }), signal: AbortSignal.timeout(30_000) });
      const data = await response.json() as { reply?: string; message?: string };
      if (!response.ok || typeof data.reply !== "string") throw new Error(data.message ?? "The assistant is temporarily unavailable. Please try again or call us.");
      setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch (e) { setMessages(messages); setInput(text); setError(e instanceof Error && e.name !== "TimeoutError" ? e.message : "The response took too long. Please try again."); }
    finally { setBusy(false); }
  }
  function submit(e: FormEvent) { e.preventDefault(); void send(input); }
  return <Dialog id="assistant-dialog" label="menu assistance" className="assistant-dialog"><div className="assistant-header"><p className="eyebrow">A LITTLE HELP FROM GLOBAL HERBS</p><h2 id="assistant-dialog-title">At your service</h2><p>{enabled ? "AI menu assistant" : "Menu assistance"}</p></div>
    {!loaded ? <div className="assistant-body"><p role="status">Checking availability…</p></div> : !enabled ? <div className="assistant-body"><h3>A little guidance for your visit</h3><p>Our AI assistant isn’t active yet. In the meantime, explore our menu or speak with us directly — we’re happy to help.</p><div className="assistant-links"><a href="/menu">Explore dishes & drinks <Icon name="arrow" /></a><a href={restaurant.phoneHref}>Call {restaurant.phone} <Icon name="phone" /></a><a href={restaurant.reservations} target="_blank" rel="noopener noreferrer">Reserve a table <Icon name="external" /></a></div><p className="small muted">For ingredients, allergies or special requests, please contact the restaurant.</p></div> : <>
      <div className="conversation" role="log" aria-live="polite" aria-label="Conversation with the AI menu assistant"><p className="message assistant">Welcome to Global Herbs. I can help you explore dishes, compare menu prices, or plan your visit. What would you like to know?</p>{messages.map((message, index) => <p key={index} className={`message ${message.role}`}><span className="sr-only">{message.role === "user" ? "You" : "AI assistant"}: </span>{message.content}</p>)}{busy && <p className="assistant-thinking" role="status">Looking through our menu…</p>}<div ref={end} /></div>
      {messages.length === 0 && <div className="assistant-prompts"><button onClick={() => void send("Which mo:mo are on the menu?")}>Help me choose mo:mo</button><button onClick={() => void send("When are you open?")}>Opening hours</button></div>}
      {error && <p className="assistant-error" role="alert">{error}</p>}
      <form className="assistant-form" onSubmit={submit}><label htmlFor="assistant-question" className="sr-only">Your question</label><input id="assistant-question" value={input} onChange={e => setInput(e.target.value)} maxLength={1000} placeholder="Ask about the menu or your visit…" autoComplete="off" disabled={busy} required /><button className="icon-button" type="submit" aria-label="Send question" disabled={busy || !input.trim()}><Icon name="arrow" /></button></form><p className="assistant-disclosure">AI can make mistakes. Confirm allergies with our team. Your messages are sent to OpenAI; please leave out personal details.</p>
    </>}</Dialog>;
}
