"use client";
import { useEffect, useRef, useState } from "react";

export type Emotion =
  | "NEUTRAL"
  | "HAPPY"
  | "DELIGHTED"
  | "PISSED"
  | "SAD"
  | "ANGRY"
  | "SURPRISED"
  | "EXCITED"
  | "CONFUSED"
  | "THINKING";

interface FaceProps {
  emotion: Emotion;
  isTalking: boolean;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

// Emotion configs: eyebrows, eyes, mouth shape
const configs: Record<
  Emotion,
  {
    leftBrow: { x: number; y: number; rotate: number };
    rightBrow: { x: number; y: number; rotate: number };
    leftPupil: { x: number; y: number };
    rightPupil: { x: number; y: number };
    leftEyeScale: number;
    rightEyeScale: number;
    mouthOpen: number; // 0-1
    mouthWidth: number;
    mouthSmile: number; // positive = smile, negative = frown
    color: string;
    mouthMode: "open" | "smile" | "delighted" | "sad" | "pissed";
    animation: {
      blinkMinMs: number;
      blinkJitterMs: number;
      gazeMinMs: number;
      gazeJitterMs: number;
      gazeXMin: number;
      gazeXMax: number;
      gazeYMax: number;
      expressionSpeed: number;
      expressionAmount: number;
    };
  }
> = {
  NEUTRAL: {
    leftBrow: { x: 0, y: -4, rotate: -8 },
    rightBrow: { x: 0, y: -4, rotate: 12 },
    leftPupil: { x: 0, y: 0 },
    rightPupil: { x: 0, y: 0 },
    leftEyeScale: 1,
    rightEyeScale: 1,
    mouthOpen: 0.44,
    mouthWidth: 1,
    mouthSmile: 0,
    color: "#FFC107",
    mouthMode: "open",
    animation: {
      blinkMinMs: 850,
      blinkJitterMs: 1800,
      gazeMinMs: 900,
      gazeJitterMs: 2200,
      gazeXMin: 6,
      gazeXMax: 14,
      gazeYMax: 3,
      expressionSpeed: 0.8,
      expressionAmount: 1,
    },
  },
  HAPPY: {
    leftBrow: { x: -2, y: -6, rotate: -8 },
    rightBrow: { x: 2, y: -6, rotate: 10 },
    leftPupil: { x: 0, y: -5 },
    rightPupil: { x: 0, y: -5 },
    leftEyeScale: 1.06,
    rightEyeScale: 1.06,
    mouthOpen: 0.35,
    mouthWidth: 0.95,
    mouthSmile: 1.2,
    color: "#FFD740",
    mouthMode: "smile",
    animation: {
      blinkMinMs: 1200,
      blinkJitterMs: 1600,
      gazeMinMs: 700,
      gazeJitterMs: 1700,
      gazeXMin: 5,
      gazeXMax: 11,
      gazeYMax: 4,
      expressionSpeed: 2,
      expressionAmount: 1.8,
    },
  },
  DELIGHTED: {
    leftBrow: { x: -1, y: -7, rotate: -10 },
    rightBrow: { x: 1, y: -7, rotate: 12 },
    leftPupil: { x: 0, y: -2 },
    rightPupil: { x: 0, y: -2 },
    leftEyeScale: 1.03,
    rightEyeScale: 1.03,
    mouthOpen: 0.74,
    mouthWidth: 1.05,
    mouthSmile: 0.9,
    color: "#FFD740",
    mouthMode: "delighted",
    animation: {
      blinkMinMs: 1200,
      blinkJitterMs: 1400,
      gazeMinMs: 650,
      gazeJitterMs: 1500,
      gazeXMin: 6,
      gazeXMax: 12,
      gazeYMax: 4,
      expressionSpeed: 2.2,
      expressionAmount: 2,
    },
  },
  PISSED: {
    leftBrow: { x: 3, y: 10, rotate: 14 },
    rightBrow: { x: -6, y: 9, rotate: -14 },
    leftPupil: { x: 0, y: 1 },
    rightPupil: { x: 0, y: 1 },
    leftEyeScale: 1.02,
    rightEyeScale: 1.02,
    mouthOpen: 0.16,
    mouthWidth: 0.92,
    mouthSmile: -0.9,
    color: "#FFB300",
    mouthMode: "pissed",
    animation: {
      blinkMinMs: 820,
      blinkJitterMs: 1200,
      gazeMinMs: 760,
      gazeJitterMs: 1300,
      gazeXMin: 4,
      gazeXMax: 9,
      gazeYMax: 2,
      expressionSpeed: 1.5,
      expressionAmount: 1.1,
    },
  },
  SAD: {
    leftBrow: { x: -4, y: -2, rotate: 30 },
    rightBrow: { x: 4, y: -2, rotate: -30 },
    leftPupil: { x: -2, y: 8 },
    rightPupil: { x: 2, y: 8 },
    leftEyeScale: 1.06,
    rightEyeScale: 1.06,
    mouthOpen: 0.2,
    mouthWidth: 0.85,
    mouthSmile: -1.2,
    color: "#FFA726",
    mouthMode: "sad",
    animation: {
      blinkMinMs: 900,
      blinkJitterMs: 1600,
      gazeMinMs: 1000,
      gazeJitterMs: 2400,
      gazeXMin: 4,
      gazeXMax: 10,
      gazeYMax: 2,
      expressionSpeed: 0.7,
      expressionAmount: 0.8,
    },
  },
  ANGRY: {
    leftBrow: { x: 8, y: -2, rotate: 18 },
    rightBrow: { x: -8, y: -2, rotate: -18 },
    leftPupil: { x: 0, y: 0 },
    rightPupil: { x: 0, y: 0 },
    leftEyeScale: 0.98,
    rightEyeScale: 0.98,
    mouthOpen: 0.72,
    mouthWidth: 1.02,
    mouthSmile: 0.02,
    color: "#FF8F00",
    mouthMode: "open",
    animation: {
      blinkMinMs: 700,
      blinkJitterMs: 1200,
      gazeMinMs: 700,
      gazeJitterMs: 1600,
      gazeXMin: 7,
      gazeXMax: 14,
      gazeYMax: 1.5,
      expressionSpeed: 1.1,
      expressionAmount: 1.2,
    },
  },
  SURPRISED: {
    leftBrow: { x: 0, y: -15, rotate: 0 },
    rightBrow: { x: 0, y: -15, rotate: 0 },
    leftPupil: { x: 0, y: 0 },
    rightPupil: { x: 0, y: 0 },
    leftEyeScale: 1.3,
    rightEyeScale: 1.3,
    mouthOpen: 0.9,
    mouthWidth: 0.85,
    mouthSmile: 0,
    color: "#FFCA28",
    mouthMode: "open",
    animation: {
      blinkMinMs: 1500,
      blinkJitterMs: 2200,
      gazeMinMs: 1200,
      gazeJitterMs: 2500,
      gazeXMin: 3,
      gazeXMax: 8,
      gazeYMax: 2,
      expressionSpeed: 0.5,
      expressionAmount: 0.6,
    },
  },
  EXCITED: {
    leftBrow: { x: 0, y: -12, rotate: -8 },
    rightBrow: { x: 0, y: -12, rotate: 8 },
    leftPupil: { x: 0, y: -8 },
    rightPupil: { x: 0, y: -8 },
    leftEyeScale: 1.2,
    rightEyeScale: 1.2,
    mouthOpen: 0.8,
    mouthWidth: 1.2,
    mouthSmile: 1,
    color: "#FFD740",
    mouthMode: "open",
    animation: {
      blinkMinMs: 900,
      blinkJitterMs: 1300,
      gazeMinMs: 650,
      gazeJitterMs: 1100,
      gazeXMin: 5,
      gazeXMax: 12,
      gazeYMax: 4,
      expressionSpeed: 1.7,
      expressionAmount: 1.5,
    },
  },
  CONFUSED: {
    leftBrow: { x: 0, y: -10, rotate: -15 },
    rightBrow: { x: 0, y: 5, rotate: 10 },
    leftPupil: { x: -5, y: -5 },
    rightPupil: { x: 5, y: 5 },
    leftEyeScale: 1.1,
    rightEyeScale: 0.9,
    mouthOpen: 0.35,
    mouthWidth: 0.9,
    mouthSmile: -0.3,
    color: "#FFC107",
    mouthMode: "open",
    animation: {
      blinkMinMs: 900,
      blinkJitterMs: 1800,
      gazeMinMs: 750,
      gazeJitterMs: 1400,
      gazeXMin: 5,
      gazeXMax: 11,
      gazeYMax: 4,
      expressionSpeed: 1.3,
      expressionAmount: 1.1,
    },
  },
  THINKING: {
    leftBrow: { x: 0, y: -5, rotate: -10 },
    rightBrow: { x: 0, y: -14, rotate: 12 },
    leftPupil: { x: -8, y: -10 },
    rightPupil: { x: -8, y: -10 },
    leftEyeScale: 0.95,
    rightEyeScale: 1.05,
    mouthOpen: 0.1,
    mouthWidth: 0.8,
    mouthSmile: 0.2,
    color: "#FFC107",
    mouthMode: "open",
    animation: {
      blinkMinMs: 1000,
      blinkJitterMs: 1700,
      gazeMinMs: 800,
      gazeJitterMs: 1500,
      gazeXMin: 4,
      gazeXMax: 10,
      gazeYMax: 3,
      expressionSpeed: 0.8,
      expressionAmount: 1,
    },
  },
};

export default function Face({ emotion, isTalking }: FaceProps) {
  const cfg = configs[emotion];
  const [talkPhase, setTalkPhase] = useState(0);
  const [blinkAmount, setBlinkAmount] = useState(0);
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  const [bounce, setBounce] = useState(0);
  const [browIdle, setBrowIdle] = useState({
    leftY: 0,
    rightY: 0,
    leftRotate: 0,
    rightRotate: 0,
  });
  const [expressionPhase, setExpressionPhase] = useState(0);
  const [happyDelightBlend, setHappyDelightBlend] = useState(
    emotion === "DELIGHTED" ? 1 : 0,
  );
  const [happyAngryBlend, setHappyAngryBlend] = useState(emotion === "ANGRY" ? 1 : 0);
  const [happySadBlend, setHappySadBlend] = useState(emotion === "SAD" ? 1 : 0);
  const [happyPissedBlend, setHappyPissedBlend] = useState(emotion === "PISSED" ? 1 : 0);
  const [delightedJaw, setDelightedJaw] = useState(0.55);
  const happyDelightBlendRef = useRef(emotion === "DELIGHTED" ? 1 : 0);
  const happyAngryBlendRef = useRef(emotion === "ANGRY" ? 1 : 0);
  const happySadBlendRef = useRef(emotion === "SAD" ? 1 : 0);
  const happyPissedBlendRef = useRef(emotion === "PISSED" ? 1 : 0);
  const delightedJawRef = useRef(0.55);
  const delightedJawTargetRef = useRef(0.55);
  const animRef = useRef<number | null>(null);
  const talkRef = useRef<number | null>(null);
  const blinkRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blinkAnimRef = useRef<number | null>(null);
  const expressionAnimRef = useRef<number | null>(null);
  const happyDelightAnimRef = useRef<number | null>(null);
  const happyAngryAnimRef = useRef<number | null>(null);
  const happySadAnimRef = useRef<number | null>(null);
  const happyPissedAnimRef = useRef<number | null>(null);
  const delightedJawAnimRef = useRef<number | null>(null);
  const delightedJawTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const browAnimRef = useRef<number | null>(null);
  const browTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const browRef = useRef({
    leftY: 0,
    rightY: 0,
    leftRotate: 0,
    rightRotate: 0,
  });
  const browTargetRef = useRef({
    leftY: 0,
    rightY: 0,
    leftRotate: 0,
    rightRotate: 0,
  });
  const gazeRef = useRef({ x: 0, y: 0 });
  const gazeTargetRef = useRef({ x: 0, y: 0 });
  const gazeAnimRef = useRef<number | null>(null);
  const gazeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Talking jaw animation
  useEffect(() => {
    if (isTalking) {
      let t = 0;
      const animate = () => {
        t += 0.18;
        setTalkPhase(Math.sin(t));
        setBounce(Math.sin(t * 0.5) * 3);
        talkRef.current = requestAnimationFrame(animate);
      };
      talkRef.current = requestAnimationFrame(animate);
    } else {
      if (talkRef.current) cancelAnimationFrame(talkRef.current);
      animRef.current = requestAnimationFrame(() => {
        setTalkPhase(0);
        setBounce(0);
      });
    }
    return () => {
      if (talkRef.current) cancelAnimationFrame(talkRef.current);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isTalking]);

  // Blinking
  useEffect(() => {
    let isActive = true;

    const easeInOut = (t: number) => 0.5 - Math.cos(Math.PI * t) * 0.5;

    const runBlink = () => {
      const duration = 140 + Math.random() * 120;
      const start = performance.now();

      const animate = (now: number) => {
        if (!isActive) return;
        const p = Math.min((now - start) / duration, 1);
        const closePhase = p < 0.5 ? p * 2 : (1 - p) * 2;
        setBlinkAmount(easeInOut(closePhase));

        if (p < 1) {
          blinkAnimRef.current = requestAnimationFrame(animate);
          return;
        }

        setBlinkAmount(0);
        scheduleBlink();
      };

      blinkAnimRef.current = requestAnimationFrame(animate);
    };

    const scheduleBlink = () => {
      const delay = cfg.animation.blinkMinMs + Math.random() * cfg.animation.blinkJitterMs;
      blinkRef.current = setTimeout(() => {
        runBlink();
      }, delay);
    };

    scheduleBlink();
    return () => {
      isActive = false;
      if (blinkRef.current) clearTimeout(blinkRef.current);
      if (blinkAnimRef.current) cancelAnimationFrame(blinkAnimRef.current);
    };
  }, [cfg.animation.blinkJitterMs, cfg.animation.blinkMinMs]);

  // Idle gaze: smooth side-to-side glances with slight random angle.
  useEffect(() => {
    let isActive = true;

    const scheduleNextTarget = () => {
      const delay = cfg.animation.gazeMinMs + Math.random() * cfg.animation.gazeJitterMs;
      gazeTimerRef.current = setTimeout(() => {
        if (!isActive) return;
        const direction = Math.random() < 0.5 ? -1 : 1;
        const magnitudeX =
          cfg.animation.gazeXMin +
          Math.random() * (cfg.animation.gazeXMax - cfg.animation.gazeXMin);
        const angleY = (Math.random() * 2 - 1) * cfg.animation.gazeYMax;
        gazeTargetRef.current = {
          x: direction * magnitudeX,
          y: angleY,
        };
        scheduleNextTarget();
      }, delay);
    };

    const animate = () => {
      if (!isActive) return;
      gazeRef.current.x += (gazeTargetRef.current.x - gazeRef.current.x) * 0.08;
      gazeRef.current.y += (gazeTargetRef.current.y - gazeRef.current.y) * 0.08;
      setGaze({ x: gazeRef.current.x, y: gazeRef.current.y });
      gazeAnimRef.current = requestAnimationFrame(animate);
    };

    scheduleNextTarget();
    gazeAnimRef.current = requestAnimationFrame(animate);

    return () => {
      isActive = false;
      if (gazeTimerRef.current) clearTimeout(gazeTimerRef.current);
      if (gazeAnimRef.current) cancelAnimationFrame(gazeAnimRef.current);
    };
  }, [
    cfg.animation.gazeJitterMs,
    cfg.animation.gazeMinMs,
    cfg.animation.gazeXMax,
    cfg.animation.gazeXMin,
    cfg.animation.gazeYMax,
  ]);

  // Expression-specific idle animation phase.
  useEffect(() => {
    let isActive = true;
    let phase = 0;
    const animate = () => {
      if (!isActive) return;
      phase += 0.02 * cfg.animation.expressionSpeed;
      setExpressionPhase(Math.sin(phase));
      expressionAnimRef.current = requestAnimationFrame(animate);
    };
    expressionAnimRef.current = requestAnimationFrame(animate);
    return () => {
      isActive = false;
      if (expressionAnimRef.current) cancelAnimationFrame(expressionAnimRef.current);
    };
  }, [cfg.animation.expressionSpeed]);

  // Smoothly transition between HAPPY and DELIGHTED mouths.
  useEffect(() => {
    const target = emotion === "DELIGHTED" ? 1 : 0;
    if (emotion !== "HAPPY" && emotion !== "DELIGHTED") {
      happyDelightBlendRef.current = 0;
      if (happyDelightAnimRef.current) {
        cancelAnimationFrame(happyDelightAnimRef.current);
      }
      happyDelightAnimRef.current = requestAnimationFrame(() => {
        setHappyDelightBlend(0);
      });
      return;
    }

    const start = performance.now();
    const from = happyDelightBlendRef.current;
    const duration = target > from ? 420 : 560;
    const delta = target - from;

    const easeOutBack = (t: number) => {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    };
    const easeInOutQuint = (t: number) =>
      t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;

    const animate = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = target > from ? easeOutBack(p) : easeInOutQuint(p);
      const nextBlend = from + delta * eased;
      happyDelightBlendRef.current = nextBlend;
      setHappyDelightBlend(nextBlend);
      if (p < 1) {
        happyDelightAnimRef.current = requestAnimationFrame(animate);
      }
    };

    if (happyDelightAnimRef.current) {
      cancelAnimationFrame(happyDelightAnimRef.current);
    }
    happyDelightAnimRef.current = requestAnimationFrame(animate);

    return () => {
      if (happyDelightAnimRef.current) {
        cancelAnimationFrame(happyDelightAnimRef.current);
      }
    };
  }, [emotion]);

  // Smoothly transition between HAPPY and ANGRY.
  useEffect(() => {
    const target = emotion === "ANGRY" ? 1 : 0;
    if (emotion !== "HAPPY" && emotion !== "ANGRY") {
      happyAngryBlendRef.current = 0;
      if (happyAngryAnimRef.current) {
        cancelAnimationFrame(happyAngryAnimRef.current);
      }
      happyAngryAnimRef.current = requestAnimationFrame(() => {
        setHappyAngryBlend(0);
      });
      return;
    }

    const start = performance.now();
    const duration = 460;
    const from = happyAngryBlendRef.current;
    const delta = target - from;

    const easeInOut = (t: number) => 0.5 - Math.cos(Math.PI * t) * 0.5;
    const easeOutBack = (t: number) => {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    };

    const animate = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = target > from ? easeOutBack(p) : easeInOut(p);
      const nextBlend = from + delta * eased;
      happyAngryBlendRef.current = nextBlend;
      setHappyAngryBlend(nextBlend);
      if (p < 1) {
        happyAngryAnimRef.current = requestAnimationFrame(animate);
      }
    };

    if (happyAngryAnimRef.current) {
      cancelAnimationFrame(happyAngryAnimRef.current);
    }
    happyAngryAnimRef.current = requestAnimationFrame(animate);

    return () => {
      if (happyAngryAnimRef.current) {
        cancelAnimationFrame(happyAngryAnimRef.current);
      }
    };
  }, [emotion]);

