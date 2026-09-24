export interface ShortLink {
  id: string;
  originalUrl: string;
  shortCode: string;
  shortUrl: string;
  title?: string;
  clicks: number;
  createdAt: string;
  lastClickedAt?: string;
}

export type QRDotStyle = "square" | "dots" | "rounded" | "diamond" | "stars";
export type QREyeStyle = "square" | "rounded" | "circle";
export type QRGradientType = "none" | "linear-diagonal" | "linear-horizontal" | "radial";
export type QRFrameStyle = "none" | "banner-bottom" | "polaroid" | "bubble";

export interface QRBackgroundImage {
  src: string;
  name?: string;
  opacity: number; // 0.05 to 1.0 (recommended: 0.20 to 0.45)
  blur?: number; // 0 to 10 px
  contrastVeil?: "none" | "light" | "dark";
  veilOpacity?: number; // 0.0 to 0.9
  isolateEyes?: boolean; // Protect 3 finder patterns with clean background halo (ensures 100% scan rate)
  fit?: "cover" | "contain";
}

export interface QROptions {
  errorCorrectionLevel: "L" | "M" | "Q" | "H";
  color: {
    dark: string;
    light: string;
    darkSecondary?: string;
  };
  gradientType?: QRGradientType;
  dotStyle?: QRDotStyle;
  eyeStyle?: QREyeStyle;
  centerIcon?: string;
  centerIconType?: "emoji" | "text" | "none";
  frameStyle?: QRFrameStyle;
  frameText?: string;
  backgroundImage?: QRBackgroundImage;
  margin: number;
  width: number;
}
