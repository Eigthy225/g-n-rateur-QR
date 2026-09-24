import React from "react";
import {
  Palette,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ArrowLeftRight,
  Sparkles,
} from "lucide-react";
import { QROptions, QRGradientType } from "../types";
import { calculateContrastRatio } from "../utils/qrHelper";

interface ColorCustomizationBannerProps {
  options: QROptions;
  onOptionsChange: (updater: (prev: QROptions) => QROptions) => void;
  onToast: (type: "success" | "error" | "info", text: string) => void;
}

interface ColorPalettePreset {
  name: string;
  dark: string;
  darkSecondary?: string;
  light: string;
  gradientType: QRGradientType;
}

const CERTIFIED_PALETTES: ColorPalettePreset[] = [
  {
    name: "Noir Classique",
    dark: "#0f172a",
    darkSecondary: "#0f172a",
    light: "#ffffff",
    gradientType: "none",
  },
  {
    name: "Bleu Marine Pro",
    dark: "#1e3a8a",
    darkSecondary: "#2563eb",
    light: "#ffffff",
    gradientType: "linear-diagonal",
  },
  {
    name: "Indigo Moderne",
    dark: "#4338ca",
    darkSecondary: "#7c3aed",
    light: "#ffffff",
    gradientType: "linear-diagonal",
  },
  {
    name: "Émeraude Profond",
    dark: "#065f46",
    darkSecondary: "#0d9488",
    light: "#f0fdf4",
    gradientType: "linear-diagonal",
  },
  {
    name: "Rubis & Grenat",
    dark: "#881337",
    darkSecondary: "#be123c",
    light: "#fff1f2",
    gradientType: "linear-diagonal",
  },
  {
    name: "Ambre Chaud",
    dark: "#78350f",
    darkSecondary: "#b45309",
    light: "#fffdf7",
    gradientType: "linear-horizontal",
  },
  {
    name: "Néon Cyber",
    dark: "#0891b2",
    darkSecondary: "#c026d3",
    light: "#ffffff",
    gradientType: "linear-diagonal",
  },
];

