"use client";
import { useEffect, useRef, useState } from "react";
import {
  FACE_ANIMATION,
  FACE_EMOTION_CONFIGS,
  FACE_LAYOUT,
  PISSED_FEATURES,
  type Emotion,
} from "./face.config";
export type { Emotion } from "./face.config";

interface FaceProps {
  emotion: Emotion;
  isTalking: boolean;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export default function Face({ emotion, isTalking }: FaceProps) {
  const cfg = FACE_EMOTION_CONFIGS[emotion];
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
  const [pissedShiver, setPissedShiver] = useState({ x: 0, y: 0, rotate: 0 });
  const [happyDelightBlend, setHappyDelightBlend] = useState(
    emotion === "DELIGHTED" ? 1 : 0,
  );
  const [happyAngryBlend, setHappyAngryBlend] = useState(emotion === "ANGRY" ? 1 : 0);
  const [happySadBlend, setHappySadBlend] = useState(emotion === "SAD" ? 1 : 0);
  const [happyPissedBlend, setHappyPissedBlend] = useState(emotion === "PISSED" ? 1 : 0);
  const [delightedJaw, setDelightedJaw] = useState(FACE_ANIMATION.delightedJaw.idleValue);
  const happyDelightBlendRef = useRef(emotion === "DELIGHTED" ? 1 : 0);
  const happyAngryBlendRef = useRef(emotion === "ANGRY" ? 1 : 0);
  const happySadBlendRef = useRef(emotion === "SAD" ? 1 : 0);
  const happyPissedBlendRef = useRef(emotion === "PISSED" ? 1 : 0);
  const delightedJawRef = useRef(FACE_ANIMATION.delightedJaw.idleValue);
  const delightedJawTargetRef = useRef(FACE_ANIMATION.delightedJaw.idleValue);
  const animRef = useRef<number | null>(null);
  const talkRef = useRef<number | null>(null);
  const blinkRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blinkAnimRef = useRef<number | null>(null);
  const expressionAnimRef = useRef<number | null>(null);
  const pissedShiverAnimRef = useRef<number | null>(null);
  const pissedShiverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
        t += FACE_ANIMATION.talking.phaseStep;
        setTalkPhase(Math.sin(t));
        setBounce(
          Math.sin(t * FACE_ANIMATION.talking.bounceFrequency) *
            FACE_ANIMATION.talking.bounceAmplitude,
        );
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
      const duration =
        FACE_ANIMATION.blink.durationBaseMs +
        Math.random() * FACE_ANIMATION.blink.durationJitterMs;
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
    const duration =
      target > from
        ? FACE_ANIMATION.blend.happyDelightedEnterMs
        : FACE_ANIMATION.blend.happyDelightedExitMs;
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

  // Intermittent anger shiver when pissed.
  useEffect(() => {
    let isActive = true;

    const stopShiver = () => {
      if (pissedShiverTimerRef.current) clearTimeout(pissedShiverTimerRef.current);
      if (pissedShiverAnimRef.current) cancelAnimationFrame(pissedShiverAnimRef.current);
      pissedShiverAnimRef.current = requestAnimationFrame(() => {
        setPissedShiver({ x: 0, y: 0, rotate: 0 });
      });
    };

    if (emotion !== "PISSED") {
      stopShiver();
      return () => {
        if (pissedShiverTimerRef.current) clearTimeout(pissedShiverTimerRef.current);
        if (pissedShiverAnimRef.current) cancelAnimationFrame(pissedShiverAnimRef.current);
      };
    }

    const scheduleNext = () => {
      const delay =
        FACE_ANIMATION.shiver.intervalBaseMs +
        Math.random() * FACE_ANIMATION.shiver.intervalJitterMs;
      pissedShiverTimerRef.current = setTimeout(() => {
        if (!isActive) return;
        runShiverBurst();
      }, delay);
    };

    const runShiverBurst = () => {
      const start = performance.now();
      const duration =
        FACE_ANIMATION.shiver.durationBaseMs +
        Math.random() * FACE_ANIMATION.shiver.durationJitterMs;
      const amplitude =
        FACE_ANIMATION.shiver.amplitudeBase +
        Math.random() * FACE_ANIMATION.shiver.amplitudeJitter;
      const rotationAmplitude =
        FACE_ANIMATION.shiver.rotateAmplitudeBase +
        Math.random() * FACE_ANIMATION.shiver.rotateAmplitudeJitter;
      const cycles =
        FACE_ANIMATION.shiver.cyclesBase + Math.random() * FACE_ANIMATION.shiver.cyclesJitter;
      const phaseOffset = Math.random() * Math.PI * 2;

      const animate = (now: number) => {
        if (!isActive) return;
        const p = Math.min((now - start) / duration, 1);
        const envelope = Math.pow(Math.sin(Math.PI * p), 1.08);
        // Smoother S-curve to drag acceleration/deceleration (slow -> fast -> slow).
        const speedCurve = p * p * p * (p * (6 * p - 15) + 10);
        const wave = speedCurve * cycles * Math.PI * 2 + phaseOffset;
        const rapid = Math.sin(wave);
        const rapidAlt = Math.cos(wave * 0.92 + 0.6);

        setPissedShiver({
          x: rapid * amplitude * envelope,
          y: rapidAlt * amplitude * FACE_ANIMATION.shiver.yScale * envelope,
          rotate: rapid * rotationAmplitude * envelope,
        });

        if (p < 1) {
          pissedShiverAnimRef.current = requestAnimationFrame(animate);
          return;
        }

        setPissedShiver({ x: 0, y: 0, rotate: 0 });
        scheduleNext();
      };

      pissedShiverAnimRef.current = requestAnimationFrame(animate);
    };

    scheduleNext();

    return () => {
      isActive = false;
      if (pissedShiverTimerRef.current) clearTimeout(pissedShiverTimerRef.current);
      if (pissedShiverAnimRef.current) cancelAnimationFrame(pissedShiverAnimRef.current);
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
    const duration = FACE_ANIMATION.blend.happyAngryMs;
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
    const duration = FACE_ANIMATION.blend.happySadMs;
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
    const duration =
      target > happyPissedBlendRef.current
        ? FACE_ANIMATION.blend.happyPissedEnterMs
        : FACE_ANIMATION.blend.happyPissedExitMs;
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
      const delay =
        FACE_ANIMATION.delightedJaw.intervalBaseMs +
        Math.random() * FACE_ANIMATION.delightedJaw.intervalJitterMs;
      delightedJawTimerRef.current = setTimeout(() => {
        if (!isActive) return;
        // Wide-open to small-close range for lively delighted expression.
        delightedJawTargetRef.current =
          FACE_ANIMATION.delightedJaw.targetBase +
          Math.random() * FACE_ANIMATION.delightedJaw.targetRange;
        scheduleTarget();
      }, delay);
    };

    if (isDelighted) {
      scheduleTarget();
    } else {
      delightedJawTargetRef.current = FACE_ANIMATION.delightedJaw.idleValue;
    }

    const animate = () => {
      if (!isActive) return;
      const smoothing = isDelighted
        ? FACE_ANIMATION.delightedJaw.activeSmoothing
        : FACE_ANIMATION.delightedJaw.inactiveSmoothing;
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
      const delay =
        FACE_ANIMATION.browIdle.intervalBaseMs +
        Math.random() * FACE_ANIMATION.browIdle.intervalJitterMs;
      browTimerRef.current = setTimeout(() => {
        if (!isActive) return;
        const oneBrowLift = Math.random() < FACE_ANIMATION.browIdle.oneBrowLiftChance;
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
        if (Math.random() < FACE_ANIMATION.browIdle.settleChance) {
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
      browRef.current.leftY +=
        (browTargetRef.current.leftY - browRef.current.leftY) *
        FACE_ANIMATION.browIdle.animateSmoothing;
      browRef.current.rightY +=
        (browTargetRef.current.rightY - browRef.current.rightY) *
        FACE_ANIMATION.browIdle.animateSmoothing;
      browRef.current.leftRotate +=
        (browTargetRef.current.leftRotate - browRef.current.leftRotate) *
        FACE_ANIMATION.browIdle.animateSmoothing;
      browRef.current.rightRotate +=
        (browTargetRef.current.rightRotate - browRef.current.rightRotate) *
        FACE_ANIMATION.browIdle.animateSmoothing;

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
  const W = FACE_LAYOUT.width;
  const H = FACE_LAYOUT.height;
  const cx = W / 2;

  // Face positions
  const leftEyeCx = cx - FACE_LAYOUT.eyeOffsetX;
  const rightEyeCx = cx + FACE_LAYOUT.eyeOffsetX;
  const eyeCy = FACE_LAYOUT.eyeCenterY;
  const eyeR = FACE_LAYOUT.eyeRadius;

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

  const happyCfg = FACE_EMOTION_CONFIGS.HAPPY;
  const angryCfg = FACE_EMOTION_CONFIGS.ANGRY;
  const pissedCfg = FACE_EMOTION_CONFIGS.PISSED;
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

  const mouthCy = FACE_LAYOUT.mouthCenterY;
  const mouthW = 248 * faceCfg.mouthWidth;
  const mouthH = Math.max(86, 72 + talkOpen * 98);
  const mouthLip = FACE_LAYOUT.mouthLip;
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
  const pissedVeinPulse =
    1 + expressionPhase * PISSED_FEATURES.vein.pulseAmount * pissedEase;
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
    pupilBaseX +
      lerp(FACE_EMOTION_CONFIGS.HAPPY.leftPupil.x, FACE_EMOTION_CONFIGS.SAD.leftPupil.x, sadEase) +
      idleGazeX,
    -pupilLimitX,
    pupilLimitX,
  );
  const sadMorphRightPupilX = clamp(
    pupilBaseX +
      lerp(FACE_EMOTION_CONFIGS.HAPPY.rightPupil.x, FACE_EMOTION_CONFIGS.SAD.rightPupil.x, sadEase) +
      idleGazeX,
    -pupilLimitX,
    pupilLimitX,
  );
  const sadMorphLeftPupilY = clamp(
    lerp(FACE_EMOTION_CONFIGS.HAPPY.leftPupil.y, FACE_EMOTION_CONFIGS.SAD.leftPupil.y, sadEase) +
      idleGazeY,
    -pupilLimitY,
    pupilLimitY,
  );
  const sadMorphRightPupilY = clamp(
    lerp(FACE_EMOTION_CONFIGS.HAPPY.rightPupil.y, FACE_EMOTION_CONFIGS.SAD.rightPupil.y, sadEase) +
      idleGazeY,
    -pupilLimitY,
    pupilLimitY,
  );
  const sadLeftTopY = lerp(-120, 24, sadEase);
  const sadLeftTopRightY = lerp(-120, -62, sadEase);
  const sadRightTopLeftY = lerp(-120, -62, sadEase);
  const sadRightTopY = lerp(-120, 24, sadEase);

  return (
    <div
      className="w-full h-full flex items-start md:items-center justify-center pt-12 md:pt-0"
      style={{ minHeight: "clamp(320px, 42vh, 500px)" }}
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
        <g
          transform={`translate(${pissedShiver.x} ${pissedShiver.y}) rotate(${pissedShiver.rotate} ${cx} ${H / 2})`}
        >
        {/* === LEFT EYE === */}
        {isHappySadFamily ? (
          <g
            transform={`translate(${leftEyeCx},${eyeCy}) scale(${FACE_EMOTION_CONFIGS.HAPPY.leftEyeScale})`}
          >
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
          <g
            transform={`translate(${rightEyeCx},${eyeCy}) scale(${FACE_EMOTION_CONFIGS.HAPPY.rightEyeScale})`}
          >
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
              translate(
                ${rightBrowX + PISSED_FEATURES.vein.groupOffsetX},
                ${rightBrowY + PISSED_FEATURES.vein.groupOffsetY + expressionFloat * PISSED_FEATURES.vein.floatY}
              )
              rotate(${expressionFloat * PISSED_FEATURES.vein.rotateByExpression})
              scale(${(PISSED_FEATURES.vein.baseScale + pissedEase * PISSED_FEATURES.vein.scaleRange) * pissedVeinPulse})
            `}
            fill="none"
            stroke="#d46891"
            strokeWidth={16}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {PISSED_FEATURES.vein.angles.map((angle) => (
              <g
                key={`pissed-vein-${angle}`}
                transform={`rotate(${angle}) translate(0 -${PISSED_FEATURES.vein.lobeOffset})`}
              >
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
                  {PISSED_FEATURES.teeth.xPositions.map((x) => {
                    const baseYOffset =
                      Math.abs(x) < 30
                        ? PISSED_FEATURES.teeth.innerYOffset
                        : PISSED_FEATURES.teeth.outerYOffset;
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
        </g>
      </svg>
    </div>
  );
}
