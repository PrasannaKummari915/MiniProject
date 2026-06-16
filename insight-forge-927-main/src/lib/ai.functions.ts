import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { z } from "zod";

const SummarizeInput = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(4000),
});

export const summarizeFeature = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SummarizeInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const { createLovableAiGatewayProvider } = await import("@/lib/ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system:
        "You are a senior product analyst. In 1-2 sentences (max 220 chars), produce a sharp neutral summary capturing the user problem and the proposed solution. No marketing fluff, no emojis.",
      prompt: `TITLE: ${data.title}\n\nDESCRIPTION: ${data.description}`,
    });
    return { summary: text.trim().slice(0, 280) };
  });

const FindDupesInput = z.object({
  title: z.string().min(1).max(200),
  candidates: z
    .array(z.object({ id: z.string(), title: z.string() }))
    .max(40),
});

export const findDuplicates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => FindDupesInput.parse(input))
  .handler(async ({ data }) => {
    if (data.candidates.length === 0) return { matches: [] as string[] };
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const { createLovableAiGatewayProvider } = await import("@/lib/ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    const list = data.candidates.map((c) => `- ${c.id} :: ${c.title}`).join("\n");
    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system:
        "You detect duplicate feature requests. Return ONLY a JSON array of candidate IDs that are semantic duplicates of the NEW request. Empty array if none. No prose.",
      prompt: `NEW: ${data.title}\n\nCANDIDATES:\n${list}\n\nReturn JSON array only.`,
    });
    try {
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) return { matches: parsed.filter((x): x is string => typeof x === "string") };
    } catch {
      /* ignore */
    }
    return { matches: [] as string[] };
  });

const ChatInput = z.object({
  message: z.string().min(1).max(1000),
  context: z.string().max(2000).optional(),
});

export const chatAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ChatInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const { createLovableAiGatewayProvider } = await import("@/lib/ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system:
        "You are FeatureFlow AI's in-app product assistant. Help users phrase feature requests clearly, discover similar ideas, and understand the roadmap. Keep replies under 120 words, conversational, markdown-friendly.",
      prompt: data.context ? `Context:\n${data.context}\n\nUser: ${data.message}` : data.message,
    });
    return { reply: text.trim() };
  });
