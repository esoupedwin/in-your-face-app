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

export type MouthMode = "open" | "smile" | "delighted" | "sad" | "pissed";

export interface EmotionConfig {
  leftBrow: { x: number; y: number; rotate: number };
  rightBrow: { x: number; y: number; rotate: number };
  leftPupil: { x: number; y: number };
  rightPupil: { x: number; y: number };
  leftEyeScale: number;
  rightEyeScale: number;
  mouthOpen: number;
  mouthWidth: number;
  mouthSmile: number;
  color: string;
  mouthMode: MouthMode;
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

export const FACE_EMOTION_CONFIGS: Record<Emotion, EmotionConfig> = {
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
    leftBrow: { x: 3, y: 13, rotate: 14 },
    rightBrow: { x: -6, y: 12, rotate: -14 },
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
    leftBrow: { x: -4, y: -2, rotate: -30 },
    rightBrow: { x: 4, y: -2, rotate: 30 },
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

export const FACE_LAYOUT = {
  width: 520,
  height: 600,
  eyeOffsetX: 125,
  eyeCenterY: 248,
  eyeRadius: 86,
  mouthCenterY: 410,
  mouthLip: 9,
};

export const FACE_ANIMATION = {
  talking: {
    phaseStep: 0.18,
    bounceFrequency: 0.5,
    bounceAmplitude: 3,
  },
  blink: {
    durationBaseMs: 140,
    durationJitterMs: 120,
  },
  blend: {
    happyDelightedEnterMs: 420,
    happyDelightedExitMs: 560,
    happyAngryMs: 460,
    happySadMs: 420,
    happyPissedEnterMs: 500,
    happyPissedExitMs: 560,
  },
  shiver: {
    intervalBaseMs: 700,
    intervalJitterMs: 1700,
    durationBaseMs: 420,
    durationJitterMs: 260,
    amplitudeBase: 2.1,
    amplitudeJitter: 1.4,
    rotateAmplitudeBase: 0.8,
    rotateAmplitudeJitter: 0.6,
    cyclesBase: 3.2,
    cyclesJitter: 2.2,
    yScale: 0.38,
  },
  delightedJaw: {
    idleValue: 0.55,
    targetBase: 0.22,
    targetRange: 0.88,
    intervalBaseMs: 420,
    intervalJitterMs: 1400,
    activeSmoothing: 0.09,
    inactiveSmoothing: 0.14,
  },
  browIdle: {
    intervalBaseMs: 1400,
    intervalJitterMs: 2800,
    settleChance: 0.22,
    oneBrowLiftChance: 0.3,
    animateSmoothing: 0.06,
  },
};

export const PISSED_FEATURES = {
  vein: {
    angles: [45, 135, 225, 315],
    lobeOffset: 34,
    groupOffsetX: 20,
    groupOffsetY: -36,
    floatY: 0.35,
    rotateByExpression: 0.6,
    baseScale: 0.35,
    scaleRange: 0.65,
    pulseAmount: 0.14,
  },
  teeth: {
    xPositions: [-54, -18, 18, 54],
    innerYOffset: -10,
    outerYOffset: -6,
  },
};
