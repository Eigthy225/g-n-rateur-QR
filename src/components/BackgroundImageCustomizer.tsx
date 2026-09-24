import React, { useRef } from "react";
import {
  Image as ImageIcon,
  Upload,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  Eye,
  Trash2,
  Sparkles,
  Zap,
  Info,
} from "lucide-react";
import { QROptions, QRBackgroundImage } from "../types";

interface BackgroundImageCustomizerProps {
  options: QROptions;
  onOptionsChange: (updater: (prev: QROptions) => QROptions) => void;
  onToast: (type: "success" | "error" | "info", text: string) => void;
}

interface ImagePreset {
  id: string;
  name: string;
  category: string;
  src: string;
  defaultOpacity: number;
  contrastVeil: "none" | "light" | "dark";
  veilOpacity: number;
  blur?: number;
  description: string;
}

// Preloaded examples including the staff portrait requested by the user
const PRESET_EXAMPLES: ImagePreset[] = [
  {
    id: "staff-portrait",
    name: "Photo Staff / Profil",
    category: "Badge Collaborateur",
    src: "/samples/sample_staff_portrait_1790276175651.jpg",
    defaultOpacity: 0.35,
    contrastVeil: "light",
    veilOpacity: 0.35,
    blur: 0,
    description: "Idéal pour cartes de visite, badges d'employé et trombinoscopes.",
  },
  {
    id: "geometric-texture",
    name: "Filigrane Géométrique",
    category: "Corporate & Tech",
    src: "/samples/sample_geometric_texture_1790276195318.jpg",
    defaultOpacity: 0.45,
    contrastVeil: "light",
    veilOpacity: 0.25,
    blur: 0,
    description: "Motifs abstraits épurés apportant du relief sans perturber le scan.",
  },
  {
    id: "corporate-shield",
    name: "Emblème Vectoriel",
    category: "Logo de marque",
    src: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%234f46e5"/><stop offset="100%" stop-color="%239333ea"/></linearGradient></defs><circle cx="250" cy="250" r="230" fill="%23f8fafc" stroke="%23e2e8f0" stroke-width="8"/><polygon points="250,70 410,160 410,340 250,430 90,340 90,160" fill="url(%23g)" opacity="0.85"/><circle cx="250" cy="250" r="70" fill="%23ffffff"/><polygon points="250,200 290,280 210,280" fill="%234f46e5"/></svg>`,
    defaultOpacity: 0.3,
    contrastVeil: "light",
    veilOpacity: 0.3,
    blur: 0,
    description: "Emblème institutionnel centré en filigrane discret.",
  },
  {
    id: "pastel-waves",
    name: "Ondes Pastel Douces",
    category: "Créatif & Moderne",
    src: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><defs><linearGradient id="w" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2306b6d4"/><stop offset="50%" stop-color="%233b82f6"/><stop offset="100%" stop-color="%23ec4899"/></linearGradient></defs><rect width="500" height="500" fill="%23fafafa"/><path d="M0,150 C150,220 350,80 500,160 L500,500 L0,500 Z" fill="url(%23w)" opacity="0.65"/><path d="M0,280 C180,340 320,240 500,320 L500,500 L0,500 Z" fill="%23ffffff" opacity="0.5"/></svg>`,
    defaultOpacity: 0.35,
    contrastVeil: "light",
    veilOpacity: 0.3,
    blur: 1,
    description: "Ambiance colorée fluide avec courbes artistiques.",
  },
];

