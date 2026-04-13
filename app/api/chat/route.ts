import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are IYF (In Your Face) — a loud, expressive, in-your-face character who chats with users. You're enthusiastic, dramatic, and fun. Keep responses SHORT (1-3 sentences max). Always be entertaining.

After your response message, you MUST output a single line containing only a JSON object in this exact format:
{"emotion":"EMOTION"}

Choose ONE emotion from: NEUTRAL, HAPPY, SAD, ANGRY, SURPRISED, EXCITED, CONFUSED, THINKING

Example response:
Oh wow, you actually said that?! Bold move, I respect it.
{"emotion":"SURPRISED"}`;

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 256,
    system: SYSTEM_PROMPT,
    messages,
  });

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      let buffer = "";
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            const text = chunk.delta.text;
            buffer += text;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
          }
        }
        // Extract emotion from buffer
        const emotionMatch = buffer.match(/\{"emotion":"(\w+)"\}/);
        const emotion = emotionMatch ? emotionMatch[1] : "NEUTRAL";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, emotion })}\n\n`));
      } catch (e) {
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
