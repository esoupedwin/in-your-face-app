"use client";
import { useEffect, useRef, useState } from "react";
import { Emotion } from "./Face";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatProps {
  onEmotionChange: (e: Emotion) => void;
  onTalkingChange: (t: boolean) => void;
}

export default function Chat({ onEmotionChange, onTalkingChange }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [displayText, setDisplayText] = useState("WHAT DO YOU MEAN?");
  const [isLoading, setIsLoading] = useState(false);
  const displayRef = useRef<HTMLDivElement>(null);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    setIsLoading(true);
    onTalkingChange(true);

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);

    const apiMessages = newMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          const data = JSON.parse(line.slice(6));
          if (data.text) {
            fullText += data.text;
            // Strip the JSON emotion tag from display
            const display = fullText.replace(/\s*\{"emotion":"[^"]+"\}\s*$/, "");
            setDisplayText(display || "...");
          }
          if (data.done) {
            onEmotionChange(data.emotion as Emotion);
            onTalkingChange(false);
            setIsLoading(false);
            // Clean final text
            const clean = fullText.replace(/\s*\{"emotion":"[^"]+"\}\s*$/, "").trim();
            setDisplayText(clean);
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: clean },
            ]);
          }
        }
      }
    } catch {
      setDisplayText("UGH, SOMETHING BROKE. TRY AGAIN!");
      onTalkingChange(false);
      onEmotionChange("ANGRY");
      setIsLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Auto-scroll display
  useEffect(() => {
    if (displayRef.current) {
      displayRef.current.scrollTop = displayRef.current.scrollHeight;
    }
  }, [displayText]);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Message display */}
      <div
        ref={displayRef}
        className="flex-1 rounded-2xl p-8 overflow-y-auto flex items-center justify-center"
        style={{
          background: "#FFF8C5",
          border: "3px solid #E8C840",
          minHeight: 0,
        }}
      >
        <p
          suppressHydrationWarning
          className="text-center leading-relaxed break-words w-full"
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "clamp(10px, 1.4vw, 16px)",
            color: "#3a2e00",
            lineHeight: "2",
          }}
        >
          {displayText}
        </p>
      </div>

      {/* Input area */}
      <div
        className="rounded-2xl p-4 flex flex-col gap-3"
        style={{ background: "#FFF8C5", border: "3px solid #E8C840" }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="TYPE YOUR TEXT HERE"
          rows={2}
          disabled={isLoading}
          className="w-full resize-none bg-transparent outline-none text-center"
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "clamp(8px, 1.1vw, 13px)",
            color: "#3a2e00",
            caretColor: "#3a2e00",
            opacity: isLoading ? 0.5 : 1,
          }}
        />
        <div className="flex justify-end">
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="px-6 py-2 rounded-lg font-bold transition-all active:scale-95"
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: "clamp(10px, 1.1vw, 14px)",
              background: isLoading || !input.trim() ? "#a89040" : "#8B6914",
              color: "white",
              border: "none",
              cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
              letterSpacing: "0.05em",
            }}
          >
            {isLoading ? "..." : "SAY"}
          </button>
        </div>
      </div>
    </div>
  );
}
