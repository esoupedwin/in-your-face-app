"use client";
import { useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import Chat from "@/components/Chat";
import { Emotion } from "@/components/Face";

const Face = dynamic(() => import("@/components/Face"), { ssr: false });

export default function Home() {
  const [emotion, setEmotion] = useState<Emotion>("HAPPY");
  const [isTalking, setIsTalking] = useState(false);
  const [showDebugButtons, setShowDebugButtons] = useState(false);
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const toggleHappyDelighted = () => {
    setEmotion((prev) => (prev === "DELIGHTED" ? "HAPPY" : "DELIGHTED"));
  };

  const toggleHappyAngry = () => {
    setEmotion((prev) => (prev === "ANGRY" ? "HAPPY" : "ANGRY"));
  };

  const toggleHappyPissed = () => {
    setEmotion((prev) => (prev === "PISSED" ? "HAPPY" : "PISSED"));
  };

  const toggleHappySad = () => {
    setEmotion((prev) => (prev === "SAD" ? "HAPPY" : "SAD"));
  };

  if (!isMounted) {
    return <main className="min-h-screen w-full" style={{ background: "#FFC107" }} />;
  }

  return (
    <main
      className="w-full h-[100dvh] md:min-h-screen flex flex-col md:flex-row items-stretch relative gap-0 md:gap-3 overflow-hidden md:overflow-visible pb-4 md:pb-28"
      style={{ background: "#FFC107" }}
    >
      {/* Left - Face */}
      <div
        className="w-full md:flex-1 flex items-center justify-center p-1 min-h-[24vh] md:min-h-0"
        style={{ minWidth: 0 }}
      >
        <Face emotion={emotion} isTalking={isTalking} />
      </div>

      <button
        type="button"
        onClick={() => setShowDebugButtons((prev) => !prev)}
        className="fixed left-3 bottom-3 md:left-6 md:bottom-6 z-40 px-4 py-3 rounded-xl font-bold tracking-wide active:scale-95 transition-transform"
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: "10px",
          background: "#2f2f2f",
          color: "#fff",
          border: "3px solid #1f1f1f",
        }}
      >
        {showDebugButtons ? "HIDE TOGGLES" : "SHOW TOGGLES"}
      </button>

      <div
        className={`w-full z-30 flex flex-wrap justify-center gap-2 px-3 md:fixed md:left-1/2 md:-translate-x-1/2 md:bottom-8 md:gap-3 ${showDebugButtons ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
        <button
          type="button"
          onClick={toggleHappySad}
          className="px-3 md:px-4 py-3 rounded-xl font-bold tracking-wide active:scale-95 transition-transform"
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "10px",
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
          className="px-3 md:px-4 py-3 rounded-xl font-bold tracking-wide active:scale-95 transition-transform"
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "10px",
            background: "#7f2319",
            color: "#fff",
            border: "3px solid #5f1912",
          }}
        >
          TOGGLE HAPPY/ANGRY
        </button>

        <button
          type="button"
          onClick={toggleHappyPissed}
          className="px-3 md:px-4 py-3 rounded-xl font-bold tracking-wide active:scale-95 transition-transform"
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "10px",
            background: "#7a2f44",
            color: "#fff",
            border: "3px solid #5d2433",
          }}
        >
          TOGGLE HAPPY/PISSED
        </button>

        <button
          type="button"
          onClick={toggleHappyDelighted}
          className="px-3 md:px-4 py-3 rounded-xl font-bold tracking-wide active:scale-95 transition-transform"
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "10px",
            background: "#5c4a10",
            color: "#fff",
            border: "3px solid #45370c",
          }}
        >
          TOGGLE HAPPY/DELIGHTED
        </button>
      </div>

      {/* Right - Chat */}
      <div className="w-full md:w-[38%] md:min-w-[320px] md:max-w-[520px] flex-1 min-h-0 flex flex-col px-3 pt-0 pb-16 -mt-80 md:mt-0 md:p-6">
        <Chat onEmotionChange={setEmotion} onTalkingChange={setIsTalking} />
      </div>
    </main>
  );
}
