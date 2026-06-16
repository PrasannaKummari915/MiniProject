import { useEffect, useRef, useState } from "react";
import { Bot, Send, X, Sparkles } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { chatAssistant } from "@/lib/ai.functions";
import { cn } from "@/lib/utils";

interface Msg {
  role: "user" | "assistant";
  text: string;
}

export function AiChatFab() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text: "Hi — I'm your FeatureFlow assistant. Ask me to help refine an idea, find similar requests, or summarize the roadmap.",
    },
  ]);
  const send = useServerFn(chatAssistant);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || busy) return;
    const message = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", text: message }]);
    setBusy(true);
    try {
      const r = await send({ data: { message } });
      setMessages((m) => [...m, { role: "assistant", text: r.reply }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: err instanceof Error ? err.message : "Something went wrong." },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "fixed bottom-5 right-5 z-50 size-12 rounded-full bg-foreground text-background grid place-items-center shadow-elevated hover:scale-105 transition-transform",
        )}
        aria-label="AI assistant"
      >
        {open ? <X className="size-5" /> : <Bot className="size-5" />}
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 z-50 w-[min(380px,calc(100vw-2.5rem))] h-[520px] bg-card border border-border rounded-2xl shadow-elevated flex flex-col overflow-hidden animate-reveal">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/50">
            <div className="size-7 rounded-md bg-primary/10 grid place-items-center">
              <Sparkles className="size-4 text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">FeatureFlow Assistant</div>
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                AI · online
              </div>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] text-sm rounded-2xl px-3.5 py-2.5",
                  m.role === "user"
                    ? "ml-auto bg-foreground text-background rounded-br-md"
                    : "bg-secondary text-foreground rounded-bl-md",
                )}
              >
                {m.text}
              </div>
            ))}
            {busy && (
              <div className="bg-secondary text-foreground rounded-2xl rounded-bl-md px-3.5 py-2.5 max-w-[60%] text-sm">
                <span className="inline-flex gap-1">
                  <span className="size-1.5 rounded-full bg-muted-foreground animate-pulse" />
                  <span className="size-1.5 rounded-full bg-muted-foreground animate-pulse [animation-delay:120ms]" />
                  <span className="size-1.5 rounded-full bg-muted-foreground animate-pulse [animation-delay:240ms]" />
                </span>
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} className="border-t border-border p-3 flex gap-2 items-center">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about features..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              disabled={busy}
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="size-8 rounded-md bg-primary text-primary-foreground grid place-items-center disabled:opacity-40"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
