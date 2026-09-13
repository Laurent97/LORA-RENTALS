"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, Send, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CarCard } from "@/components/car-card";
import { useApp } from "@/lib/store";
import type { ConciergeMessage, ConciergeResponse } from "@/types";

const WELCOME: ConciergeMessage = {
  role: "assistant",
  content: "Hi! I'm your LORA trip concierge. Tell me your plans and I'll build a Rwanda itinerary with a car, routes, and lodging.",
};

export default function ConciergePage() {
  const { user } = useApp();
  const router = useRouter();
  const [messages, setMessages] = useState<ConciergeMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [lastResponse, setLastResponse] = useState<ConciergeResponse | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, lastResponse]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: ConciergeMessage = { role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/concierge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg], userId: user?.id }),
      });
      if (!res.ok) throw new Error("concierge failed");
      const data = (await res.json()) as ConciergeResponse;
      setMessages((m) => [...m, { role: "assistant", content: data.message }]);
      setLastResponse(data);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, I couldn't plan that. Try again with your destination and dates." }]);
    } finally {
      setLoading(false);
    }
  };

  const startListening = () => {
    const w = window as typeof window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
    const SR = (w.SpeechRecognition || w.webkitSpeechRecognition) as { new (): { lang: string; interimResults: boolean; onresult: ((e: { results: { transcript: string }[][] }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null; start: () => void } } | undefined;
    if (!SR) return;
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.onresult = (e) => {
      const t = Array.from(e.results)
        .map((r) => r[0]?.transcript ?? "")
        .join("");
      setInput(t);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    setListening(true);
    rec.start();
  };

  return (
    <main className="container max-w-3xl py-10">
      <div className="mb-6 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-800 text-gold">
          <Sparkles className="h-7 w-7" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-extrabold">AI Trip Concierge</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Describe your Rwanda trip in plain language — I'll plan it.
        </p>
      </div>

      <Card className="mb-4 min-h-[20rem]">
        <CardContent className="space-y-4 p-5">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  m.role === "user" ? "bg-gold text-navy-900" : "bg-navy-800 text-gold"
                }`}
              >
                {m.role === "user" ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
              </span>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === "user" ? "bg-gold/20 text-navy-900" : "bg-secondary"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-800 text-gold">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="rounded-2xl bg-secondary px-4 py-2.5 text-sm">Planning your trip…</div>
            </div>
          )}
          <div ref={bottomRef} />
        </CardContent>
      </Card>

      {lastResponse && (
        <div className="mb-6 space-y-4">
          <Card>
            <CardContent className="space-y-3 p-5">
              <h2 className="font-display font-bold">Suggested plan</h2>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-secondary px-2.5 py-1 font-medium">{lastResponse.recommendation.days} days</span>
                <span className="rounded-full bg-secondary px-2.5 py-1 font-medium">{lastResponse.recommendation.passengers} people</span>
                <span className="rounded-full bg-secondary px-2.5 py-1 font-medium">{lastResponse.recommendation.carType}</span>
                <span className="rounded-full bg-secondary px-2.5 py-1 font-medium">{lastResponse.recommendation.location}</span>
                <span className="rounded-full bg-secondary px-2.5 py-1 font-medium">{lastResponse.recommendation.startDate} → {lastResponse.recommendation.endDate}</span>
              </div>
              <ol className="space-y-1.5 text-sm">
                {lastResponse.recommendation.itinerary.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="font-bold text-gold">{i + 1}.</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
              <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <p><span className="font-semibold text-foreground">Fuel estimate:</span> {lastResponse.recommendation.fuelEstimate}</p>
                <p><span className="font-semibold text-foreground">Roads:</span> {lastResponse.recommendation.roadConditions}</p>
              </div>
              {lastResponse.recommendation.lodging.length > 0 && (
                <p className="text-sm"><span className="font-semibold">Lodging ideas:</span> {lastResponse.recommendation.lodging.join(" · ")}</p>
              )}
              {lastResponse.recommendation.routes.length > 0 && (
                <p className="text-sm"><span className="font-semibold">Routes:</span> {lastResponse.recommendation.routes.join(" · ")}</p>
              )}
            </CardContent>
          </Card>

          {lastResponse.vehicles.length > 0 ? (
            <div>
              <h3 className="mb-3 font-display font-bold">Recommended cars</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {lastResponse.vehicles.map((v) => (
                  <CarCard key={v.id} vehicle={v} />
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground">No matching cars right now. Try changing the dates or car type.</p>
          )}

          <Button
            variant="gold"
            className="w-full"
            onClick={() =>
              router.push(
                `/browse?type=${lastResponse.recommendation.carType}&location=${encodeURIComponent(
                  lastResponse.recommendation.location
                )}&start=${lastResponse.recommendation.startDate ?? ""}&end=${lastResponse.recommendation.endDate ?? ""}`
              )
            }
          >
            See all matching cars
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          variant={listening ? "gold" : "outline"}
          size="icon"
          onClick={startListening}
          aria-label="Voice input"
          title={listening ? "Listening…" : "Speak your trip idea"}
        >
          <Mic className="h-4 w-4" />
        </Button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder='Try: "4 days in Musanze for gorillas, family of 4"'
          className="h-12 flex-1 rounded-2xl border border-gold/40 bg-card px-4 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold"
        />
        <Button onClick={send} disabled={loading} size="icon" variant="gold" aria-label="Send">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </main>
  );
}
