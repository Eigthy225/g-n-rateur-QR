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
  margin: number;
  width: number;
}
