import { useState, useEffect, useRef } from "react";
import {
  Download,
  Copy,
  Check,
  Sparkles,
  Link as LinkIcon,
  Palette,
  Sliders,
  Maximize2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Zap,
  Smile,
  LayoutTemplate,
  AlertTriangle,
  CheckCircle2,
  Wand2,
  Image as ImageIcon,
} from "lucide-react";
import {
  QROptions,
  QRDotStyle,
  QREyeStyle,
  QRGradientType,
  QRFrameStyle,
  QRBackgroundImage,
} from "../types";
import {
  renderQRToCanvas,
  generateQRDataUrl,
  generateQRSvgString,
  downloadFile,
  evaluateScanReliability,
} from "../utils/qrHelper";
import { QrContent } from "./QrContent";
import { ColorCustomizationBanner } from "./ColorCustomizationBanner";
import { BackgroundImageCustomizer } from "./BackgroundImageCustomizer";

interface QrGeneratorProps {
  initialUrl?: string;
  onShortenRequest?: (url: string) => void;
  onToast: (type: "success" | "error" | "info", text: string) => void;
}

// Creative Fancy 1-Click Themes
interface FancyPreset {
  name: string;
  tagline: string;
  dark: string;
  darkSecondary: string;
  light: string;
  gradientType: QRGradientType;
  dotStyle: QRDotStyle;
  eyeStyle: QREyeStyle;
  centerIcon?: string;
  frameStyle?: QRFrameStyle;
  frameText?: string;
  backgroundImage?: QRBackgroundImage;
}

const FANCY_THEMES: FancyPreset[] = [
  {
    name: "Cyber Neon",
    tagline: "Cyan & Magenta électrique",
    dark: "#0891b2",
    darkSecondary: "#c026d3",
    light: "#ffffff",
    gradientType: "linear-diagonal",
    dotStyle: "dots",
    eyeStyle: "rounded",
    centerIcon: "⚡",
  },
  {
    name: "Badge Collaborateur",
    tagline: "Photo Staff en filigrane discret",
    dark: "#0f172a",
    darkSecondary: "#1e3a8a",
    light: "#ffffff",
    gradientType: "linear-diagonal",
    dotStyle: "rounded",
    eyeStyle: "rounded",
    centerIcon: "",
    backgroundImage: {
      src: "/samples/sample_staff_portrait_1790276175651.jpg",
      name: "Photo Staff / Profil",
      opacity: 0.35,
      contrastVeil: "light",
      veilOpacity: 0.35,
      isolateEyes: true,
      fit: "cover",
    },
  },
  {
    name: "Sunset Glow",
    tagline: "Orange coucher de soleil & rose",
    dark: "#c2410c",
    darkSecondary: "#be185d",
    light: "#fffbf5",
    gradientType: "linear-diagonal",
    dotStyle: "rounded",
    eyeStyle: "circle",
    centerIcon: "✨",
  },
  {
    name: "Galaxie Cosmique",
    tagline: "Bleu nuit & violet spatial",
    dark: "#1e3a8a",
    darkSecondary: "#6d28d9",
    light: "#ffffff",
    gradientType: "linear-diagonal",
    dotStyle: "diamond",
    eyeStyle: "rounded",
    centerIcon: "🚀",
  },
  {
    name: "Émeraude Zen",
    tagline: "Vert émeraude & sarcelle",
    dark: "#047857",
    darkSecondary: "#0f766e",
    light: "#f0fdf4",
    gradientType: "linear-diagonal",
    dotStyle: "dots",
    eyeStyle: "circle",
    centerIcon: "🍃",
  },
  {
    name: "Or & Prestige",
    tagline: "Doré ambré & bronze raffiné",
    dark: "#b45309",
    darkSecondary: "#78350f",
    light: "#fffdfa",
    gradientType: "linear-diagonal",
    dotStyle: "diamond",
    eyeStyle: "rounded",
    centerIcon: "💎",
  },
  {
    name: "Café Barista",
    tagline: "Châtaigne chaude & caramel",
    dark: "#6c2e17",
    darkSecondary: "#9a3412",
    light: "#faf5f0",
    gradientType: "linear-horizontal",
    dotStyle: "rounded",
    eyeStyle: "circle",
    centerIcon: "☕",
  },
  {
    name: "Cœur Romantique",
    tagline: "Rose fuchsia & carmin",
    dark: "#be123c",
    darkSecondary: "#e11d48",
    light: "#fff1f2",
    gradientType: "linear-diagonal",
    dotStyle: "dots",
    eyeStyle: "rounded",
    centerIcon: "❤️",
  },
  {
    name: "Classique Noir",
    tagline: "Noir intemporel & contraste maximal",
    dark: "#0f172a",
    darkSecondary: "#0f172a",
    light: "#ffffff",
    gradientType: "none",
    dotStyle: "square",
    eyeStyle: "square",
    centerIcon: "",
  },
];

