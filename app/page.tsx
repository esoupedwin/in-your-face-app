"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import Chat from "@/components/Chat";
import { Emotion } from "@/components/Face";

const Face = dynamic(() => import("@/components/Face"), { ssr: false });
const emotionOrder: Emotion[] = [
  "HAPPY",
  "DELIGHTED",
  "NEUTRAL",
  "SAD",
  "ANGRY",
  "SURPRISED",
  "EXCITED",
  "CONFUSED",
  "THINKING",
];

export default function Home() {
  const [emotion, setEmotion] = useState<Emotion>("HAPPY");
  const [isTalking, setIsTalking] = useState(false);

  const swapExpression = () => {
    setEmotion((prev) => {
      const index = emotionOrder.indexOf(prev);
      const nextIndex = index === -1 ? 0 : (index + 1) % emotionOrder.length;
      return emotionOrder[nextIndex];
    });
  };

  const toggleHappyDelighted = () => {
    setEmotion((prev) => (prev === "DELIGHTED" ? "HAPPY" : "DELIGHTED"));
  };

  const toggleHappyAngry = () => {
    setEmotion((prev) => (prev === "ANGRY" ? "HAPPY" : "ANGRY"));
  };

  const toggleHappySad = () => {
    setEmotion((prev) => (prev === "SAD" ? "HAPPY" : "SAD"));
  };

  return (
    <main
      className="min-h-screen w-full flex items-stretch relative pb-28"
      style={{ background: "#FFC107" }}
    >
      {/* Left — Face */}
      <div className="flex-1 flex items-center justify-center p-1" style={{ minWidth: 0 }}>
        <Face emotion={emotion} isTalking={isTalking} />
      </div>

      {/* Right — Chat */}
      <div
        className="flex flex-col p-6"
        style={{ width: "38%", minWidth: 320, maxWidth: 520 }}
      >
        <Chat onEmotionChange={setEmotion} onTalkingChange={setIsTalking} />
      </div>

      <div className="fixed left-1/2 -translate-x-1/2 bottom-8 z-30 flex gap-3">
        <button
          type="button"
          onClick={toggleHappySad}
          className="px-4 py-3 rounded-xl font-bold tracking-wide active:scale-95 transition-transform"
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "11px",
            background: "#4a4a4a",
            color: "#fff",
            border: "3px solid #333",
          }}
        >
          TOGGLE HAPPY/SAD
        </button>

        <button
          type="button"
          onClick={toggleHappyAngry}
          className="px-4 py-3 rounded-xl font-bold tracking-wide active:scale-95 transition-transform"
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "11px",
            background: "#7f2319",
            color: "#fff",
            border: "3px solid #5f1912",
          }}
        >
          TOGGLE HAPPY/ANGRY
        </button>

        <button
          type="button"
          onClick={toggleHappyDelighted}
          className="px-4 py-3 rounded-xl font-bold tracking-wide active:scale-95 transition-transform"
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "11px",
            background: "#5c4a10",
            color: "#fff",
            border: "3px solid #45370c",
          }}
        >
          TOGGLE HAPPY/DELIGHTED
        </button>

        <button
          type="button"
          onClick={swapExpression}
          className="px-6 py-3 rounded-xl font-bold tracking-wide active:scale-95 transition-transform"
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "12px",
            background: "#8B6914",
            color: "#fff",
            border: "3px solid #6f530f",
          }}
        >
          SWAP EXPRESSION
        </button>
      </div>
    </main>
  );
}
