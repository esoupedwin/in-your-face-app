import { NextRequest, NextResponse } from "next/server";
import {
  forgetMemories,
  formatMemoriesForPrompt,
  formatMemoriesForUser,
  getRelevantMemories,
  listMemories,
  storeMemoriesFromUserMessage,
} from "@/lib/memory";

const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const OPENAI_MODEL = "gpt-5.4-nano";
const VALID_EMOTIONS = new Set([
  "NEUTRAL",
  "HAPPY",
  "DELIGHTED",
  "PISSED",
  "SAD",
  "ANGRY",
  "SURPRISED",
  "EXCITED",
  "CONFUSED",
  "THINKING",
]);

const SYSTEM_PROMPT = `You are Chappie, a witty menace with immaculate timing.
Your vibe is mischievous, cheeky, and slightly savage - but always helpful.

Personality:
- Roast-lite energy: playful jabs, never cruelty.
- Bold, clever, and a little dramatic for comedic effect.
- Confident and fast-thinking, not arrogant.
- Helps first, jokes second.

Style:
- Keep responses SHORT (1-3 sentences max).
- Lead with the answer, then add flavor.
- Use sarcasm sparingly and intelligently.
- Avoid repetitive joke patterns, meme spam, or try-hard humor.
- Match the user's tone; if they're serious, lower the snark instantly.

Rules:
- Never mock sensitive traits, identity, or personal pain.
- No hateful, sexual, violent, or self-harm humor.
- No punching down.
- If the user seems upset or stressed, switch to supportive mode.
- Never sacrifice accuracy for a punchline.
- If refusing, do it firmly but with classy wit.

After your response message, you MUST output a single line containing only a JSON object in this exact format:
{"emotion":"EMOTION"}

Choose ONE emotion from: NEUTRAL, HAPPY, DELIGHTED, PISSED, SAD, ANGRY, SURPRISED, EXCITED, CONFUSED, THINKING

Example response:
Cute plan. Let's do it properly in two steps so it doesn't explode.
{"emotion":"THINKING"}`;
const INTERNAL_INITIATIVE_QUESTION_PROMPT =
  "Start a short, natural conversation opener as a friendly question to get to know the user better, or ask about everyday life. Sound human and casual.";
const INTERNAL_INITIATIVE_REMARK_PROMPT =
  "Start a short, natural passing remark (not a question) like a normal human casual comment. Keep it conversational and friendly.";
const INTERNAL_MEMORY_INITIATIVE_QUESTION_PROMPT =
  "Start a short, natural conversation opener as a friendly question that uses one remembered user detail if available. If no useful memory exists, ask a casual everyday question.";
const INTERNAL_MEMORY_INITIATIVE_REMARK_PROMPT =
  "Start a short, natural passing remark (not a question) that uses one remembered user detail if available. If no useful memory exists, use a casual everyday remark.";
const INTERNAL_INITIATIVE_PROMPTS = new Set([
  INTERNAL_INITIATIVE_QUESTION_PROMPT,
  INTERNAL_INITIATIVE_REMARK_PROMPT,
  INTERNAL_MEMORY_INITIATIVE_QUESTION_PROMPT,
  INTERNAL_MEMORY_INITIATIVE_REMARK_PROMPT,
]);
const MEMORY_BEHAVIOR_PROMPT = `You have access to user memory.
Use it naturally and lightly to build continuity, but never dump raw memory entries.
If memory seems uncertain or stale, ask a quick confirmation.
Do not claim to remember something unless it appears in memory context or this chat.
Do not store or ask for highly sensitive personal data.`;

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type MemoryCommandResult = {
  handled: boolean;
  text?: string;
  emotion?: string;
};

function toInputContent(message: ChatMessage) {
  if (message.role === "assistant") {
    return [{ type: "output_text" as const, text: message.content }];
  }
  return [{ type: "input_text" as const, text: message.content }];
}