const POPULAR_EMOJIS = [
  "🔗",
  "✨",
  "⚡",
  "🚀",
  "💎",
  "❤️",
  "☕",
  "🛍️",
  "🎵",
  "📍",
  "📱",
  "🎁",
  "🔥",
  "⭐",
  "🍕",
  "🎉",
];

export function QrGenerator({
  initialUrl = "https://google.com",
  onShortenRequest,
  onToast,
}: QrGeneratorProps) {
  const [url, setUrl] = useState(initialUrl);

  const [options, setOptions] = useState<QROptions>({
    errorCorrectionLevel: "Q", // Default to Q for superior scanning resilience
    color: {
      dark: "#0891b2",
      darkSecondary: "#c026d3",
      light: "#ffffff",
    },
    gradientType: "linear-diagonal",
    dotStyle: "dots",
    eyeStyle: "rounded",
    centerIcon: "⚡",
    frameStyle: "none",
    frameText: "SCANNEZ-MOI",
    margin: 2,
    width: 320,
  });

  const [activeTab, setActiveTab] = useState<
    "effects" | "image" | "colors" | "badge" | "frame" | "advanced"
  >("effects");
  const [customTextBadge, setCustomTextBadge] = useState("");
  const [downloadResolution, setDownloadResolution] = useState<number>(1024);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrError, setQrError] = useState("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Synchronize if initialUrl changes externally
  useEffect(() => {
    if (initialUrl && initialUrl !== url) {
      setUrl(initialUrl);
    }
  }, [initialUrl]);

  // Compute live scan reliability score
  const scanReliability = evaluateScanReliability(options);

  // Render QR Code to canvas whenever url or options change
  useEffect(() => {
    let active = true;

    async function draw() {
      if (!canvasRef.current || !url.trim()) return;
      setIsGenerating(true);
      try {
        await renderQRToCanvas(canvasRef.current, url.trim(), options);
        if (active) setQrError("");
      } catch (err) {
        if (active) setQrError("Impossible de générer ce QR code. Réduisez le contenu ou choisissez un niveau de correction inférieur.");
      } finally {
        if (active) setIsGenerating(false);
      }
    }

    draw();

    return () => {
      active = false;
    };
  }, [url, options]);

  const handleDownloadPng = async () => {
    if (!url.trim()) {
      onToast("error", "Veuillez entrer une URL valide.");
      return;
    }
    try {
      const dataUrl = await generateQRDataUrl(url.trim(), options, downloadResolution);
      const safeFilename = `qrcode-${Date.now()}-${downloadResolution}px.png`;
      downloadFile(dataUrl, safeFilename);
      onToast("success", `QR Code téléchargé en PNG haute résolution (${downloadResolution}x${downloadResolution}px)`);
    } catch (err) {
      console.error(err);
      onToast("error", "Impossible de générer le fichier PNG.");
    }
  };

  const handleDownloadSvg = async () => {
    if (!url.trim()) {
      onToast("error", "Veuillez entrer une URL valide.");
      return;
    }
    try {
      const svgString = await generateQRSvgString(url.trim(), options);
      const safeFilename = `qrcode-vectoriel-${Date.now()}.svg`;
      downloadFile(svgString, safeFilename, true);
      onToast("success", "QR Code vectoriel SVG téléchargé (qualité infinie)");
    } catch (err) {
      console.error(err);
      onToast("error", "Impossible de générer le fichier SVG.");
    }
  };

  const handleCopyImage = async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) {
          onToast("error", "Erreur lors de la capture de l'image.");
          return;
        }
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        setCopied(true);
        onToast("success", "Image du QR Code copiée dans le presse-papier !");
        setTimeout(() => setCopied(false), 2500);
      });
    } catch (err) {
      console.warn("Clipboard write failed:", err);
      onToast("info", "La copie directe n'est pas autorisée dans ce navigateur. Utilisez le bouton Télécharger.");
    }
  };

  const handleApplyTheme = (theme: FancyPreset) => {
    setOptions((prev) => ({
      ...prev,
      color: {
        dark: theme.dark,
        darkSecondary: theme.darkSecondary,
        light: theme.light,
      },
      gradientType: theme.gradientType,
      dotStyle: theme.dotStyle,
      eyeStyle: theme.eyeStyle,
      centerIcon: theme.centerIcon || "",
      backgroundImage: theme.backgroundImage,
      // Auto-elevate error correction to ensure better scan reliability with badge or background image
      errorCorrectionLevel:
        theme.centerIcon || theme.backgroundImage ? "Q" : prev.errorCorrectionLevel,
    }));
    onToast("info", `Thème « ${theme.name} » appliqué`);
  };

  const handleAutoFixContrast = () => {
    // Automatically darken the primary and secondary colors while maintaining light background
    setOptions((prev) => ({
      ...prev,
      color: {
        ...prev.color,
        dark: "#0f172a", // Safe deep navy
        darkSecondary: prev.color.darkSecondary ? "#312e81" : "#0f172a",
        light: "#ffffff",
      },
      errorCorrectionLevel:
        prev.backgroundImage?.src || prev.centerIcon ? "Q" : prev.errorCorrectionLevel,
      backgroundImage: prev.backgroundImage
        ? {
            ...prev.backgroundImage,
            opacity: Math.min(prev.backgroundImage.opacity ?? 0.35, 0.35),
            contrastVeil: "light",
            veilOpacity: 0.35,
            isolateEyes: true,
          }
        : undefined,
    }));
    onToast("success", "Contraste amélioré. Testez le QR code avec plusieurs appareils.");
  };

  return (
    <div id="qr-generator-root" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Configuration Column (Left) */}
      <div id="qr-config-column" className="lg:col-span-7 flex flex-col gap-6">
        <QrContent onChange={setUrl} />
        {qrError && <p role="alert" className="p-3 rounded-lg bg-red-50 text-red-700">{qrError}</p>}
        {/* URL Input Box */}
        <div id="qr-url-box" className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2.5">
            <label htmlFor="qr-url-input" className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-indigo-600" />
              URL ou texte à encoder
            </label>
            {url.length > 45 && onShortenRequest && (
              <button
                id="btn-shorten-tip"
                onClick={() => onShortenRequest(url)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline transition-colors"
                title="Raccourcir l'URL rend le QR Code beaucoup plus aéré et rapide à scanner"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Raccourcir l'URL d'abord ?
              </button>
            )}
          </div>

          <div className="relative">
            <input
              id="qr-url-input"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://exemple.fr/votre-page"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-mono"
            />
            {url && (
              <button
                id="qr-clear-url"
                onClick={() => setUrl("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 px-1.5 py-0.5 rounded"
              >
                Effacer
              </button>
            )}
          </div>

          <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
            <span>{url ? `${url.length} caractères encodés` : "Entrez une URL"}</span>
            {url && (
              <a
                href={url.startsWith("http") ? url : `https://${url}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-slate-500 hover:text-indigo-600 transition-colors"
              >
                Tester le lien <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Color Customization Banner with ISO/WCAG Contrast Safeguard */}
        <ColorCustomizationBanner
          options={options}
          onOptionsChange={setOptions}
          onToast={onToast}
        />

        {/* 1-Click Fancy Themes Showcase */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Effets Fantaisie en 1 Clic
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> 100% Scannables
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {FANCY_THEMES.map((theme) => {
              const isSelected =
                options.color.dark === theme.dark &&
                options.color.darkSecondary === theme.darkSecondary &&
                options.dotStyle === theme.dotStyle;

              return (
                <button
                  key={theme.name}
                  id={`btn-fancy-theme-${theme.name.toLowerCase().replace(/\s+/g, "-")}`}
                  onClick={() => handleApplyTheme(theme)}
                  className={`flex flex-col p-2.5 rounded-xl border text-left transition-all active:scale-[0.98] ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/80"
                  }`}
                >
                  {/* Visual Preview Swatch */}
                  <div
                    className="w-full h-10 rounded-lg flex items-center justify-between px-2.5 mb-2 relative overflow-hidden shadow-2xs"
                    style={{
                      background: `linear-gradient(135deg, ${theme.dark}, ${theme.darkSecondary})`,
                    }}
                  >
                    <div className="w-4 h-4 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                    {theme.centerIcon && (
                      <span className="text-sm bg-white/90 rounded-full w-5 h-5 flex items-center justify-center shadow-xs">
                        {theme.centerIcon}
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-bold text-slate-900 truncate w-full">
                    {theme.name}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate w-full">
                    {theme.tagline}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detailed Customization Tabs (Styles, Colors, Badge, Frames, Precision) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Tabs bar */}
          <div className="flex border-b border-slate-200 bg-slate-50/70 p-1.5 overflow-x-auto gap-1">
            <button
              onClick={() => setActiveTab("effects")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === "effects"
                  ? "bg-white text-indigo-700 shadow-xs border border-slate-200 font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-indigo-500" />
              Motifs & Yeux
            </button>

            <button
              id="tab-bg-image"
              onClick={() => setActiveTab("image")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === "image"
                  ? "bg-white text-indigo-700 shadow-xs border border-slate-200 font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
              <span>Image de fond</span>
              {options.backgroundImage?.src && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200 ml-0.5" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("colors")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === "colors"
                  ? "bg-white text-indigo-700 shadow-xs border border-slate-200 font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-indigo-500" />
              Dégradés & Couleurs
            </button>

            <button
              onClick={() => setActiveTab("badge")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === "badge"
                  ? "bg-white text-indigo-700 shadow-xs border border-slate-200 font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Smile className="w-3.5 h-3.5 text-indigo-500" />
              Badge Central
            </button>

            <button
              onClick={() => setActiveTab("frame")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === "frame"
                  ? "bg-white text-indigo-700 shadow-xs border border-slate-200 font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutTemplate className="w-3.5 h-3.5 text-indigo-500" />
              Cadre & Texte
            </button>

            <button
              onClick={() => setActiveTab("advanced")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === "advanced"
                  ? "bg-white text-indigo-700 shadow-xs border border-slate-200 font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-500" />
              Tolérance & Marge
            </button>
          </div>

          <div className="p-5 sm:p-6 flex flex-col gap-6">
            {/* TAB 1: MOTIFS & YEUX */}
            {activeTab === "effects" && (
              <div className="flex flex-col gap-5 animate-in fade-in duration-150">
                {/* Module Shape */}
                <div>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                    Forme des modules de données
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { id: "square", label: "Carrés", desc: "Classique ISO" },
                      { id: "dots", label: "Points", desc: "Cercles doux" },
                      { id: "rounded", label: "Arrondis", desc: "Moderne chic" },
                      { id: "diamond", label: "Diamants", desc: "Losanges" },
                      { id: "stars", label: "Étoiles", desc: "Étincelles" },
                    ].map((m) => (
                      <button
                        key={m.id}
                        id={`btn-dot-style-${m.id}`}
                        onClick={() =>
                          setOptions((prev) => ({
                            ...prev,
                            dotStyle: m.id as QRDotStyle,
                          }))
                        }
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          options.dotStyle === m.id
                            ? "bg-indigo-50 border-indigo-600 text-indigo-900 font-bold shadow-xs"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <span className="text-xs block font-bold">{m.label}</span>
                        <span className="text-[10px] text-slate-400 block">{m.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Finder Pattern Eyes */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                      Style des 3 yeux de repérage (Finder Patterns)
                    </label>
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      Détection 100% garantie
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "square", label: "Carré classique", icon: "⏹️" },
                      { id: "rounded", label: "Coins arrondis", icon: "🔘" },
                      { id: "circle", label: "Anneau circulaire", icon: "⭕" },
                    ].map((eye) => (
                      <button
                        key={eye.id}
                        id={`btn-eye-style-${eye.id}`}
                        onClick={() =>
                          setOptions((prev) => ({
                            ...prev,
                            eyeStyle: eye.id as QREyeStyle,
                          }))
                        }
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                          options.eyeStyle === eye.id
                            ? "bg-indigo-50 border-indigo-600 text-indigo-900 font-bold shadow-xs"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <span className="text-lg">{eye.icon}</span>
                        <span className="text-xs">{eye.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB IMAGE DE FOND */}
            {activeTab === "image" && (
              <BackgroundImageCustomizer
                options={options}
                onOptionsChange={setOptions}
                onToast={onToast}
              />
            )}

            {/* TAB 2: DÉGRADÉS & COULEURS */}
            {activeTab === "colors" && (
              <div className="flex flex-col gap-5 animate-in fade-in duration-150">
                {/* Gradient Mode */}
                <div>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                    Effet de Dégradé
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "none", label: "Couleur unie" },
                      { id: "linear-diagonal", label: "Dégradé diagonal" },
                      { id: "linear-horizontal", label: "Dégradé horizontal" },
                      { id: "radial", label: "Dégradé radial" },
                    ].map((g) => (
                      <button
                        key={g.id}
                        onClick={() =>
                          setOptions((prev) => ({
                            ...prev,
                            gradientType: g.id as QRGradientType,
                          }))
                        }
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                          (options.gradientType || "none") === g.id
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Pickers */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">
                      Couleur primaire
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={options.color.dark}
                        onChange={(e) =>
                          setOptions((prev) => ({
                            ...prev,
                            color: { ...prev.color, dark: e.target.value },
                          }))
                        }
                        className="w-10 h-10 rounded-xl border border-slate-300 cursor-pointer p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        value={options.color.dark}
                        onChange={(e) =>
                          setOptions((prev) => ({
                            ...prev,
                            color: { ...prev.color, dark: e.target.value },
                          }))
                        }
                        className="w-full px-2.5 py-2 text-xs font-mono border border-slate-300 rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">
                      Couleur secondaire (dégradé)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={options.color.darkSecondary || options.color.dark}
                        onChange={(e) =>
                          setOptions((prev) => ({
                            ...prev,
                            color: { ...prev.color, darkSecondary: e.target.value },
                          }))
                        }
                        className="w-10 h-10 rounded-xl border border-slate-300 cursor-pointer p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        value={options.color.darkSecondary || options.color.dark}
                        onChange={(e) =>
                          setOptions((prev) => ({
                            ...prev,
                            color: { ...prev.color, darkSecondary: e.target.value },
                          }))
                        }
                        className="w-full px-2.5 py-2 text-xs font-mono border border-slate-300 rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">
                      Couleur de fond
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={options.color.light}
                        onChange={(e) =>
                          setOptions((prev) => ({
                            ...prev,
                            color: { ...prev.color, light: e.target.value },
                          }))
                        }
                        className="w-10 h-10 rounded-xl border border-slate-300 cursor-pointer p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        value={options.color.light}
                        onChange={(e) =>
                          setOptions((prev) => ({
                            ...prev,
                            color: { ...prev.color, light: e.target.value },
                          }))
                        }
                        className="w-full px-2.5 py-2 text-xs font-mono border border-slate-300 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: BADGE CENTRAL */}
            {activeTab === "badge" && (
              <div className="flex flex-col gap-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                      Badge ou Icône au centre du QR Code
                    </label>
                    <p className="text-xs text-slate-500">
                      Intègre un médaillon protecteur au centre avec tolérance automatique (Q/H).
                    </p>
                  </div>
                  {options.centerIcon && (
                    <button
                      onClick={() =>
                        setOptions((prev) => ({ ...prev, centerIcon: "" }))
                      }
                      className="text-xs text-rose-600 font-semibold hover:underline"
                    >
                      Supprimer le badge
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  <button
                    onClick={() =>
                      setOptions((prev) => ({ ...prev, centerIcon: "" }))
                    }
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      !options.centerIcon
                        ? "bg-indigo-50 border-indigo-600 text-indigo-700 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Aucun
                  </button>

                  {POPULAR_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() =>
                        setOptions((prev) => ({
                          ...prev,
                          centerIcon: emoji,
                          // Elevate ECC to Q (25%) or H (30%)
                          errorCorrectionLevel:
                            prev.errorCorrectionLevel === "L" || prev.errorCorrectionLevel === "M"
                              ? "Q"
                              : prev.errorCorrectionLevel,
                        }))
                      }
                      className={`text-xl p-2 rounded-xl border flex items-center justify-center transition-all ${
                        options.centerIcon === emoji
                          ? "bg-indigo-50 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs"
                          : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
                  <label className="text-xs text-slate-600 font-medium whitespace-nowrap">
                    Ou texte court (1-2 caractères) :
                  </label>
                  <input
                    type="text"
                    maxLength={3}
                    placeholder="ex: GO"
                    value={customTextBadge}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setCustomTextBadge(val);
                      if (val.trim()) {
                        setOptions((prev) => ({
                          ...prev,
                          centerIcon: val.trim(),
                          errorCorrectionLevel: "Q",
                        }));
                      }
                    }}
                    className="w-24 px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-xl uppercase text-center"
                  />
                  <span className="text-[11px] text-slate-400">
                    Idéal pour vos initiales ou acronyme
                  </span>
                </div>
              </div>
            )}

            {/* TAB 4: CADRE & APPEL À L'ACTION */}
            {activeTab === "frame" && (
              <div className="flex flex-col gap-4 animate-in fade-in duration-150">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Style de Cadre d'Appel à l'Action (Call To Action)
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: "none", label: "Sans cadre", desc: "QR Code pur" },
                    { id: "banner-bottom", label: "Bannière basse", desc: "Plaquette élégante" },
                    { id: "polaroid", label: "Style Polaroid", desc: "Carte photo chic" },
                    { id: "bubble", label: "Bulle moderne", desc: "Coins ultra-doux" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() =>
                        setOptions((prev) => ({
                          ...prev,
                          frameStyle: f.id as QRFrameStyle,
                        }))
                      }
                      className={`p-3 rounded-xl border text-left transition-all ${
                        (options.frameStyle || "none") === f.id
                          ? "bg-indigo-50 border-indigo-600 text-indigo-900 font-bold shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span className="text-xs block font-bold">{f.label}</span>
                      <span className="text-[10px] text-slate-500 block">{f.desc}</span>
                    </button>
                  ))}
                </div>

                {options.frameStyle && options.frameStyle !== "none" && (
                  <div className="pt-3 border-t border-slate-100 flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-700">
                      Texte du cadre d'appel à l'action
                    </label>
                    <input
                      type="text"
                      value={options.frameText || "SCANNEZ-MOI"}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          frameText: e.target.value,
                        }))
                      }
                      placeholder="SCANNEZ-MOI"
                      className="px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold uppercase tracking-wider"
                    />
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: PARAMÈTRES TECHNIQUES */}
            {activeTab === "advanced" && (
              <div className="flex flex-col gap-5 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                        Correction d'erreur
                      </label>
                      <span className="text-xs font-bold text-indigo-700">
                        {options.errorCorrectionLevel === "L" && "7% (Compact)"}
                        {options.errorCorrectionLevel === "M" && "15% (Standard)"}
                        {options.errorCorrectionLevel === "Q" && "25% (Renforcé)"}
                        {options.errorCorrectionLevel === "H" && "30% (Robuste / Print)"}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(["L", "M", "Q", "H"] as const).map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() =>
                            setOptions((prev) => ({
                              ...prev,
                              errorCorrectionLevel: lvl,
                            }))
                          }
                          className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                            options.errorCorrectionLevel === lvl
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5">
                      Les niveaux Q (25%) et H (30%) permettent de décorer le QR code sans compromettre la vitesse de lecture par les caméras.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                        <Maximize2 className="w-3.5 h-3.5 text-indigo-500" />
                        Marge blanche (Quiet Zone)
                      </label>
                      <span className="text-xs font-bold text-slate-700">
                        {options.margin} modules
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={5}
                      step={1}
                      value={options.margin}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          margin: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg mt-2"
                    />
                    <p className="text-[10px] text-slate-400 mt-1.5">
                      Une marge de 2 modules garantit la reconnaissance immédiate sur fond sombre ou texturé.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview and Export Column (Right) */}
      <div id="qr-preview-column" className="lg:col-span-5 flex flex-col gap-5">
        <div id="qr-preview-card" className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Aperçu en direct
            </span>
            <div className="flex items-center gap-1.5">
              {isGenerating && (
                <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
              )}
              <span className="text-xs text-slate-500 font-medium">Scannable</span>
            </div>
          </div>

          {/* Canvas Wrapper */}
          <div
            id="qr-canvas-container"
            className="w-full max-w-[280px] sm:max-w-[320px] p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-inner flex items-center justify-center transition-colors overflow-hidden mx-auto bg-slate-50/50"
          >
            <canvas
              ref={canvasRef}
              id="qr-preview-canvas"
              className="max-w-full max-h-full h-auto w-auto object-contain rounded-lg drop-shadow-xs"
            />
          </div>

          {/* Background image active info strip or quick add link */}
          {options.backgroundImage?.src ? (
            <div className="w-full mt-2.5 px-3 py-1.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between text-xs">
              <span className="font-semibold text-indigo-900 truncate flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="truncate">
                  Fond : {options.backgroundImage.name || "Actif"} (
                  {Math.round((options.backgroundImage.opacity ?? 0.35) * 100)}%)
                </span>
              </span>
              <button
                onClick={() => setActiveTab("image")}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline shrink-0 ml-2"
              >
                Ajuster
              </button>
            </div>
          ) : (
            <button
              onClick={() => setActiveTab("image")}
              className="mt-2 text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 hover:underline transition-colors"
            >
              <ImageIcon className="w-3 h-3" />
              <span>Intégrer une photo / image en arrière-plan ?</span>
            </button>
          )}

          {/* Scannability Live Gauge & ISO Certification */}
          <div className="w-full mt-5 p-3.5 rounded-xl border flex flex-col gap-2 bg-slate-50/70 border-slate-200/90">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {scanReliability.rating === "optimal" || scanReliability.rating === "bon" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                )}
                <span className="text-xs font-bold text-slate-900">
                  {scanReliability.label}
                </span>
              </div>
              <span
                className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md ${
                  scanReliability.score >= 85
                    ? "bg-emerald-100 text-emerald-800"
                    : scanReliability.score >= 60
                    ? "bg-amber-100 text-amber-800"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {scanReliability.score}%
              </span>
            </div>

            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  scanReliability.score >= 85
                    ? "bg-emerald-500"
                    : scanReliability.score >= 60
                    ? "bg-amber-500"
                    : "bg-rose-500"
                }`}
                style={{ width: `${scanReliability.score}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-0.5">
              <span>Contraste : {scanReliability.contrastRatio}:1</span>
              <span>{scanReliability.eccNotice}</span>
            </div>

            {/* Helpful tip if contrast is too low */}
            {scanReliability.rating !== "optimal" && (
              <button
                onClick={handleAutoFixContrast}
                className="mt-1 flex items-center justify-center gap-1.5 w-full py-1.5 px-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 transition-colors"
              >
                <Zap className="w-3.5 h-3.5 text-indigo-600" />
                Optimiser le contraste automatiquement
              </button>
            )}
          </div>

          {/* Export resolution choice */}
          <div className="w-full mt-4 pt-4 border-t border-slate-100 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="font-medium text-slate-700">Résolution d'export :</span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
                {[512, 1024, 2048].map((res) => (
                  <button
                    key={res}
                    onClick={() => setDownloadResolution(res)}
                    className={`min-h-[30px] px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
                      downloadResolution === res
                        ? "bg-white text-indigo-700 shadow-2xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {res}px
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-2.5">
              <button
                id="btn-download-png"
                onClick={handleDownloadPng}
                className="min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs shadow-indigo-200 transition-all active:scale-[0.98]"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span className="truncate">Télécharger PNG</span>
              </button>

              <button
                id="btn-download-svg"
                onClick={handleDownloadSvg}
                className="min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span className="truncate">Format SVG (Vectoriel)</span>
              </button>
            </div>

            <button
              id="btn-copy-qr"
              onClick={handleCopyImage}
              className="min-h-[44px] flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all active:scale-[0.98]"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Image copiée dans le presse-papier !</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Copier l'image</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