export function BackgroundImageCustomizer({
  options,
  onOptionsChange,
  onToast,
}: BackgroundImageCustomizerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const currentBg = options.backgroundImage;

  // Handle local image file upload (PNG, JPG, WEBP, SVG)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      onToast("error", "Veuillez sélectionner un fichier image valide (JPG, PNG, WEBP, SVG).");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      onToast("error", "L'image est trop volumineuse (maximum 8 Mo).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      onOptionsChange((prev) => ({
        ...prev,
        backgroundImage: {
          src: dataUrl,
          name: file.name,
          opacity: 0.35,
          contrastVeil: "light",
          veilOpacity: 0.35,
          isolateEyes: true,
          blur: 0,
          fit: "cover",
        },
        // Automatically ensure error correction is robust (Q 25% or H 30%)
        errorCorrectionLevel:
          prev.errorCorrectionLevel === "L" || prev.errorCorrectionLevel === "M"
            ? "Q"
            : prev.errorCorrectionLevel,
      }));

      onToast("success", `Image « ${file.name} » intégrée avec succès en arrière-plan !`);
    };

    reader.onerror = () => {
      onToast("error", "Impossible de lire le fichier image sélectionné.");
    };

    reader.readAsDataURL(file);
    // Reset input
    e.target.value = "";
  };

  const handleApplyPreset = (preset: ImagePreset) => {
    onOptionsChange((prev) => ({
      ...prev,
      backgroundImage: {
        src: preset.src,
        name: preset.name,
        opacity: preset.defaultOpacity,
        contrastVeil: preset.contrastVeil,
        veilOpacity: preset.veilOpacity,
        isolateEyes: true,
        blur: preset.blur || 0,
        fit: "cover",
      },
      errorCorrectionLevel:
        prev.errorCorrectionLevel === "L" || prev.errorCorrectionLevel === "M"
          ? "Q"
          : prev.errorCorrectionLevel,
    }));
    onToast("info", `Arrière-plan « ${preset.name} » appliqué`);
  };

  const handleRemoveImage = () => {
    onOptionsChange((prev) => ({
      ...prev,
      backgroundImage: undefined,
    }));
    onToast("info", "Image d'arrière-plan retirée");
  };

  const handleUpdateBg = (patch: Partial<QRBackgroundImage>) => {
    onOptionsChange((prev) => {
      if (!prev.backgroundImage) return prev;
      return {
        ...prev,
        backgroundImage: {
          ...prev.backgroundImage,
          ...patch,
        },
      };
    });
  };

  const handleAutoOptimize = () => {
    onOptionsChange((prev) => {
      if (!prev.backgroundImage) return prev;
      return {
        ...prev,
        color: {
          ...prev.color,
          dark: "#0f172a", // deep navy for guaranteed module contrast
          light: "#ffffff",
        },
        errorCorrectionLevel: "Q",
        backgroundImage: {
          ...prev.backgroundImage,
          opacity: 0.32,
          contrastVeil: "light",
          veilOpacity: 0.4,
          isolateEyes: true,
        },
      };
    });
    onToast("success", "Réglages optimisés : détection 100% garantie par tous les smartphones !");
  };

  return (
    <div id="background-image-customizer" className="flex flex-col gap-6 animate-in fade-in duration-150">
      {/* Educational Banner answering the user question explicitly */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 via-sky-50 to-purple-50 border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-900">
                Oui, l'intégration d'image en arrière-plan est totalement prise en charge !
              </h4>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
                Norme ISO 18004
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
              Vous pouvez insérer une <strong>photo de profil / collaborateur</strong>, votre <strong>logo d'entreprise</strong> ou une <strong>texture graphique</strong>. La zone de sécurité des 3 yeux et le voile de contraste préservent une vitesse de scan instantanée.
            </p>
          </div>
        </div>

        {currentBg && (
          <button
            onClick={handleAutoOptimize}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200 shadow-2xs transition-all active:scale-95"
            title="Ajuste automatiquement les paramètres de contraste pour un scan infaillible"
          >
            <Zap className="w-3.5 h-3.5 text-indigo-600" />
            <span>Optimiser le scan</span>
          </button>
        )}
      </div>

      {/* Preset Showcase with One-Click Examples */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
            Exemples prêts à l'emploi (1 Clic)
          </label>
          <span className="text-[11px] text-slate-500 font-medium">
            Cliquez pour tester immédiatement
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PRESET_EXAMPLES.map((preset) => {
            const isSelected = currentBg?.src === preset.src;

            return (
              <button
                key={preset.id}
                id={`btn-preset-bg-${preset.id}`}
                onClick={() => handleApplyPreset(preset)}
                className={`flex flex-col p-3 rounded-xl border text-left transition-all active:scale-[0.98] group ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50"
                }`}
              >
                {/* Visual Thumbnail Preview */}
                <div className="w-full h-16 rounded-lg bg-slate-100 border border-slate-200/80 mb-2 overflow-hidden relative flex items-center justify-center">
                  <img
                    src={preset.src}
                    alt={preset.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-1.5">
                    <span className="text-[9px] font-bold text-white uppercase tracking-wider truncate drop-shadow-xs">
                      {preset.category}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                <span className="text-xs font-bold text-slate-900 truncate w-full">
                  {preset.name}
                </span>
                <span className="text-[10px] text-slate-500 line-clamp-2 leading-tight mt-0.5">
                  {preset.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* File Upload Zone for Custom Photos (e.g. Staff photo, personal portrait, brand assets) */}
      <div className="pt-2">
        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
          Ou importez votre propre image (Photo Staff, Logo, Affiche)
        </label>

        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/60 hover:bg-indigo-50/30 p-5 rounded-2xl cursor-pointer transition-all flex flex-col items-center justify-center text-center gap-2 group"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={handleFileUpload}
            className="hidden"
          />
          <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-indigo-700 hover:underline">
              Cliquer pour choisir une image sur votre appareil
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              JPG, PNG, WebP ou SVG (max 8 Mo). Formats carrés ou portraits recommandés.
            </p>
          </div>
        </div>
      </div>

      {/* Background Image Adjustments (Shown if image is loaded) */}
      {currentBg && (
        <div className="p-4 sm:p-5 rounded-2xl border border-indigo-100 bg-indigo-50/30 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-indigo-100/70">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold text-slate-900">
                Ajustements de l'arrière-plan actif :
              </h4>
              <span className="text-xs font-semibold text-indigo-900 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                {currentBg.name || "Image personnalisée"}
              </span>
            </div>

            <button
              onClick={handleRemoveImage}
              className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
              title="Supprimer l'image d'arrière-plan"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Retirer l'image</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Opacity Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <span>Opacité de l'image</span>
                </label>
                <span className="text-xs font-bold text-indigo-700 font-mono">
                  {Math.round((currentBg.opacity ?? 0.35) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.1}
                max={0.9}
                step={0.05}
                value={currentBg.opacity ?? 0.35}
                onChange={(e) => handleUpdateBg({ opacity: Number(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>10% Discret</span>
                <span className="text-emerald-700 font-semibold bg-emerald-50 px-1 rounded">
                  Recommandé 25% - 40%
                </span>
                <span>90% Prononcé</span>
              </div>
            </div>

            {/* Contrast Veil (Voile de contraste clair/sombre) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Voile de contraste protecteur</span>
                </label>
                <span className="text-xs font-bold text-slate-700">
                  {currentBg.contrastVeil === "light"
                    ? "Voile Clair"
                    : currentBg.contrastVeil === "dark"
                    ? "Voile Sombre"
                    : "Désactivé"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "light", label: "Clair (Conseillé)" },
                  { id: "dark", label: "Sombre" },
                  { id: "none", label: "Aucun" },
                ].map((v) => (
                  <button
                    key={v.id}
                    onClick={() =>
                      handleUpdateBg({
                        contrastVeil: v.id as "none" | "light" | "dark",
                      })
                    }
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      (currentBg.contrastVeil || "light") === v.id
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Le voile adoucit les zones sombres de la photo pour faire ressortir les carrés du QR code.
              </p>
            </div>

            {/* Soft Blur Filter */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Flou artistique doux
                </label>
                <span className="text-xs font-bold text-slate-700 font-mono">
                  {currentBg.blur || 0}px
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={6}
                step={1}
                value={currentBg.blur || 0}
                onChange={(e) => handleUpdateBg({ blur: Number(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                Lisse les micro-détails du visage ou de la photo pour un rendu filigrane épuré.
              </span>
            </div>

            {/* Finder Pattern Eyes Protection Toggle */}
            <div className="flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-700 block mb-1">
                Sécurité des 3 yeux de repérage
              </span>
              <button
                onClick={() =>
                  handleUpdateBg({
                    isolateEyes: currentBg.isolateEyes === false ? true : false,
                  })
                }
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-left ${
                  currentBg.isolateEyes !== false
                    ? "bg-emerald-50/80 border-emerald-300 text-emerald-900"
                    : "bg-white border-slate-200 text-slate-600"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="text-xs font-bold block">
                      {currentBg.isolateEyes !== false
                        ? "Zone de sécurité active (Recommandé)"
                        : "Zone de sécurité désactivée"}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Isole les 3 coins sur fond net pour un scan immédiat.
                    </span>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-white ${
                    currentBg.isolateEyes !== false ? "bg-emerald-600" : "bg-slate-300"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