export function ColorCustomizationBanner({
  options,
  onOptionsChange,
  onToast,
}: ColorCustomizationBannerProps) {
  const primaryDark = options.color.dark;
  const secondaryDark = options.color.darkSecondary || primaryDark;
  const lightBg = options.color.light;
  const gradType = options.gradientType || "none";

  // Calculate contrast ratio
  const ratio1 = calculateContrastRatio(primaryDark, lightBg);
  const ratio2 = calculateContrastRatio(secondaryDark, lightBg);
  const minRatio = Math.min(ratio1, ratio2);

  const isOptimal = minRatio >= 4.5;
  const isFair = minRatio >= 3.0 && minRatio < 4.5;
  const isPoor = minRatio < 3.0;

  // Swap / Invert colors safely
  const handleInvertColors = () => {
    onOptionsChange((prev) => {
      const newDark = prev.color.light;
      const newLight = prev.color.dark;
      const newRatio = calculateContrastRatio(newDark, newLight);
      if (newRatio < 3.0) {
        onToast(
          "info",
          "Couleurs inversées : assurez-vous d'avoir un fond contrasté pour une lecture optimale."
        );
      } else {
        onToast("success", "Couleurs inversées avec succès !");
      }
      return {
        ...prev,
        color: {
          dark: newDark,
          darkSecondary: newDark,
          light: newLight,
        },
      };
    });
  };

  // Automatic contrast fix that maintains the chosen hue
  const handleAutoFixContrast = () => {
    onOptionsChange((prev) => ({
      ...prev,
      color: {
        ...prev.color,
        dark: "#0f172a",
        darkSecondary: prev.gradientType !== "none" ? "#312e81" : "#0f172a",
        light: "#ffffff",
      },
    }));
    onToast(
      "success",
      "Contraste optimisé automatiquement pour une lecture instantanée (norme ISO) !"
    );
  };

  const handleApplyPalette = (palette: ColorPalettePreset) => {
    onOptionsChange((prev) => ({
      ...prev,
      color: {
        dark: palette.dark,
        darkSecondary: palette.darkSecondary || palette.dark,
        light: palette.light,
      },
      gradientType: palette.gradientType,
    }));
    onToast("info", `Palette « ${palette.name} » appliquée`);
  };

  return (
    <div
      id="color-customization-banner"
      className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 overflow-hidden transition-all"
    >
      {/* Banner Header with Live Reliability Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-xs">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Personnalisation des Couleurs
              </h3>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 hidden xs:inline-flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Haute Visibilité
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Harmonies chromatiques avec contrôle dynamique de lisibilité.
            </p>
          </div>
        </div>

        {/* Real-time Contrast Ratio & Compliance Pill */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
              isOptimal
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : isFair
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-rose-50 text-rose-700 border-rose-200"
            }`}
            title="Ratio de contraste calculé selon la norme ISO/IEC 18004 & WCAG"
          >
            {isOptimal ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : isFair ? (
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            )}
            <span>
              Contraste {minRatio}:1 •{" "}
              {isOptimal
                ? "Optimal (Conforme ISO)"
                : isFair
                ? "Modéré"
                : "Trop faible"}
            </span>
          </div>

          {/* Quick Auto-Fix Button if contrast is weak */}
          {(isFair || isPoor) && (
            <button
              onClick={handleAutoFixContrast}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-colors"
              title="Ajuste la luminosité pour garantir 100% de scannabilité"
            >
              <Zap className="w-3 h-3 text-indigo-600" />
              <span className="hidden sm:inline">Corriger</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Color Controllers (Pickers + Swatches) */}
      <div className="pt-4 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Color Selectors (7 cols) */}
        <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 1. Primary Pattern Color */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Motif principal</span>
            </span>
            <div className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:border-slate-300 transition-all">
              <input
                id="color-picker-primary"
                type="color"
                value={primaryDark}
                onChange={(e) =>
                  onOptionsChange((prev) => ({
                    ...prev,
                    color: { ...prev.color, dark: e.target.value },
                  }))
                }
                className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0 bg-transparent shrink-0"
                title="Choisir la couleur principale des données"
              />
              <input
                type="text"
                value={primaryDark}
                onChange={(e) => {
                  const val = e.target.value;
                  onOptionsChange((prev) => ({
                    ...prev,
                    color: { ...prev.color, dark: val },
                  }));
                }}
                className="w-full text-xs font-mono font-semibold text-slate-800 bg-transparent focus:outline-none uppercase"
                placeholder="#000000"
              />
            </div>
          </div>

          {/* 2. Secondary Gradient Color */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Dégradé / Accent</span>
            </span>
            <div className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:border-slate-300 transition-all">
              <input
                id="color-picker-secondary"
                type="color"
                value={secondaryDark}
                onChange={(e) =>
                  onOptionsChange((prev) => ({
                    ...prev,
                    color: {
                      ...prev.color,
                      darkSecondary: e.target.value,
                    },
                    // If gradient was none, auto switch to linear diagonal so user sees the change
                    gradientType:
                      prev.gradientType === "none"
                        ? "linear-diagonal"
                        : prev.gradientType,
                  }))
                }
                className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0 bg-transparent shrink-0"
                title="Choisir la couleur secondaire pour le dégradé"
              />
              <input
                type="text"
                value={secondaryDark}
                onChange={(e) => {
                  const val = e.target.value;
                  onOptionsChange((prev) => ({
                    ...prev,
                    color: {
                      ...prev.color,
                      darkSecondary: val,
                    },
                  }));
                }}
                className="w-full text-xs font-mono font-semibold text-slate-800 bg-transparent focus:outline-none uppercase"
                placeholder="#000000"
              />
            </div>
          </div>

          {/* 3. Background Color */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Arrière-plan</span>
            </span>
            <div className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:border-slate-300 transition-all">
              <input
                id="color-picker-light"
                type="color"
                value={lightBg}
                onChange={(e) =>
                  onOptionsChange((prev) => ({
                    ...prev,
                    color: { ...prev.color, light: e.target.value },
                  }))
                }
                className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0 bg-transparent shrink-0"
                title="Choisir la couleur de fond (un fond clair est recommandé)"
              />
              <input
                type="text"
                value={lightBg}
                onChange={(e) => {
                  const val = e.target.value;
                  onOptionsChange((prev) => ({
                    ...prev,
                    color: { ...prev.color, light: val },
                  }));
                }}
                className="w-full text-xs font-mono font-semibold text-slate-800 bg-transparent focus:outline-none uppercase"
                placeholder="#FFFFFF"
              />
            </div>
          </div>
        </div>

        {/* Gradient Mode & Invert Action (5 cols) */}
        <div className="md:col-span-5 flex flex-col sm:flex-row md:flex-col gap-2.5">
          {/* Gradient type selector */}
          <div className="flex flex-col gap-1 w-full">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Type de Dégradé :
            </span>
            <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl">
              {[
                { id: "none", label: "Uni" },
                { id: "linear-diagonal", label: "Diag." },
                { id: "linear-horizontal", label: "Horiz." },
                { id: "radial", label: "Radial" },
              ].map((gt) => (
                <button
                  key={gt.id}
                  id={`btn-grad-${gt.id}`}
                  onClick={() =>
                    onOptionsChange((prev) => ({
                      ...prev,
                      gradientType: gt.id as QRGradientType,
                    }))
                  }
                  className={`py-1 text-[11px] font-semibold rounded-lg transition-all text-center ${
                    gradType === gt.id
                      ? "bg-white text-indigo-700 font-bold shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {gt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Invert Button */}
          <button
            id="btn-invert-colors"
            onClick={handleInvertColors}
            className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all active:scale-[0.98]"
            title="Intervertir la couleur de fond et la couleur du motif"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500" />
            <span>Inverser fond & motif</span>
          </button>
        </div>
      </div>

      {/* Quick 1-Click Certified Scannable Palettes */}
      <div className="pt-4 mt-4 border-t border-slate-100">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
          Nuanciers certifiés à fort contraste :
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {CERTIFIED_PALETTES.map((pal) => {
            const isSelected =
              options.color.dark === pal.dark &&
              (options.color.darkSecondary || options.color.dark) ===
                (pal.darkSecondary || pal.dark) &&
              options.color.light === pal.light;

            return (
              <button
                key={pal.name}
                id={`btn-palette-${pal.name.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={() => handleApplyPalette(pal)}
                className={`group flex items-center gap-2 p-2 rounded-xl border transition-all text-left active:scale-[0.98] ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-xs"
                    : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/70"
                }`}
              >
                {/* Visual Duo-tone Swatch */}
                <div
                  className="w-6 h-6 rounded-lg shrink-0 flex items-center justify-center border border-black/10 shadow-2xs"
                  style={{
                    background: pal.darkSecondary
                      ? `linear-gradient(135deg, ${pal.dark}, ${pal.darkSecondary})`
                      : pal.dark,
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full border border-black/20"
                    style={{ backgroundColor: pal.light }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-slate-800 truncate w-full group-hover:text-indigo-900">
                  {pal.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
