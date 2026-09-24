import QRCode from "qrcode";
import { QROptions } from "../types";

export interface ColorLuminance {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): ColorLuminance {
  let cleanHex = hex.replace("#", "").trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return { r: 15, g: 23, b: 42 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function getLuminance(rgb: ColorLuminance): number {
  const a = [rgb.r, rgb.g, rgb.b].map((v) => {
    const val = v / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

export function calculateContrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(hexToRgb(hex1));
  const l2 = getLuminance(hexToRgb(hex2));
  const bright = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return Number(((bright + 0.05) / (dark + 0.05)).toFixed(2));
}

export interface ScanReliabilityResult {
  score: number; // 0 to 100
  rating: "optimal" | "bon" | "moyen" | "critique";
  label: string;
  contrastRatio: number;
  eccNotice: string;
  tips: string[];
}

export function evaluateScanReliability(options: QROptions): ScanReliabilityResult {
  const primaryDark = options.color.dark;
  const secondaryDark = options.color.darkSecondary || primaryDark;
  const light = options.color.light;

  const ratio1 = calculateContrastRatio(primaryDark, light);
  const ratio2 = calculateContrastRatio(secondaryDark, light);
  const minRatio = Math.min(ratio1, ratio2);

  let score = 100;
  const tips: string[] = [];

  // Contrast penalty
  if (minRatio < 3.0) {
    score -= 45;
    tips.push("Contraste trop faible entre motif et fond : risque de non-détection par certains appareils.");
  } else if (minRatio < 4.5) {
    score -= 20;
    tips.push("Contraste moyen : fonctionne bien sous bonne lumière, mais préférez un fond plus clair.");
  }

  // Margin penalty
  if (options.margin < 1) {
    score -= 15;
    tips.push("Marge blanche absente : une bordure de 2 modules est recommandée pour isoler le QR code.");
  }

  // Center icon safety with ECC
  if (options.centerIcon && options.centerIcon.trim().length > 0) {
    if (options.errorCorrectionLevel === "L") {
      score -= 30;
      tips.push("Badge central actif avec correction L (7%) : augmentez en niveau Q ou H.");
    } else if (options.errorCorrectionLevel === "M") {
      score -= 10;
      tips.push("Conseil : le niveau de correction H (30%) est optimal avec un badge central.");
    }
  }

  score = Math.max(10, Math.min(100, score));

  let rating: "optimal" | "bon" | "moyen" | "critique" = "optimal";
  let label = "Lisibilité Optimale (100% testé)";

  if (score >= 90) {
    rating = "optimal";
    label = "Lisibilité Optimale (100% conforme ISO)";
  } else if (score >= 75) {
    rating = "bon";
    label = "Très Bonne Lisibilité";
  } else if (score >= 50) {
    rating = "moyen";
    label = "Lisibilité Modérée (Attention au contraste)";
  } else {
    rating = "critique";
    label = "Risque d'échec de scan";
  }

  const eccDescriptions: Record<string, string> = {
    L: "L (7% de redondance)",
    M: "M (15% de redondance standard)",
    Q: "Q (25% haute tolérance)",
    H: "H (30% tolérance maximale)",
  };

  return {
    score,
    rating,
    label,
    contrastRatio: minRatio,
    eccNotice: eccDescriptions[options.errorCorrectionLevel] || options.errorCorrectionLevel,
    tips,
  };
}

// Helpers for Finder Patterns
function isFinderPattern(r: number, c: number, size: number): boolean {
  // Top-left
  if (r < 7 && c < 7) return true;
  // Top-right
  if (r < 7 && c >= size - 7) return true;
  // Bottom-left
  if (r >= size - 7 && c < 7) return true;
  return false;
}

function getFinderLocation(r: number, c: number, size: number): "tl" | "tr" | "bl" | null {
  if (r < 7 && c < 7) return "tl";
  if (r < 7 && c >= size - 7) return "tr";
  if (r >= size - 7 && c < 7) return "bl";
  return null;
}

function isInCenterIconZone(r: number, c: number, size: number, radiusModules: number): boolean {
  const center = Math.floor(size / 2);
  return (
    r >= center - radiusModules &&
    r <= center + radiusModules &&
    c >= center - radiusModules &&
    c <= center + radiusModules
  );
}

/**
 * Main Canvas Render with Fancy Effects (Gradients, Custom Dot Shapes, Finder Eyes, Center Badge & Frames)
 */
export async function renderQRToCanvas(
  canvas: HTMLCanvasElement,
  text: string,
  options: QROptions,
  targetWidth?: number
): Promise<void> {
  if (!text.trim()) return;

  const ecc =
    options.centerIcon && options.centerIcon.trim().length > 0 && options.errorCorrectionLevel === "L"
      ? "Q"
      : options.errorCorrectionLevel;

  const qr = QRCode.create(text, { errorCorrectionLevel: ecc });
  const matrixSize = qr.modules.size;

  const baseSize = targetWidth || options.width || 320;
  const marginModules = Math.max(0, options.margin);

  const frameStyle = options.frameStyle || "none";
  let extraTop = 0;
  let extraBottom = 0;
  let extraHorizontal = 0;

  if (frameStyle === "banner-bottom") {
    extraBottom = Math.round(baseSize * 0.16);
  } else if (frameStyle === "polaroid") {
    extraBottom = Math.round(baseSize * 0.22);
    extraTop = Math.round(baseSize * 0.05);
    extraHorizontal = Math.round(baseSize * 0.05);
  } else if (frameStyle === "bubble") {
    extraTop = Math.round(baseSize * 0.1);
    extraBottom = Math.round(baseSize * 0.1);
  }

  const canvasWidth = baseSize + extraHorizontal * 2;
  const canvasHeight = baseSize + extraTop + extraBottom;

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Background
  ctx.fillStyle = options.color.light;
  if (frameStyle === "polaroid") {
    // Polaroid white card with subtle border
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.06)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, canvasWidth - 1, canvasHeight - 1);
  } else if (frameStyle === "bubble") {
    ctx.beginPath();
    ctx.roundRect(4, 4, canvasWidth - 8, canvasHeight - 8, 24);
    ctx.fill();
    ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  const qrDrawAreaSize = baseSize;
  const totalModules = matrixSize + marginModules * 2;
  const cellSize = qrDrawAreaSize / totalModules;

  const qrOffsetX = extraHorizontal + marginModules * cellSize;
  const qrOffsetY = extraTop + marginModules * cellSize;

  // Gradient or solid style for modules & eyes
  let fillPattern: string | CanvasGradient = options.color.dark;
  const gradType = options.gradientType || "none";
  const dark2 = options.color.darkSecondary || options.color.dark;

  if (gradType === "linear-diagonal") {
    const grad = ctx.createLinearGradient(
      qrOffsetX,
      qrOffsetY,
      qrOffsetX + matrixSize * cellSize,
      qrOffsetY + matrixSize * cellSize
    );
    grad.addColorStop(0, options.color.dark);
    grad.addColorStop(1, dark2);
    fillPattern = grad;
  } else if (gradType === "linear-horizontal") {
    const grad = ctx.createLinearGradient(
      qrOffsetX,
      qrOffsetY,
      qrOffsetX + matrixSize * cellSize,
      qrOffsetY
    );
    grad.addColorStop(0, options.color.dark);
    grad.addColorStop(1, dark2);
    fillPattern = grad;
  } else if (gradType === "radial") {
    const cx = qrOffsetX + (matrixSize * cellSize) / 2;
    const cy = qrOffsetY + (matrixSize * cellSize) / 2;
    const radius = (matrixSize * cellSize) * 0.72;
    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, radius);
    grad.addColorStop(0, dark2);
    grad.addColorStop(1, options.color.dark);
    fillPattern = grad;
  }

  ctx.fillStyle = fillPattern;

  const dotStyle = options.dotStyle || "square";
  const eyeStyle = options.eyeStyle || "square";
  const hasCenterBadge = Boolean(options.centerIcon && options.centerIcon.trim().length > 0);
  const centerRadiusModules = matrixSize > 30 ? 2 : 2; // 5x5 module exclusion zone

  // 1. Draw Data Modules (excluding finder patterns and center badge)
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (!qr.modules.get(r, c)) continue;
      if (isFinderPattern(r, c, matrixSize)) continue;
      if (hasCenterBadge && isInCenterIconZone(r, c, matrixSize, centerRadiusModules)) continue;

      const x = qrOffsetX + c * cellSize;
      const y = qrOffsetY + r * cellSize;

      if (dotStyle === "dots") {
        ctx.beginPath();
        ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize * 0.44, 0, Math.PI * 2);
        ctx.fill();
      } else if (dotStyle === "rounded") {
        ctx.beginPath();
        ctx.roundRect(x + 0.3, y + 0.3, cellSize - 0.6, cellSize - 0.6, cellSize * 0.35);
        ctx.fill();
      } else if (dotStyle === "diamond") {
        ctx.beginPath();
        ctx.moveTo(x + cellSize / 2, y + 0.5);
        ctx.lineTo(x + cellSize - 0.5, y + cellSize / 2);
        ctx.lineTo(x + cellSize / 2, y + cellSize - 0.5);
        ctx.lineTo(x + 0.5, y + cellSize / 2);
        ctx.closePath();
        ctx.fill();
      } else if (dotStyle === "stars") {
        const cx = x + cellSize / 2;
        const cy = y + cellSize / 2;
        const r1 = cellSize * 0.48;
        const r2 = cellSize * 0.2;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          ctx.lineTo(
            cx + Math.cos((i * Math.PI) / 2) * r1,
            cy + Math.sin((i * Math.PI) / 2) * r1
          );
          ctx.lineTo(
            cx + Math.cos((i * Math.PI) / 2 + Math.PI / 4) * r2,
            cy + Math.sin((i * Math.PI) / 2 + Math.PI / 4) * r2
          );
        }
        ctx.closePath();
        ctx.fill();
      } else {
        // Classic square
        ctx.fillRect(x, y, cellSize, cellSize);
      }
    }
  }

  // 2. Draw Finder Patterns (3 Position Eyes with chosen style)
  const finderPositions = [
    { r: 0, c: 0 },
    { r: 0, c: matrixSize - 7 },
    { r: matrixSize - 7, c: 0 },
  ];

  finderPositions.forEach((pos) => {
    const fx = qrOffsetX + pos.c * cellSize;
    const fy = qrOffsetY + pos.r * cellSize;
    const fSize = 7 * cellSize;

    if (eyeStyle === "circle") {
      // Circular finder eye
      const eyeCenterX = fx + fSize / 2;
      const eyeCenterY = fy + fSize / 2;

      // Outer ring
      ctx.beginPath();
      ctx.arc(eyeCenterX, eyeCenterY, 3.2 * cellSize, 0, Math.PI * 2);
      ctx.fillStyle = fillPattern;
      ctx.fill();

      // White inner ring
      ctx.beginPath();
      ctx.arc(eyeCenterX, eyeCenterY, 2.2 * cellSize, 0, Math.PI * 2);
      ctx.fillStyle = options.color.light;
      ctx.fill();

      // Center solid pupil
      ctx.beginPath();
      ctx.arc(eyeCenterX, eyeCenterY, 1.35 * cellSize, 0, Math.PI * 2);
      ctx.fillStyle = fillPattern;
      ctx.fill();
    } else if (eyeStyle === "rounded") {
      // Rounded finder eye
      const outerRadius = cellSize * 1.6;
      const innerRadius = cellSize * 1.0;

      // Outer 7x7
      ctx.beginPath();
      ctx.roundRect(fx, fy, fSize, fSize, outerRadius);
      ctx.fillStyle = fillPattern;
      ctx.fill();

      // Inner 5x5 white space
      ctx.beginPath();
      ctx.roundRect(fx + cellSize, fy + cellSize, 5 * cellSize, 5 * cellSize, outerRadius * 0.7);
      ctx.fillStyle = options.color.light;
      ctx.fill();

      // Inner 3x3 solid pupil
      ctx.beginPath();
      ctx.roundRect(fx + 2 * cellSize, fy + 2 * cellSize, 3 * cellSize, 3 * cellSize, innerRadius);
      ctx.fillStyle = fillPattern;
      ctx.fill();
    } else {
      // Standard ISO Square finder eye
      // Outer 7x7
      ctx.fillStyle = fillPattern;
      ctx.fillRect(fx, fy, fSize, fSize);

      // Inner 5x5 white space
      ctx.fillStyle = options.color.light;
      ctx.fillRect(fx + cellSize, fy + cellSize, 5 * cellSize, 5 * cellSize);

      // Inner 3x3 solid pupil
      ctx.fillStyle = fillPattern;
      ctx.fillRect(fx + 2 * cellSize, fy + 2 * cellSize, 3 * cellSize, 3 * cellSize);
    }
  });

  // 3. Draw Center Badge / Icon if specified
  if (hasCenterBadge && options.centerIcon) {
    const centerIndex = Math.floor(matrixSize / 2);
    const badgeCx = qrOffsetX + (centerIndex + 0.5) * cellSize;
    const badgeCy = qrOffsetY + (centerIndex + 0.5) * cellSize;
    const badgeRadius = (centerRadiusModules + 0.45) * cellSize;

    ctx.save();
    // Circular white protective badge
    ctx.beginPath();
    ctx.arc(badgeCx, badgeCy, badgeRadius, 0, Math.PI * 2);
    ctx.fillStyle = options.color.light;
    ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
    ctx.shadowBlur = 6;
    ctx.fill();

    // Subtle border
    ctx.shadowBlur = 0;
    ctx.lineWidth = Math.max(2, cellSize * 0.22);
    ctx.strokeStyle = options.color.dark;
    ctx.stroke();

    // Draw the icon or emoji
    const fontSize = Math.round(badgeRadius * 1.15);
    ctx.font = `bold ${fontSize}px sans-serif, "Apple Color Emoji", "Segoe UI Emoji"`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = options.color.dark;
    ctx.fillText(options.centerIcon, badgeCx, badgeCy + fontSize * 0.05);
    ctx.restore();
  }

  // 4. Draw Call-to-action Frames if configured
  if (frameStyle === "banner-bottom") {
    const bannerH = extraBottom;
    const bannerY = canvasHeight - bannerH;
    const bannerText = options.frameText?.trim() || "SCANNEZ-MOI";

    ctx.save();
    ctx.fillStyle = fillPattern;
    // Bottom banner bar
    ctx.beginPath();
    ctx.roundRect(
      extraHorizontal + 8,
      bannerY + 4,
      baseSize - 16,
      bannerH - 8,
      12
    );
    ctx.fill();

    // Banner Text
    ctx.fillStyle = options.color.light;
    const fontSize = Math.max(12, Math.round(bannerH * 0.35));
    ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(bannerText.toUpperCase(), canvasWidth / 2, bannerY + bannerH / 2);
    ctx.restore();
  } else if (frameStyle === "polaroid") {
    const bannerText = options.frameText?.trim() || "SCANNEZ POUR VISITER";
    ctx.save();
    ctx.fillStyle = "#1e293b";
    const fontSize = Math.max(12, Math.round(extraBottom * 0.25));
    ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(bannerText, canvasWidth / 2, canvasHeight - extraBottom * 0.5);
    ctx.restore();
  } else if (frameStyle === "bubble") {
    const bannerText = options.frameText?.trim() || "VISITEZ NOTRE LIEN";
    ctx.save();
    ctx.fillStyle = fillPattern;
    const fontSize = Math.max(11, Math.round(extraBottom * 0.3));
    ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(bannerText.toUpperCase(), canvasWidth / 2, canvasHeight - extraBottom * 0.5);
    ctx.restore();
  }
}

