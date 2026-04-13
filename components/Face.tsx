"use client";
import { useEffect, useRef, useState } from "react";

export type Emotion =
  | "NEUTRAL"
  | "HAPPY"
  | "DELIGHTED"
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
    mouthMode: "open" | "smile" | "delighted";
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
  SAD: {
    leftBrow: { x: 0, y: 5, rotate: 10 },
    rightBrow: { x: 0, y: 5, rotate: -10 },
    leftPupil: { x: -5, y: 10 },
    rightPupil: { x: 5, y: 10 },
    leftEyeScale: 0.9,
    rightEyeScale: 0.9,
    mouthOpen: 0.2,
    mouthWidth: 0.85,
    mouthSmile: -1,
    color: "#FFA726",
    mouthMode: "open",
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
    leftBrow: { x: 10, y: 10, rotate: 20 },
    rightBrow: { x: -10, y: 10, rotate: -20 },
    leftPupil: { x: 8, y: 5 },
    rightPupil: { x: -8, y: 5 },
    leftEyeScale: 0.85,
    rightEyeScale: 0.85,
    mouthOpen: 0.1,
    mouthWidth: 0.9,
    mouthSmile: -0.8,
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
  const [expressionPhase, setExpressionPhase] = useState(0);
  const [happyDelightBlend, setHappyDelightBlend] = useState(
    emotion === "DELIGHTED" ? 1 : 0,
  );
  const happyDelightBlendRef = useRef(emotion === "DELIGHTED" ? 1 : 0);
  const animRef = useRef<number | null>(null);
  const talkRef = useRef<number | null>(null);
  const blinkRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blinkAnimRef = useRef<number | null>(null);
  const expressionAnimRef = useRef<number | null>(null);
  const happyDelightAnimRef = useRef<number | null>(null);
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
    const duration = 420;
    const from = happyDelightBlendRef.current;
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

  // SVG dimensions
  const W = 520;
  const H = 600;
  const cx = W / 2;

  // Face positions
  const leftEyeCx = cx - 125;
  const rightEyeCx = cx + 125;
  const eyeCy = 248;
  const eyeR = 86;

  const leftBrowX = leftEyeCx + cfg.leftBrow.x;
  const leftBrowY = eyeCy - eyeR - 42 + cfg.leftBrow.y + bounce;
  const rightBrowX = rightEyeCx + cfg.rightBrow.x;
  const rightBrowY = eyeCy - eyeR - 42 + cfg.rightBrow.y + bounce;

  const talkOpen = isTalking ? (talkPhase * 0.5 + 0.5) * 0.7 : cfg.mouthOpen;
  const expressionFloat = expressionPhase * cfg.animation.expressionAmount;
  const eyeScaleY = Math.max(0.06, 1 - blinkAmount * 0.94);
  const showPupils = eyeScaleY > 0.22;
  const idleGazeX = isTalking ? 0 : gaze.x;
  const idleGazeY = isTalking ? 0 : gaze.y;
  const smileShift = cfg.mouthSmile * 20;

  const mouthCy = 428;
  const mouthW = 248 * cfg.mouthWidth;
  const mouthH = Math.max(86, 72 + talkOpen * 98);
  const mouthLip = 9;
  const mouthInnerW = mouthW - mouthLip * 2;
  const mouthInnerH = mouthH - mouthLip * 2;
  const pupilR = eyeR * 0.8;
  const pupilBaseX = 0;
  const isHappyFamily = emotion === "HAPPY" || emotion === "DELIGHTED";
  const mouthBlend = isHappyFamily ? happyDelightBlend : 0;
  const morphBlend = Math.min(1, Math.max(0, mouthBlend));
  const easeInOutCubic = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const morphEase = easeInOutCubic(morphBlend);
  const morphPop = Math.sin(morphEase * Math.PI) * 0.12;
  const smileOpacity = Math.max(0, 1 - morphEase * 1.4);
  const delightedOpacity = Math.min(1, Math.max(0, (morphEase - 0.05) / 0.95));
  const smileLift = cfg.mouthMode === "smile" || cfg.mouthMode === "delighted" ? -56 : 0;

  const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value));
  const pupilLimitX = Math.max(0, eyeR - pupilR - 1);
  const pupilLimitY = Math.max(0, eyeR - pupilR - 1);

  const leftPupilX = clamp(
    pupilBaseX + cfg.leftPupil.x + idleGazeX,
    -pupilLimitX,
    pupilLimitX,
  );
  const rightPupilX = clamp(
    pupilBaseX + cfg.rightPupil.x + idleGazeX,
    -pupilLimitX,
    pupilLimitX,
  );
  const leftPupilY = clamp(cfg.leftPupil.y, -pupilLimitY, pupilLimitY);
  const rightPupilY = clamp(cfg.rightPupil.y, -pupilLimitY, pupilLimitY);
  const finalLeftPupilY = clamp(leftPupilY + idleGazeY, -pupilLimitY, pupilLimitY);
  const finalRightPupilY = clamp(rightPupilY + idleGazeY, -pupilLimitY, pupilLimitY);

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
        <g transform={`translate(${leftEyeCx},${eyeCy}) scale(${cfg.leftEyeScale})`}>
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

        {/* === RIGHT EYE === */}
        <g transform={`translate(${rightEyeCx},${eyeCy}) scale(${cfg.rightEyeScale})`}>
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

        {/* === LEFT EYEBROW === */}
        <rect
          x={leftBrowX - 60}
          y={leftBrowY - 22}
          width={120}
          height={44}
          rx={22}
          fill="#b98900"
          transform={`rotate(${cfg.leftBrow.rotate}, ${leftBrowX}, ${leftBrowY})`}
        />

        {/* === RIGHT EYEBROW === */}
        <rect
          x={rightBrowX - 60}
          y={rightBrowY - 22}
          width={120}
          height={44}
          rx={22}
          fill="#b98900"
          transform={`rotate(${cfg.rightBrow.rotate}, ${rightBrowX}, ${rightBrowY})`}
        />

        {/* === MOUTH === */}
        <g
          transform={`translate(${cx}, ${mouthCy + smileShift * 0.35 + expressionFloat * 0.8 + smileLift})`}
        >
          {cfg.mouthMode === "smile" || cfg.mouthMode === "delighted" ? (
            <>
              <path
                d={`
                  M ${-92} ${0}
                  Q ${-66} ${62 + expressionFloat * 1.2}, 0 ${62 + expressionFloat * 1.2}
                  Q ${66} ${62 + expressionFloat * 1.2}, ${92} ${0}
                `}
                fill="none"
                stroke="#050608"
                strokeWidth={16 - morphEase * 3}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={smileOpacity}
              />

              <g
                opacity={delightedOpacity}
                transform={`
                  translate(0 ${16 + 16 * morphEase - 6 * morphPop})
                  rotate(${-5 - 2 * morphEase + 4 * morphPop})
                  scale(${0.96 + morphEase * 0.04} ${0.34 + morphEase * 0.66 + morphPop * 0.08})
                `}
              >
                <defs>
                  <clipPath id="delighted-mouth-clip">
                    <path
                      d={`
                        M -102 -26
                        L 98 -12
                        Q 106 6, 98 24
                        Q 76 68, 8 74
                        Q -58 74, -88 30
                        Q -100 10, -102 -26
                        Z
                      `}
                    />
                  </clipPath>
                </defs>

                <path
                  d={`
                    M -102 -26
                    L 98 -12
                    Q 106 6, 98 24
                    Q 76 68, 8 74
                    Q -58 74, -88 30
                    Q -100 10, -102 -26
                    Z
                  `}
                  fill="#0a0b0f"
                  stroke="#050608"
                  strokeWidth={4}
                />

                <g clipPath="url(#delighted-mouth-clip)">
                  <ellipse
                    cx={-22}
                    cy={43}
                    rx={68}
                    ry={31}
                    fill="#ef7938"
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
                  />
                </g>
              </g>
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