function extractTextFromResponsePayload(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const data = payload as {
    output_text?: unknown;
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  };

  if (typeof data.output_text === "string") return data.output_text;

  if (Array.isArray(data.output_text)) {
    return data.output_text.filter((part): part is string => typeof part === "string").join("");
  }

  if (!Array.isArray(data.output)) return "";

  const chunks: string[] = [];
  for (const item of data.output) {
    if (!Array.isArray(item.content)) continue;
    for (const block of item.content) {
      if (block.type === "output_text" && typeof block.text === "string") {
        chunks.push(block.text);
      }
    }
  }

  return chunks.join("");
}

function extractEmotion(text: string) {
  const emotionMatch = text.match(/\{"emotion":"(\w+)"\}/);
  const emotion = emotionMatch ? emotionMatch[1] : "NEUTRAL";
  return VALID_EMOTIONS.has(emotion) ? emotion : "NEUTRAL";
}

function findLastUserMessage(messages: ChatMessage[]) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === "user") return messages[i];
  }
  return null;
}

function buildSystemPromptWithMemory(memoryContext: string) {
  return `${SYSTEM_PROMPT}

${MEMORY_BEHAVIOR_PROMPT}

Known user memory:
${memoryContext}`;
}

async function handleMemoryCommand(userId: string, content: string): Promise<MemoryCommandResult> {
  const trimmed = content.trim();
  const lc = trimmed.toLowerCase();

  if (lc === "/memory" || lc === "/memory help") {
    return {
      handled: true,
      emotion: "THINKING",
      text: `Memory commands:
/memory show
/memory forget <keyword or memory_id>
/memory forget all`,
    };
  }

  if (lc === "/memory show") {
    const memories = await listMemories(userId, 30);
    return {
      handled: true,
      emotion: "THINKING",
      text: formatMemoriesForUser(memories),
    };
  }

  const forgetMatch = trimmed.match(/^\/memory\s+forget\s+(.+)$/i);
  if (forgetMatch) {
    const target = forgetMatch[1].trim();
    const removed = await forgetMemories(userId, target);
    return {
      handled: true,
      emotion: removed > 0 ? "NEUTRAL" : "CONFUSED",
      text:
        removed > 0
          ? `Done. I forgot ${removed} memory item${removed === 1 ? "" : "s"}.`
          : "I couldn't find matching memory items to forget.",
    };
  }

  return { handled: false };
}

export async function POST(req: NextRequest) {
  const { messages } = (await req.json()) as { messages: ChatMessage[] };
  const apiKey = process.env.OPENAI_API_KEY;
  const encoder = new TextEncoder();
  const userId = req.headers.get("x-user-id")?.trim() || "local-user";

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is missing from environment variables." },
      { status: 500 },
    );
  }

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const lastUserMessage = findLastUserMessage(messages);

        if (lastUserMessage) {
          const memoryCommand = await handleMemoryCommand(userId, lastUserMessage.content);
          if (memoryCommand.handled) {
            const text = memoryCommand.text ?? "Done.";
            const emotion = memoryCommand.emotion ?? "THINKING";
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, emotion })}\n\n`));
            controller.close();
            return;
          }
        }

        if (lastUserMessage && !INTERNAL_INITIATIVE_PROMPTS.has(lastUserMessage.content)) {
          await storeMemoriesFromUserMessage(userId, lastUserMessage.content);
        }

        const relevantMemories = await getRelevantMemories(userId, lastUserMessage?.content ?? "", 6);
        const memoryContext = formatMemoriesForPrompt(relevantMemories);

        const response = await fetch(OPENAI_API_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: OPENAI_MODEL,
            max_output_tokens: 256,
            input: [
              {
                role: "system",
                content: [{ type: "input_text", text: buildSystemPromptWithMemory(memoryContext) }],
              },
              ...messages.map((m) => ({
                role: m.role,
                content: toInputContent(m),
              })),
            ],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`OpenAI request failed (${response.status}): ${errorText}`);
        }

        const payload = (await response.json()) as unknown;
        const text = extractTextFromResponsePayload(payload);
        const emotion = extractEmotion(text);

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, emotion })}\n\n`));
      } catch (error) {
        console.error("Chat route error:", error);
        const message = error instanceof Error ? error.message : "Unknown chat error";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true, error: true, message })}\n\n`),
        );
      }
      controller.close();
    },
  });

  return new NextResponse(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