/**
 * Generate high-res PNG Data URL with fancy options
 */
export async function generateQRDataUrl(
  text: string,
  options: QROptions,
  customResolution?: number
): Promise<string> {
  const offscreenCanvas = document.createElement("canvas");
  const targetResolution = customResolution || 1024;
  await renderQRToCanvas(offscreenCanvas, text, options, targetResolution);
  return offscreenCanvas.toDataURL("image/png");
}

/**
 * Generate SVG Vector string with fancy gradients and custom shapes
 */
export async function generateQRSvgString(
  text: string,
  options: QROptions
): Promise<string> {
  const ecc =
    options.centerIcon && options.centerIcon.trim().length > 0 && options.errorCorrectionLevel === "L"
      ? "Q"
      : options.errorCorrectionLevel;

  const qr = QRCode.create(text, { errorCorrectionLevel: ecc });
  const matrixSize = qr.modules.size;
  const marginModules = Math.max(0, options.margin);
  const totalModules = matrixSize + marginModules * 2;

  const baseSvgSize = 600;
  const cellSize = baseSvgSize / totalModules;
  const qrOffsetX = marginModules * cellSize;
  const qrOffsetY = marginModules * cellSize;

  const gradType = options.gradientType || "none";
  const dark1 = options.color.dark;
  const dark2 = options.color.darkSecondary || dark1;

  let defs = "";
  let fillAttr = dark1;

  if (gradType === "linear-diagonal") {
    defs = `
      <defs>
        <linearGradient id="qr-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${dark1}" />
          <stop offset="100%" stop-color="${dark2}" />
        </linearGradient>
      </defs>`;
    fillAttr = "url(#qr-gradient)";
  } else if (gradType === "linear-horizontal") {
    defs = `
      <defs>
        <linearGradient id="qr-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${dark1}" />
          <stop offset="100%" stop-color="${dark2}" />
        </linearGradient>
      </defs>`;
    fillAttr = "url(#qr-gradient)";
  } else if (gradType === "radial") {
    defs = `
      <defs>
        <radialGradient id="qr-gradient" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stop-color="${dark2}" />
          <stop offset="100%" stop-color="${dark1}" />
        </radialGradient>
      </defs>`;
    fillAttr = "url(#qr-gradient)";
  }

  const dotStyle = options.dotStyle || "square";
  const eyeStyle = options.eyeStyle || "square";
  const hasCenterBadge = Boolean(options.centerIcon && options.centerIcon.trim().length > 0);
  const centerRadiusModules = 2;

  let modulesSvg = "";

  // Data modules
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (!qr.modules.get(r, c)) continue;
      if (isFinderPattern(r, c, matrixSize)) continue;
      if (hasCenterBadge && isInCenterIconZone(r, c, matrixSize, centerRadiusModules)) continue;

      const x = (qrOffsetX + c * cellSize).toFixed(2);
      const y = (qrOffsetY + r * cellSize).toFixed(2);
      const w = cellSize.toFixed(2);

      if (dotStyle === "dots") {
        const cx = (qrOffsetX + c * cellSize + cellSize / 2).toFixed(2);
        const cy = (qrOffsetY + r * cellSize + cellSize / 2).toFixed(2);
        const rad = (cellSize * 0.44).toFixed(2);
        modulesSvg += `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="${fillAttr}" />`;
      } else if (dotStyle === "rounded") {
        const rx = (cellSize * 0.35).toFixed(2);
        modulesSvg += `<rect x="${x}" y="${y}" width="${w}" height="${w}" rx="${rx}" fill="${fillAttr}" />`;
      } else if (dotStyle === "diamond") {
        const cx = qrOffsetX + c * cellSize + cellSize / 2;
        const cy = qrOffsetY + r * cellSize + cellSize / 2;
        const p1 = `${cx.toFixed(2)},${(cy - cellSize * 0.48).toFixed(2)}`;
        const p2 = `${(cx + cellSize * 0.48).toFixed(2)},${cy.toFixed(2)}`;
        const p3 = `${cx.toFixed(2)},${(cy + cellSize * 0.48).toFixed(2)}`;
        const p4 = `${(cx - cellSize * 0.48).toFixed(2)},${cy.toFixed(2)}`;
        modulesSvg += `<polygon points="${p1} ${p2} ${p3} ${p4}" fill="${fillAttr}" />`;
      } else {
        modulesSvg += `<rect x="${x}" y="${y}" width="${w}" height="${w}" fill="${fillAttr}" />`;
      }
    }
  }

  // Finder Patterns in SVG
  let findersSvg = "";
  const finderPositions = [
    { r: 0, c: 0 },
    { r: 0, c: matrixSize - 7 },
    { r: matrixSize - 7, c: 0 },
  ];

  finderPositions.forEach((pos) => {
    const fx = qrOffsetX + pos.c * cellSize;
    const fy = qrOffsetY + pos.r * cellSize;
    const fSize = 7 * cellSize;

    if (eyeStyle === "circle") {
      const cx = (fx + fSize / 2).toFixed(2);
      const cy = (fy + fSize / 2).toFixed(2);
      findersSvg += `
        <circle cx="${cx}" cy="${cy}" r="${(3.2 * cellSize).toFixed(2)}" fill="${fillAttr}" />
        <circle cx="${cx}" cy="${cy}" r="${(2.2 * cellSize).toFixed(2)}" fill="${options.color.light}" />
        <circle cx="${cx}" cy="${cy}" r="${(1.35 * cellSize).toFixed(2)}" fill="${fillAttr}" />
      `;
    } else if (eyeStyle === "rounded") {
      const outerRx = (cellSize * 1.6).toFixed(2);
      const innerCornerRx = (cellSize * 1.6 * 0.7).toFixed(2);
      const innerRx = (cellSize * 1.0).toFixed(2);
      findersSvg += `
        <rect x="${fx.toFixed(2)}" y="${fy.toFixed(2)}" width="${fSize.toFixed(2)}" height="${fSize.toFixed(2)}" rx="${outerRx}" fill="${fillAttr}" />
        <rect x="${(fx + cellSize).toFixed(2)}" y="${(fy + cellSize).toFixed(2)}" width="${(5 * cellSize).toFixed(2)}" height="${(5 * cellSize).toFixed(2)}" rx="${innerCornerRx}" fill="${options.color.light}" />
        <rect x="${(fx + 2 * cellSize).toFixed(2)}" y="${(fy + 2 * cellSize).toFixed(2)}" width="${(3 * cellSize).toFixed(2)}" height="${(3 * cellSize).toFixed(2)}" rx="${innerRx}" fill="${fillAttr}" />
      `;
    } else {
      findersSvg += `
        <rect x="${fx.toFixed(2)}" y="${fy.toFixed(2)}" width="${fSize.toFixed(2)}" height="${fSize.toFixed(2)}" fill="${fillAttr}" />
        <rect x="${(fx + cellSize).toFixed(2)}" y="${(fy + cellSize).toFixed(2)}" width="${(5 * cellSize).toFixed(2)}" height="${(5 * cellSize).toFixed(2)}" fill="${options.color.light}" />
        <rect x="${(fx + 2 * cellSize).toFixed(2)}" y="${(fy + 2 * cellSize).toFixed(2)}" width="${(3 * cellSize).toFixed(2)}" height="${(3 * cellSize).toFixed(2)}" fill="${fillAttr}" />
      `;
    }
  });

  // Center Badge in SVG
  let badgeSvg = "";
  if (hasCenterBadge && options.centerIcon) {
    const centerIndex = Math.floor(matrixSize / 2);
    const badgeCx = (qrOffsetX + (centerIndex + 0.5) * cellSize).toFixed(2);
    const badgeCy = (qrOffsetY + (centerIndex + 0.5) * cellSize).toFixed(2);
    const badgeRadius = ((centerRadiusModules + 0.45) * cellSize).toFixed(2);
    const fontSize = Math.round(Number(badgeRadius) * 1.15);

    badgeSvg = `
      <g>
        <circle cx="${badgeCx}" cy="${badgeCy}" r="${badgeRadius}" fill="${options.color.light}" stroke="${dark1}" stroke-width="${Math.max(2, cellSize * 0.22).toFixed(2)}" />
        <text x="${badgeCx}" y="${badgeCy}" font-family="sans-serif" font-weight="bold" font-size="${fontSize}" text-anchor="middle" dominant-baseline="central" fill="${dark1}">${options.centerIcon}</text>
      </g>
    `;
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${baseSvgSize} ${baseSvgSize}" width="${baseSvgSize}" height="${baseSvgSize}">
      ${defs}
      <rect width="100%" height="100%" fill="${options.color.light}" />
      ${modulesSvg}
      ${findersSvg}
      ${badgeSvg}
    </svg>
  `.trim();
}

export function downloadFile(content: Blob | string, filename: string, isText = false) {
  const element = document.createElement("a");
  if (isText && typeof content === "string") {
    const blob = new Blob([content], { type: "image/svg+xml;charset=utf-8" });
    element.href = URL.createObjectURL(blob);
  } else if (typeof content === "string") {
    element.href = content;
  } else {
    element.href = URL.createObjectURL(content);
  }
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}
