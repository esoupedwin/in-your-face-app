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

const INITIATIVE_CHECK_MS = 20_000;
const INITIATIVE_CHANCE = 0.5;
const USER_REPLY_TIMEOUT_MS = 60_000;
const CHAPPIE_INITIATIVE_QUESTION_PROMPT =
  "Start a short, natural conversation opener as a friendly question to get to know the user better, or ask about everyday life. Sound human and casual.";
const CHAPPIE_INITIATIVE_REMARK_PROMPT =
  "Start a short, natural passing remark (not a question) like a normal human casual comment. Keep it conversational and friendly.";
const CHAPPIE_MEMORY_INITIATIVE_QUESTION_PROMPT =
  "Start a short, natural conversation opener as a friendly question that uses one remembered user detail if available. If no useful memory exists, ask a casual everyday question.";
const CHAPPIE_MEMORY_INITIATIVE_REMARK_PROMPT =
  "Start a short, natural passing remark (not a question) that uses one remembered user detail if available. If no useful memory exists, use a casual everyday remark.";

export default function Chat({ onEmotionChange, onTalkingChange }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [isChappieConversationActive, setIsChappieConversationActive] = useState(false);
  const [isAutoInitiativeEnabled, setIsAutoInitiativeEnabled] = useState(true);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chimeAudioContextRef = useRef<AudioContext | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const isLoadingRef = useRef(false);
  const isChappieConversationActiveRef = useRef(false);
  const userReplyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendToAssistantRef = useRef<
    ((params: {
      userText: string;
      hideUserMessage?: boolean;
      initiatedByChappie?: boolean;
    }) => Promise<void>) | null
  >(null);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  const playChime = async () => {
    if (typeof window === "undefined") return;
    const AudioContextCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;

    if (!chimeAudioContextRef.current) {
      chimeAudioContextRef.current = new AudioContextCtor();
    }

    const ctx = chimeAudioContextRef.current;
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        return;
      }
    }

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "triangle";
    osc2.type = "sine";
    osc1.frequency.setValueAtTime(784, now);
    osc2.frequency.setValueAtTime(1046, now + 0.04);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.04);
    osc1.stop(now + 0.2);
    osc2.stop(now + 0.24);
  };

  const setConversationActive = (active: boolean) => {
    isChappieConversationActiveRef.current = active;
    setIsChappieConversationActive(active);
  };

  const clearUserReplyTimeout = () => {
    if (userReplyTimeoutRef.current) {
      clearTimeout(userReplyTimeoutRef.current);
      userReplyTimeoutRef.current = null;
    }
  };

  const startUserReplyTimeout = () => {
    clearUserReplyTimeout();
    userReplyTimeoutRef.current = setTimeout(() => {
      setConversationActive(false);
    }, USER_REPLY_TIMEOUT_MS);
  };

  const validEmotions: Emotion[] = [
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
  ];

  const stripEmotionTag = (text: string) =>
    text.replace(/\s*\{"emotion":"[^"]+"\}\s*$/, "").trim();

  const normalizeEmotion = (emotion: unknown): Emotion => {
    if (typeof emotion === "string" && validEmotions.includes(emotion as Emotion)) {
      return emotion as Emotion;
    }
    return "NEUTRAL";
  };

  const clearChat = () => {
    if (isLoading) return;
    clearUserReplyTimeout();
    setMessages([]);
    messagesRef.current = [];
    setErrorText("");
    setConversationActive(false);
    onEmotionChange("NEUTRAL");
    onTalkingChange(false);
    focusInput();
  };

  const sendToAssistant = async ({
    userText,
    hideUserMessage = false,
    initiatedByChappie = false,
  }: {
    userText: string;
    hideUserMessage?: boolean;
    initiatedByChappie?: boolean;
  }) => {
    const text = userText.trim();
    if (!text || isLoadingRef.current) return;

    let newMessages = messagesRef.current;
    if (!hideUserMessage) {
      const userMessage: Message = { role: "user", content: text };
      newMessages = [...messagesRef.current, userMessage];
      messagesRef.current = newMessages;
      setMessages(newMessages);
      setInput("");
      setConversationActive(true);
      clearUserReplyTimeout();
    }

    setIsLoading(true);
    isLoadingRef.current = true;
    setErrorText("");
    onTalkingChange(true);
    focusInput();

    const requestMessages = hideUserMessage
      ? [...newMessages, { role: "user" as const, content: text }]
      : newMessages;

    const apiMessages = requestMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || `Request failed with status ${res.status}`);
      }

      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let buffer = "";
      let doneEventSeen = false;

      const handleDataLine = (line: string) => {
        if (!line.startsWith("data: ")) return;

        let data: {
          text?: string;
          done?: boolean;
          emotion?: string;
          error?: boolean;
          message?: string;
        };
        try {
          data = JSON.parse(line.slice(6)) as {
            text?: string;
            done?: boolean;
            emotion?: string;
            error?: boolean;
            message?: string;
          };
        } catch {
          return;
        }

        if (data.error) {
          setErrorText(data.message || "Something broke on the server. Try again.");
          onTalkingChange(false);
          onEmotionChange("ANGRY");
          setIsLoading(false);
          isLoadingRef.current = false;
          clearUserReplyTimeout();
          setConversationActive(false);
          doneEventSeen = true;
          focusInput();
          return;
        }

        if (typeof data.text === "string") {
          fullText += data.text;
        }

        if (data.done) {
          const clean = stripEmotionTag(fullText);
          if (!clean) {
            setErrorText("No response text came back. Try again.");
            onTalkingChange(false);
            onEmotionChange("CONFUSED");
            setIsLoading(false);
            isLoadingRef.current = false;
            clearUserReplyTimeout();
            setConversationActive(false);
            doneEventSeen = true;
            focusInput();
            return;
          }

          const finalEmotion = normalizeEmotion(data.emotion);
          onEmotionChange(finalEmotion);
          onTalkingChange(false);
          setIsLoading(false);
          isLoadingRef.current = false;
          const nextMessages = [...messagesRef.current, { role: "assistant" as const, content: clean }];
          messagesRef.current = nextMessages;
          setMessages(nextMessages);
          void playChime();

          if (initiatedByChappie) {
            setConversationActive(true);
          }

          if (isChappieConversationActiveRef.current || initiatedByChappie) {
            startUserReplyTimeout();
          }

          doneEventSeen = true;
          focusInput();
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          handleDataLine(line.trim());
        }
      }

      buffer += decoder.decode();
      const trailingLines = buffer.split(/\r?\n/);
      for (const line of trailingLines) {
        handleDataLine(line.trim());
      }

      if (!doneEventSeen) {
        const clean = stripEmotionTag(fullText);
        if (clean) {
          const nextMessages = [...messagesRef.current, { role: "assistant" as const, content: clean }];
          messagesRef.current = nextMessages;
          setMessages(nextMessages);
          void playChime();
          onEmotionChange("THINKING");

          if (initiatedByChappie) {
            setConversationActive(true);
          }
          if (isChappieConversationActiveRef.current || initiatedByChappie) {
            startUserReplyTimeout();
          }
        } else {
          setErrorText("No response received. Please retry.");
          onEmotionChange("CONFUSED");
          clearUserReplyTimeout();
          setConversationActive(false);
        }
        onTalkingChange(false);
        setIsLoading(false);
        isLoadingRef.current = false;
        focusInput();
      }
    } catch {
      setErrorText("Network wobble. Try that again.");
      onTalkingChange(false);
      onEmotionChange("ANGRY");
      setIsLoading(false);
      isLoadingRef.current = false;
      clearUserReplyTimeout();
      setConversationActive(false);
      focusInput();
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoadingRef.current) return;
    await sendToAssistant({ userText: text });
  };

  sendToAssistantRef.current = sendToAssistant;

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    focusInput();
  }, []);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    isChappieConversationActiveRef.current = isChappieConversationActive;
  }, [isChappieConversationActive]);

  useEffect(() => {
    if (!isAutoInitiativeEnabled || isChappieConversationActive) return;

    const timer = setInterval(() => {
      if (isLoadingRef.current || isChappieConversationActiveRef.current) return;
      if (Math.random() < INITIATIVE_CHANCE) {
        const useMemoryStarter = Math.random() < 0.5;
        const useQuestionStarter = Math.random() < 0.5;
        const prompt = useMemoryStarter
          ? useQuestionStarter
            ? CHAPPIE_MEMORY_INITIATIVE_QUESTION_PROMPT
            : CHAPPIE_MEMORY_INITIATIVE_REMARK_PROMPT
          : useQuestionStarter
            ? CHAPPIE_INITIATIVE_QUESTION_PROMPT
            : CHAPPIE_INITIATIVE_REMARK_PROMPT;

        void sendToAssistantRef.current?.({
          userText: prompt,
          hideUserMessage: true,
          initiatedByChappie: true,
        });
      }
    }, INITIATIVE_CHECK_MS);

    return () => clearInterval(timer);
  }, [isAutoInitiativeEnabled, isChappieConversationActive]);

  useEffect(() => {
    return () => {
      clearUserReplyTimeout();
    };
  }, []);

  return (
    <div className="flex flex-col h-full min-h-0 gap-3">
      <button
        type="button"
        onClick={() => setIsAutoInitiativeEnabled((prev) => !prev)}
        className="fixed top-3 right-3 md:top-6 md:right-6 z-40 px-3 py-2 rounded-xl font-bold tracking-wide active:scale-95 transition-transform"
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: "9px",
          background: isAutoInitiativeEnabled ? "#2c7a32" : "#6b1f1f",
          color: "#fff",
          border: isAutoInitiativeEnabled ? "3px solid #1f5b24" : "3px solid #4d1616",
        }}
        aria-label={isAutoInitiativeEnabled ? "Stop Chappie auto conversation" : "Start Chappie auto conversation"}
      >
        {isAutoInitiativeEnabled ? "CHAPPIE AUTO: ON" : "CHAPPIE AUTO: OFF"}
      </button>

      <div
        ref={transcriptRef}
        className="rounded-2xl p-4 overflow-y-auto flex-1 min-h-[300px]"
        style={{
          background: "#FFE782",
          border: "3px solid #D2AA22",
          maxHeight: "none",
        }}
      >
        <p
          className="text-center mb-3"
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "10px",
            color: "#5a4400",
            letterSpacing: "0.05em",
          }}
        >
          CHAT LOG
        </p>

        {messages.length === 0 ? (
          <p
            className="text-center"
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: "10px",
              color: "#7d660f",
              lineHeight: 1.8,
            }}
          >
            NO MESSAGES YET. TYPE SOMETHING MENACING.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((msg, idx) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={`${msg.role}-${idx}`}
                  className={`max-w-[88%] rounded-xl px-3 py-2 ${isUser ? "self-end" : "self-start"}`}
                  style={{
                    background: isUser ? "#8B6914" : "#FFF8C5",
                    color: isUser ? "#fffef6" : "#3a2e00",
                    border: isUser ? "2px solid #6f520f" : "2px solid #D2AA22",
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: "10px",
                    lineHeight: 1.7,
                    wordBreak: "break-word",
                  }}
                  aria-label={isUser ? "User message" : "Assistant message"}
                >
                  {msg.content}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div
        className="rounded-2xl p-3 md:p-4 flex flex-col gap-3"
        style={{ background: "#FFF8C5", border: "3px solid #E8C840" }}
      >
        <div className="flex items-center justify-between gap-2">
          <p
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: "9px",
              color: isLoading ? "#8B6914" : "#6a5200",
            }}
          >
            {isLoading ? "CHAPPIE IS COOKING..." : "ENTER = SEND  |  SHIFT+ENTER = NEW LINE"}
          </p>

          <button
            type="button"
            onClick={clearChat}
            disabled={isLoading || messages.length === 0}
            className="px-3 py-1 rounded-md transition-all active:scale-95"
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: "9px",
              background: isLoading || messages.length === 0 ? "#b39a4a" : "#6f520f",
              color: "#fff",
              border: "none",
              cursor: isLoading || messages.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            CLEAR
          </button>
        </div>

        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          aria-label="Message input"
          placeholder="TYPE YOUR TEXT HERE..."
          rows={2}
          disabled={isLoading}
          className="w-full resize-none bg-transparent outline-none text-center chat-input"
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
            type="button"
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

        {errorText && (
          <p
            role="alert"
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: "9px",
              color: "#8b1e1e",
              textAlign: "center",
            }}
          >
            {errorText}
          </p>
        )}
      </div>
    </div>
  );
}
