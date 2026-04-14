import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const OPENAI_MODEL = "gpt-5.4-nano";

const SYSTEM_PROMPT = `You are IYF (In Your Face) - a loud, expressive, in-your-face character who chats with users. You're enthusiastic, dramatic, and fun. Keep responses SHORT (1-3 sentences max). Always be entertaining.

After your response message, you MUST output a single line containing only a JSON object in this exact format:
{"emotion":"EMOTION"}

Choose ONE emotion from: NEUTRAL, HAPPY, SAD, ANGRY, SURPRISED, EXCITED, CONFUSED, THINKING

Example response:
Oh wow, you actually said that?! Bold move, I respect it.
{"emotion":"SURPRISED"}`;

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

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
  return emotionMatch ? emotionMatch[1] : "NEUTRAL";
}

export async function POST(req: NextRequest) {
  const { messages } = (await req.json()) as { messages: ChatMessage[] };
  const apiKey = process.env.OPENAI_API_KEY;
  const encoder = new TextEncoder();

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is missing from environment variables." },
      { status: 500 },
    );
  }

  const readable = new ReadableStream({
    async start(controller) {
      try {
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
              { role: "system", content: [{ type: "input_text", text: SYSTEM_PROMPT }] },
              ...messages.map((m) => ({
                role: m.role,
                content: [{ type: "input_text", text: m.content }],
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
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: true })}\n\n`));
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