  // Smoothly transition between HAPPY and SAD eyes.
  useEffect(() => {
    const target = emotion === "SAD" ? 1 : 0;
    if (emotion !== "HAPPY" && emotion !== "SAD") {
      happySadBlendRef.current = 0;
      if (happySadAnimRef.current) {
        cancelAnimationFrame(happySadAnimRef.current);
      }
      happySadAnimRef.current = requestAnimationFrame(() => {
        setHappySadBlend(0);
      });
      return;
    }

    const start = performance.now();
    const duration = 420;
    const from = happySadBlendRef.current;
    const delta = target - from;
    const easeInOut = (t: number) => 0.5 - Math.cos(Math.PI * t) * 0.5;

    const animate = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const nextBlend = from + delta * easeInOut(p);
      happySadBlendRef.current = nextBlend;
      setHappySadBlend(nextBlend);
      if (p < 1) {
        happySadAnimRef.current = requestAnimationFrame(animate);
      }
    };

    if (happySadAnimRef.current) {
      cancelAnimationFrame(happySadAnimRef.current);
    }
    happySadAnimRef.current = requestAnimationFrame(animate);

    return () => {
      if (happySadAnimRef.current) {
        cancelAnimationFrame(happySadAnimRef.current);
      }
    };
  }, [emotion]);

  // Smoothly transition between HAPPY and PISSED.
  useEffect(() => {
    const target = emotion === "PISSED" ? 1 : 0;
    if (emotion !== "HAPPY" && emotion !== "PISSED") {
      happyPissedBlendRef.current = 0;
      if (happyPissedAnimRef.current) {
        cancelAnimationFrame(happyPissedAnimRef.current);
      }
      happyPissedAnimRef.current = requestAnimationFrame(() => {
        setHappyPissedBlend(0);
      });
      return;
    }

    const start = performance.now();
    const duration = target > happyPissedBlendRef.current ? 500 : 560;
    const from = happyPissedBlendRef.current;
    const delta = target - from;
    const easeInOut = (t: number) => 0.5 - Math.cos(Math.PI * t) * 0.5;
    const easeOutBack = (t: number) => {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    };

    const animate = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = target > from ? easeOutBack(p) : easeInOut(p);
      const nextBlend = from + delta * eased;
      happyPissedBlendRef.current = nextBlend;
      setHappyPissedBlend(nextBlend);
      if (p < 1) {
        happyPissedAnimRef.current = requestAnimationFrame(animate);
      }
    };

    if (happyPissedAnimRef.current) {
      cancelAnimationFrame(happyPissedAnimRef.current);
    }
    happyPissedAnimRef.current = requestAnimationFrame(animate);

    return () => {
      if (happyPissedAnimRef.current) {
        cancelAnimationFrame(happyPissedAnimRef.current);
      }
    };
  }, [emotion]);

  // Delighted idle jaw: random open/close intervals with smooth easing.
  useEffect(() => {
    let isActive = true;
    const isDelighted = emotion === "DELIGHTED";

    const scheduleTarget = () => {
      if (!isActive) return;
      const delay = 420 + Math.random() * 1400;
      delightedJawTimerRef.current = setTimeout(() => {
        if (!isActive) return;
        // Wide-open to small-close range for lively delighted expression.
        delightedJawTargetRef.current = 0.22 + Math.random() * 0.88;
        scheduleTarget();
      }, delay);
    };

    if (isDelighted) {
      scheduleTarget();
    } else {
      delightedJawTargetRef.current = 0.55;
    }

    const animate = () => {
      if (!isActive) return;
      const smoothing = isDelighted ? 0.09 : 0.14;
      delightedJawRef.current +=
        (delightedJawTargetRef.current - delightedJawRef.current) * smoothing;
      setDelightedJaw(delightedJawRef.current);
      delightedJawAnimRef.current = requestAnimationFrame(animate);
    };

    delightedJawAnimRef.current = requestAnimationFrame(animate);

    return () => {
      isActive = false;
      if (delightedJawTimerRef.current) clearTimeout(delightedJawTimerRef.current);
      if (delightedJawAnimRef.current) cancelAnimationFrame(delightedJawAnimRef.current);
    };
  }, [emotion]);

  // Idle eyebrows: subtle random movement with smooth transitions.
  useEffect(() => {
    let isActive = true;

    const scheduleNextTarget = () => {
      const delay = 1400 + Math.random() * 2800;
      browTimerRef.current = setTimeout(() => {
        if (!isActive) return;
        const oneBrowLift = Math.random() < 0.3;
        const baseY = (Math.random() * 2 - 1) * 1.8;
        const asymY = oneBrowLift ? 2 + Math.random() * 2.2 : (Math.random() * 2 - 1) * 1.2;
        const baseR = (Math.random() * 2 - 1) * 1.7;
        const asymR = oneBrowLift ? 2 + Math.random() * 1.8 : (Math.random() * 2 - 1) * 1.3;

        browTargetRef.current = {
          leftY: baseY + asymY,
          rightY: baseY - asymY,
          leftRotate: baseR + asymR,
          rightRotate: baseR - asymR,
        };

        // Occasionally settle back to neutral for a calmer cadence.
        if (Math.random() < 0.22) {
          browTargetRef.current = {
            leftY: 0,
            rightY: 0,
            leftRotate: 0,
            rightRotate: 0,
          };
        }

        scheduleNextTarget();
      }, delay);
    };

    const animate = () => {
      if (!isActive) return;
      browRef.current.leftY += (browTargetRef.current.leftY - browRef.current.leftY) * 0.06;
      browRef.current.rightY += (browTargetRef.current.rightY - browRef.current.rightY) * 0.06;
      browRef.current.leftRotate +=
        (browTargetRef.current.leftRotate - browRef.current.leftRotate) * 0.06;
      browRef.current.rightRotate +=
        (browTargetRef.current.rightRotate - browRef.current.rightRotate) * 0.06;

      setBrowIdle({
        leftY: browRef.current.leftY,
        rightY: browRef.current.rightY,
        leftRotate: browRef.current.leftRotate,
        rightRotate: browRef.current.rightRotate,
      });

      browAnimRef.current = requestAnimationFrame(animate);
    };

    scheduleNextTarget();
    browAnimRef.current = requestAnimationFrame(animate);

    return () => {
      isActive = false;
      if (browTimerRef.current) clearTimeout(browTimerRef.current);
      if (browAnimRef.current) cancelAnimationFrame(browAnimRef.current);
    };
  }, []);

  // SVG dimensions
  const W = 520;
  const H = 600;
  const cx = W / 2;

  // Face positions
  const leftEyeCx = cx - 125;
  const rightEyeCx = cx + 125;
  const eyeCy = 248;
  const eyeR = 86;

  const easeInOutCubic = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const isHappyAngryFamily = emotion === "HAPPY" || emotion === "ANGRY";
  const isHappySadFamily = emotion === "HAPPY" || emotion === "SAD";
  const isHappyPissedFamily = emotion === "HAPPY" || emotion === "PISSED";
  const sadBlend = isHappySadFamily ? Math.min(1, Math.max(0, happySadBlend)) : 0;
  const sadEase = easeInOutCubic(sadBlend);
  const sadEyeCloseFactor = 1;
  const angryBlend = isHappyAngryFamily ? Math.min(1, Math.max(0, happyAngryBlend)) : 0;
  const angryEase = easeInOutCubic(angryBlend);
  const pissedBlend = isHappyPissedFamily ? Math.min(1, Math.max(0, happyPissedBlend)) : 0;
  const pissedEase = easeInOutCubic(pissedBlend);
  const angryPop = Math.sin(angryEase * Math.PI) * 0.08;
  const angrySmileOpacity = 1 - angryEase;
  const angryOpenOpacity = Math.min(1, Math.max(0, (angryEase - 0.08) / 0.92));
  const angryLive = emotion === "ANGRY" ? expressionPhase : 0;
  const angryMouthYOffset = angryLive * 2.2;
  const angryMouthTilt = angryLive * -1.4;
  const angryMouthScaleX = 1 - Math.abs(angryLive) * 0.015;
  const angryMouthScaleY = 1 + Math.max(0, angryLive) * 0.07;
  const angryTongueShiftX = angryLive * 3;
  const angryTongueShiftY = Math.max(0, angryLive) * 3;
  const angryOpenTranslateY = 14 + 15 * angryEase - 6 * angryPop + angryMouthYOffset;
  const angryOpenRotate = -2 - 3 * angryEase + 4 * angryPop + angryMouthTilt;
  const angryOpenScaleX = (0.98 + angryEase * 0.02) * angryMouthScaleX;
  const angryOpenScaleY = (0.42 + angryEase * 0.58 + angryPop * 0.06) * angryMouthScaleY;

  const happyCfg = configs.HAPPY;
  const angryCfg = configs.ANGRY;
  const pissedCfg = configs.PISSED;
  const faceCfg = isHappyAngryFamily && angryBlend > 0.001
    ? {
        ...cfg,
        leftBrow: {
          x: lerp(happyCfg.leftBrow.x, angryCfg.leftBrow.x, angryEase),
          y: lerp(happyCfg.leftBrow.y, angryCfg.leftBrow.y, angryEase),
          rotate: lerp(happyCfg.leftBrow.rotate, angryCfg.leftBrow.rotate, angryEase),
        },
        rightBrow: {
          x: lerp(happyCfg.rightBrow.x, angryCfg.rightBrow.x, angryEase),
          y: lerp(happyCfg.rightBrow.y, angryCfg.rightBrow.y, angryEase),
          rotate: lerp(happyCfg.rightBrow.rotate, angryCfg.rightBrow.rotate, angryEase),
        },
        leftPupil: {
          x: lerp(happyCfg.leftPupil.x, angryCfg.leftPupil.x, angryEase),
          y: lerp(happyCfg.leftPupil.y, angryCfg.leftPupil.y, angryEase),
        },
        rightPupil: {
          x: lerp(happyCfg.rightPupil.x, angryCfg.rightPupil.x, angryEase),
          y: lerp(happyCfg.rightPupil.y, angryCfg.rightPupil.y, angryEase),
        },
        leftEyeScale: lerp(happyCfg.leftEyeScale, angryCfg.leftEyeScale, angryEase),
        rightEyeScale: lerp(happyCfg.rightEyeScale, angryCfg.rightEyeScale, angryEase),
        mouthOpen: lerp(happyCfg.mouthOpen, angryCfg.mouthOpen, angryEase),
        mouthWidth: lerp(happyCfg.mouthWidth, angryCfg.mouthWidth, angryEase),
        mouthSmile: lerp(happyCfg.mouthSmile, angryCfg.mouthSmile, angryEase),
      }
    : isHappyPissedFamily && pissedBlend > 0.001
      ? {
          ...cfg,
          leftBrow: {
            x: lerp(happyCfg.leftBrow.x, pissedCfg.leftBrow.x, pissedEase),
            y: lerp(happyCfg.leftBrow.y, pissedCfg.leftBrow.y, pissedEase),
            rotate: lerp(happyCfg.leftBrow.rotate, pissedCfg.leftBrow.rotate, pissedEase),
          },
          rightBrow: {
            x: lerp(happyCfg.rightBrow.x, pissedCfg.rightBrow.x, pissedEase),
            y: lerp(happyCfg.rightBrow.y, pissedCfg.rightBrow.y, pissedEase),
            rotate: lerp(happyCfg.rightBrow.rotate, pissedCfg.rightBrow.rotate, pissedEase),
          },
          leftPupil: {
            x: lerp(happyCfg.leftPupil.x, pissedCfg.leftPupil.x, pissedEase),
            y: lerp(happyCfg.leftPupil.y, pissedCfg.leftPupil.y, pissedEase),
          },
          rightPupil: {
            x: lerp(happyCfg.rightPupil.x, pissedCfg.rightPupil.x, pissedEase),
            y: lerp(happyCfg.rightPupil.y, pissedCfg.rightPupil.y, pissedEase),
          },
          leftEyeScale: lerp(happyCfg.leftEyeScale, pissedCfg.leftEyeScale, pissedEase),
          rightEyeScale: lerp(happyCfg.rightEyeScale, pissedCfg.rightEyeScale, pissedEase),
          mouthOpen: lerp(happyCfg.mouthOpen, pissedCfg.mouthOpen, pissedEase),
          mouthWidth: lerp(happyCfg.mouthWidth, pissedCfg.mouthWidth, pissedEase),
          mouthSmile: lerp(happyCfg.mouthSmile, pissedCfg.mouthSmile, pissedEase),
        }
    : cfg;

  const leftBrowX = leftEyeCx + faceCfg.leftBrow.x;
  const leftBrowY = eyeCy - eyeR - 42 + faceCfg.leftBrow.y + bounce + browIdle.leftY;
  const rightBrowX = rightEyeCx + faceCfg.rightBrow.x;
  const rightBrowY = eyeCy - eyeR - 42 + faceCfg.rightBrow.y + bounce + browIdle.rightY;

  const talkOpen = isTalking ? (talkPhase * 0.5 + 0.5) * 0.7 : faceCfg.mouthOpen;
  const expressionFloat = expressionPhase * faceCfg.animation.expressionAmount;
  const eyeScaleY = Math.max(0.06, 1 - blinkAmount * 0.94);
  const showPupils = eyeScaleY > 0.22;
  const idleGazeX = isTalking ? 0 : gaze.x;
  const idleGazeY = isTalking ? 0 : gaze.y;
  const smileShift = faceCfg.mouthSmile * 20;

  const mouthCy = 410;
  const mouthW = 248 * faceCfg.mouthWidth;
  const mouthH = Math.max(86, 72 + talkOpen * 98);
  const mouthLip = 9;
  const mouthInnerW = mouthW - mouthLip * 2;
  const mouthInnerH = mouthH - mouthLip * 2;
  const pupilR = eyeR * 0.8;
  const pupilBaseX = 0;
  const isHappyFamily = emotion === "HAPPY" || emotion === "DELIGHTED";
  const mouthBlend = isHappyFamily ? happyDelightBlend : 0;
  const morphBlend = Math.min(1, Math.max(0, mouthBlend));
  const morphEase = easeInOutCubic(morphBlend);
  const morphPop = Math.sin(morphEase * Math.PI) * 0.12;
  const delightedOpenAmount = easeInOutCubic(
    Math.min(1, Math.max(0, (morphEase - 0.05) / 0.95)),
  );
  const smileGrowAmount = easeInOutCubic(
    Math.min(1, Math.max(0, (1 - morphEase - 0.1) / 0.9)),
  );
  const shouldRenderDelightedOpen = delightedOpenAmount > 0.01;
  const delightJawNorm = Math.min(1, Math.max(0, delightedJaw));
  const delightJawInfluence = emotion === "DELIGHTED" ? 1 : morphEase;
  const delightJawScaleX = 1 + (0.96 - delightJawNorm) * 0.12;
  const delightJawScaleY = 1 + (delightJawNorm - 0.45) * 0.34;
  const delightJawShiftY = (1 - delightJawNorm) * 5 - 1;
  const happyDelightSmileStartX = lerp(-98, -92, smileGrowAmount);
  const happyDelightSmileEndX = lerp(98, 92, smileGrowAmount);
  const happyDelightSmileCtrlLeftX = lerp(-70, -66, smileGrowAmount);
  const happyDelightSmileCtrlRightX = lerp(70, 66, smileGrowAmount);
  const happyDelightSmileCtrlY = lerp(
    56 + expressionFloat * 0.9,
    62 + expressionFloat * 1.2,
    smileGrowAmount,
  );
  const happyDelightSmileStroke = lerp(0, 16, smileGrowAmount);
  const shouldRenderHappyDelightSmile = happyDelightSmileStroke > 0.2;
  const delightedOpenScaleX = 0.94 + delightedOpenAmount * 0.06;
  const delightedOpenScaleY = 0.04 + delightedOpenAmount * 0.96;
  const delightedOpenTranslateY =
    8 + 24 * delightedOpenAmount - 6 * morphPop + delightJawShiftY * delightJawInfluence;
  const delightedOpenRotate = -1 - 6 * delightedOpenAmount + 3 * morphPop;
  const isSadExpression = emotion === "SAD";
  const mouthLift = isHappySadFamily
    ? lerp(-56, -36, sadEase)
    : isHappyPissedFamily && pissedBlend > 0.001
      ? lerp(-56, -28, pissedEase)
    : faceCfg.mouthMode === "smile" || faceCfg.mouthMode === "delighted" || isHappyAngryFamily
      ? -56
      : faceCfg.mouthMode === "pissed"
        ? -28
      : isSadExpression
        ? -36
        : 0;
  const happyPissedStartX = lerp(-92, -96, pissedEase);
  const happyPissedEndX = lerp(92, 96, pissedEase);
  const happyPissedEdgeY = lerp(0, 16, pissedEase);
  const happyPissedCtrlLeftX = lerp(-66, -64, pissedEase);
  const happyPissedCtrlRightX = lerp(66, 64, pissedEase);
  const happyPissedCtrlY = lerp(
    62 + expressionFloat * 1.2,
    -19 + expressionFloat * 0.6,
    pissedEase,
  );
  const happyPissedStroke = lerp(16, 20, pissedEase);
  const pissedTeethReveal = easeInOutCubic(Math.min(1, Math.max(0, (pissedEase - 0.15) / 0.85)));
  const shouldRenderPissedTeeth = pissedTeethReveal > 0.03;
  const pissedTeethScaleY = 0.2 + pissedTeethReveal * 0.8;
  const happySadStartX = lerp(-92, -112, sadEase);
  const happySadEndX = lerp(92, 112, sadEase);
  const happySadEdgeY = lerp(0, 42, sadEase);
  const happySadCtrlLeftX = lerp(-66, -62, sadEase);
  const happySadCtrlRightX = lerp(66, 62, sadEase);
  const happySadCtrlY = lerp(
    62 + expressionFloat * 1.2,
    -10 + expressionFloat * 0.35,
    sadEase,
  );
  const happySadStroke = lerp(16, 20, sadEase);

  const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value));
  const pupilLimitX = Math.max(0, eyeR - pupilR - 1);
  const pupilLimitY = Math.max(0, eyeR - pupilR - 1);

  const leftPupilX = clamp(
    pupilBaseX + faceCfg.leftPupil.x + idleGazeX,
    -pupilLimitX,
    pupilLimitX,
  );
  const rightPupilX = clamp(
    pupilBaseX + faceCfg.rightPupil.x + idleGazeX,
    -pupilLimitX,
    pupilLimitX,
  );
  const leftPupilY = clamp(faceCfg.leftPupil.y, -pupilLimitY, pupilLimitY);
  const rightPupilY = clamp(faceCfg.rightPupil.y, -pupilLimitY, pupilLimitY);
  const finalLeftPupilY = clamp(leftPupilY + idleGazeY, -pupilLimitY, pupilLimitY);
  const finalRightPupilY = clamp(rightPupilY + idleGazeY, -pupilLimitY, pupilLimitY);
  const sadMorphLeftPupilX = clamp(
    pupilBaseX + lerp(configs.HAPPY.leftPupil.x, configs.SAD.leftPupil.x, sadEase) + idleGazeX,
    -pupilLimitX,
    pupilLimitX,
  );
  const sadMorphRightPupilX = clamp(
    pupilBaseX + lerp(configs.HAPPY.rightPupil.x, configs.SAD.rightPupil.x, sadEase) + idleGazeX,
    -pupilLimitX,
    pupilLimitX,
  );
  const sadMorphLeftPupilY = clamp(
    lerp(configs.HAPPY.leftPupil.y, configs.SAD.leftPupil.y, sadEase) + idleGazeY,
    -pupilLimitY,
    pupilLimitY,
  );
  const sadMorphRightPupilY = clamp(
    lerp(configs.HAPPY.rightPupil.y, configs.SAD.rightPupil.y, sadEase) + idleGazeY,
    -pupilLimitY,
    pupilLimitY,
  );
  const sadLeftTopY = lerp(-120, 24, sadEase);
  const sadLeftTopRightY = lerp(-120, -62, sadEase);
  const sadRightTopLeftY = lerp(-120, -62, sadEase);
  const sadRightTopY = lerp(-120, 24, sadEase);

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ minHeight: 500 }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height="100%"
        style={{
          maxHeight: "96vh",
          maxWidth: "100%",
          filter: "drop-shadow(0 8px 32px rgba(0,0,0,0.18))",
        }}
      >
        {/* === LEFT EYE === */}
        {isHappySadFamily ? (
          <g transform={`translate(${leftEyeCx},${eyeCy}) scale(${configs.HAPPY.leftEyeScale})`}>
            <defs>
              <clipPath id="sad-left-eye-clip">
                <path
                  d={`
                    M -108 ${sadLeftTopY}
                    L 108 ${sadLeftTopRightY}
                    L 110 110
                    L -110 110
                    Z
                  `}
                />
              </clipPath>
            </defs>
            <g clipPath="url(#sad-left-eye-clip)" transform={`scale(1 ${eyeScaleY * sadEyeCloseFactor})`}>
              <circle cx={0} cy={0} r={eyeR} fill="#f3f3f3" />
              {showPupils && (
                <circle
                  cx={sadMorphLeftPupilX}
                  cy={sadMorphLeftPupilY}
                  r={lerp(pupilR, pupilR * 0.95, sadEase)}
                  fill="#050505"
                />
              )}
            </g>
          </g>
        ) : isSadExpression ? (
          <g transform={`translate(${leftEyeCx},${eyeCy}) scale(${faceCfg.leftEyeScale})`}>
            <defs>
              <clipPath id="sad-left-eye-clip">
                <path d="M -96 24 L 96 -62 L 100 -24 L 100 98 L -100 98 Z" />
              </clipPath>
            </defs>
            <g clipPath="url(#sad-left-eye-clip)" transform={`scale(1 ${eyeScaleY})`}>
              <circle cx={0} cy={0} r={eyeR} fill="#f3f3f3" />
              {showPupils && (
                <circle
                  cx={leftPupilX * 0.25}
                  cy={8 + finalLeftPupilY * 0.18}
                  r={pupilR * 0.95}
                  fill="#050505"
                />
              )}
            </g>
          </g>
        ) : (
          <g transform={`translate(${leftEyeCx},${eyeCy}) scale(${faceCfg.leftEyeScale})`}>
            <ellipse
              cx={0} cy={0}
              rx={eyeR} ry={eyeR * eyeScaleY}
              fill="#f3f3f3"
            />
            {showPupils && (
              <circle
                cx={leftPupilX}
                cy={finalLeftPupilY}
                r={pupilR}
                fill="#050505"
              />
            )}
          </g>
        )}

        {/* === RIGHT EYE === */}
        {isHappySadFamily ? (
          <g transform={`translate(${rightEyeCx},${eyeCy}) scale(${configs.HAPPY.rightEyeScale})`}>
            <defs>
              <clipPath id="sad-right-eye-clip">
                <path
                  d={`
                    M -110 ${sadRightTopLeftY}
                    L 108 ${sadRightTopY}
                    L 110 110
                    L -110 110
                    Z
                  `}
                />
              </clipPath>
            </defs>
            <g clipPath="url(#sad-right-eye-clip)" transform={`scale(1 ${eyeScaleY * sadEyeCloseFactor})`}>
              <circle cx={0} cy={0} r={eyeR} fill="#f3f3f3" />
              {showPupils && (
                <circle
                  cx={sadMorphRightPupilX}
                  cy={sadMorphRightPupilY}
                  r={lerp(pupilR, pupilR * 0.95, sadEase)}
                  fill="#050505"
                />
              )}
            </g>
          </g>
        ) : isSadExpression ? (
          <g transform={`translate(${rightEyeCx},${eyeCy}) scale(${faceCfg.rightEyeScale})`}>
            <defs>
              <clipPath id="sad-right-eye-clip">
                <path d="M -100 -24 L -48 -62 L 96 24 L 100 98 L -100 98 Z" />
              </clipPath>
            </defs>
            <g clipPath="url(#sad-right-eye-clip)" transform={`scale(1 ${eyeScaleY})`}>
              <circle cx={0} cy={0} r={eyeR} fill="#f3f3f3" />
              {showPupils && (
                <circle
                  cx={rightPupilX * 0.25}
                  cy={8 + finalRightPupilY * 0.18}
                  r={pupilR * 0.95}
                  fill="#050505"
                />
              )}
            </g>
          </g>
        ) : (
          <g transform={`translate(${rightEyeCx},${eyeCy}) scale(${faceCfg.rightEyeScale})`}>
            <ellipse
              cx={0} cy={0}
              rx={eyeR} ry={eyeR * eyeScaleY}
              fill="#f3f3f3"
            />
            {showPupils && (
              <circle
                cx={rightPupilX}
                cy={finalRightPupilY}
                r={pupilR}
                fill="#050505"
              />
            )}
          </g>
        )}

        {/* === LEFT EYEBROW === */}
        <rect
          x={leftBrowX - 60}
          y={leftBrowY - 22}
          width={120}
          height={44}
          rx={22}
          fill="#b98900"
          transform={`rotate(${faceCfg.leftBrow.rotate + browIdle.leftRotate}, ${leftBrowX}, ${leftBrowY})`}
        />

        {/* === RIGHT EYEBROW === */}
        <rect
          x={rightBrowX - 60}
          y={rightBrowY - 22}
          width={120}
          height={44}
          rx={22}
          fill="#b98900"
          transform={`rotate(${faceCfg.rightBrow.rotate + browIdle.rightRotate}, ${rightBrowX}, ${rightBrowY})`}
        />

        {isHappyPissedFamily && pissedBlend > 0.01 && (
          <g
            transform={`
              translate(${rightBrowX + 20}, ${rightBrowY - 36 + expressionFloat * 0.35})
              rotate(${expressionFloat * 0.6})
              scale(${0.35 + pissedEase * 0.65})
            `}
            fill="none"
            stroke="#d46891"
            strokeWidth={16}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {[45, 135, 225, 315].map((angle) => (
              <g key={`pissed-vein-${angle}`} transform={`rotate(${angle}) translate(0 -34)`}>
                <path d="M -16 0 Q 0 14 16 0" />
              </g>
            ))}
          </g>
        )}

        {/* === MOUTH === */}
        <g
          transform={`translate(${cx}, ${mouthCy + smileShift * 0.35 + expressionFloat * 0.8 + mouthLift})`}
        >
          {isHappyPissedFamily && pissedBlend > 0.001 ? (
            <>
              <defs>
                <clipPath id="pissed-mouth-clip">
                  <path
                    d={`
                      M -90 12
                      Q 0 -44, 90 12
                      L 90 58
                      L -90 58
                      Z
                    `}
                  />
                </clipPath>
              </defs>

              {shouldRenderPissedTeeth && (
                <g clipPath="url(#pissed-mouth-clip)">
                  {[-54, -18, 18, 54].map((x) => {
                    const baseYOffset = Math.abs(x) < 30 ? -10 : -6;
                    return (
                      <g key={`piss-teeth-${x}`} transform={`translate(${x}, ${baseYOffset}) scale(1 ${pissedTeethScaleY})`}>
                        <path
                          d={`
                            M -18 0
                            H 18
                            V 24
                            A 14.4 14.4 0 0 1 -18 24
                            Z
                          `}
                          fill="#f3f3f3"
                        />
                      </g>
                    );
                  })}
                </g>
              )}

              <path
                d={`
                  M ${happyPissedStartX} ${happyPissedEdgeY}
                  Q ${happyPissedCtrlLeftX} ${happyPissedCtrlY}, 0 ${happyPissedCtrlY}
                  Q ${happyPissedCtrlRightX} ${happyPissedCtrlY}, ${happyPissedEndX} ${happyPissedEdgeY}
                `}
                fill="none"
                stroke="#050608"
                strokeWidth={happyPissedStroke}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          ) : isHappySadFamily ? (
            <path
              d={`
                M ${happySadStartX} ${happySadEdgeY}
                Q ${happySadCtrlLeftX} ${happySadCtrlY}, 0 ${happySadCtrlY}
                Q ${happySadCtrlRightX} ${happySadCtrlY}, ${happySadEndX} ${happySadEdgeY}
              `}
              fill="none"
              stroke="#050608"
              strokeWidth={happySadStroke}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : faceCfg.mouthMode === "sad" ? (
            <path
              d={`
                M ${-112} ${42}
                Q 0 ${-10 + expressionFloat * 0.35}, ${112} ${42}
              `}
              fill="none"
              stroke="#050608"
              strokeWidth={20}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : isHappyAngryFamily ? (
            <>
              <path
                d={`
                  M ${-92} ${0}
                  Q ${-66} ${62 + expressionFloat * 1.2}, 0 ${62 + expressionFloat * 1.2}
                  Q ${66} ${62 + expressionFloat * 1.2}, ${92} ${0}
                `}
                fill="none"
                stroke="#050608"
                strokeWidth={16 - angryEase * 2}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={angrySmileOpacity}
              />

              <g
                opacity={angryOpenOpacity}
                transform={`
                  translate(0 ${angryOpenTranslateY})
                  rotate(${angryOpenRotate})
                  scale(${angryOpenScaleX} ${angryOpenScaleY})
                `}
              >
                <defs>
                  <clipPath id="happy-angry-mouth-clip">
                    <rect
                      x={-mouthInnerW / 2}
                      y={-mouthInnerH / 2}
                      width={mouthInnerW}
                      height={mouthInnerH}
                      rx={mouthInnerH * 0.5}
                    />
                  </clipPath>
                </defs>

                <rect
                  x={-mouthW / 2}
                  y={-mouthH / 2}
                  width={mouthW}
                  height={mouthH}
                  rx={mouthH * 0.5}
                  fill="#0a0b0f"
                />

                <rect
                  x={-mouthInnerW / 2}
                  y={-mouthInnerH / 2}
                  width={mouthInnerW}
                  height={mouthInnerH}
                  rx={mouthInnerH * 0.5}
                  fill="#101218"
                />

                <g clipPath="url(#happy-angry-mouth-clip)">
                  <ellipse
                    cx={-mouthInnerW * 0.2 + angryTongueShiftX}
                    cy={mouthInnerH * 0.31 + angryTongueShiftY}
                    rx={mouthInnerW * 0.36}
                    ry={mouthInnerH * 0.52}
                    fill="#f4a7ad"
                  />

                  {[-2.5, -1.5, -0.5, 0.5, 1.5, 2.5].map((i) => (
                    <circle
                      key={`ha-ut${i}`}
                      cx={i * (mouthInnerW * 0.15)}
                      cy={-mouthInnerH * 0.52}
                      r={mouthInnerH * 0.23}
                      fill="#f5f5f5"
                    />
                  ))}

                  {[-2.5, -1.5, -0.5, 0.5, 1.5, 2.5].map((i) => (
                    <circle
                      key={`ha-lt${i}`}
                      cx={i * (mouthInnerW * 0.15)}
                      cy={mouthInnerH * 0.56}
                      r={mouthInnerH * 0.23}
                      fill="#f5f5f5"
                    />
                  ))}
                </g>
              </g>
            </>
          ) : faceCfg.mouthMode === "smile" || faceCfg.mouthMode === "delighted" ? (
            <>
              {shouldRenderHappyDelightSmile && (
                <path
                  d={`
                    M ${happyDelightSmileStartX} 0
                    Q ${happyDelightSmileCtrlLeftX} ${happyDelightSmileCtrlY}, 0 ${happyDelightSmileCtrlY}
                    Q ${happyDelightSmileCtrlRightX} ${happyDelightSmileCtrlY}, ${happyDelightSmileEndX} 0
                  `}
                  fill="none"
                  stroke="#050608"
                  strokeWidth={happyDelightSmileStroke}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {shouldRenderDelightedOpen && (
                <g
                  transform={`
                    translate(0 ${delightedOpenTranslateY})
                    rotate(${delightedOpenRotate})
                    scale(
                      ${delightedOpenScaleX * (1 + (delightJawScaleX - 1) * delightJawInfluence)}
                      ${delightedOpenScaleY * (1 + (delightJawScaleY - 1) * delightJawInfluence)}
                    )
                  `}
                >
                  <defs>
                    <clipPath id="delighted-mouth-clip">
                      <path
                        d={`
                          M -102 -26
                          L 98 -12
                          A 106 84 0 0 1 -102 -26
                          Z
                        `}
                      />
                    </clipPath>
                  </defs>

                  <path
                    d={`
                      M -102 -26
                      L 98 -12
                      A 106 84 0 0 1 -102 -26
                      Z
                    `}
                    fill="#0a0b0f"
                    stroke="#050608"
                    strokeWidth={18}
                  />

                  <g clipPath="url(#delighted-mouth-clip)">
                    <ellipse
                      cx={-22}
                      cy={43}
                      rx={68}
                      ry={31}
                      fill="#f4a7ad"
                      transform="rotate(16 -22 43)"
                    />

                    <path
                      d={`
                        M -83 -20
                        L 85 -20
                        L 85 -2
                        A 12 12 0 0 1 61 -2
                        A 12 12 0 0 1 37 -2
                        A 12 12 0 0 1 13 -2
                        A 12 12 0 0 1 -11 -2
                        A 12 12 0 0 1 -35 -2
                        A 12 12 0 0 1 -59 -2
                        A 12 12 0 0 1 -83 -2
                        Z
                      `}
                      fill="#f3f3f3"
                      transform="rotate(4 0 -12) scale(1.05 1.05)"
                    />
                  </g>
                </g>
              )}
            </>
          ) : (
            <>
              <defs>
                <clipPath id="mouth-clip">
                  <rect
                    x={-mouthInnerW / 2}
                    y={-mouthInnerH / 2}
                    width={mouthInnerW}
                    height={mouthInnerH}
                    rx={mouthInnerH * 0.5}
                  />
                </clipPath>
              </defs>

              <rect
                x={-mouthW / 2}
                y={-mouthH / 2}
                width={mouthW}
                height={mouthH}
                rx={mouthH * 0.5}
                fill="#0a0b0f"
              />

              <rect
                x={-mouthInnerW / 2}
                y={-mouthInnerH / 2}
                width={mouthInnerW}
                height={mouthInnerH}
                rx={mouthInnerH * 0.5}
                fill="#101218"
              />

              <g clipPath="url(#mouth-clip)">
                <ellipse
                  cx={-mouthInnerW * 0.2}
                  cy={mouthInnerH * 0.31}
                  rx={mouthInnerW * 0.36}
                  ry={mouthInnerH * 0.52}
                  fill="#f4a7ad"
                />

                {[-2.5, -1.5, -0.5, 0.5, 1.5, 2.5].map((i) => (
                  <circle
                    key={`ut${i}`}
                    cx={i * (mouthInnerW * 0.15)}
                    cy={-mouthInnerH * 0.52}
                    r={mouthInnerH * 0.23}
                    fill="#f5f5f5"
                  />
                ))}

                {[-2.5, -1.5, -0.5, 0.5, 1.5, 2.5].map((i) => (
                  <circle
                    key={`lt${i}`}
                    cx={i * (mouthInnerW * 0.15)}
                    cy={mouthInnerH * 0.56}
                    r={mouthInnerH * 0.23}
                    fill="#f5f5f5"
                  />
                ))}
              </g>
            </>
          )}
        </g>
      </svg>
    </div>
  );
}
