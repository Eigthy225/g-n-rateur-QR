import { useState } from "react";
import {
  Link2,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Tag,
  Hash,
} from "lucide-react";
import { ShortLink } from "../types";

interface UrlShortenerProps {
  onLinkCreated: (link: ShortLink) => void;
  onOpenQrForUrl: (url: string) => void;
  onToast: (type: "success" | "error" | "info", text: string) => void;
}

export function UrlShortener({
  onLinkCreated,
  onOpenQrForUrl,
  onToast,
}: UrlShortenerProps) {
  const [url, setUrl] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [title, setTitle] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [latestCreated, setLatestCreated] = useState<ShortLink | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      onToast("error", "Veuillez saisir une URL à raccourcir.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/shorten", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url.trim(),
          customSlug: customSlug.trim() || undefined,
          title: title.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue.");
      }

      setLatestCreated(data);
      onLinkCreated(data);
      onToast("success", "URL raccourcie avec succès !");

      // Reset form fields
      setUrl("");
      setCustomSlug("");
      setTitle("");
      setShowAdvanced(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      onToast("error", msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async (linkToCopy: string) => {
    try {
      await navigator.clipboard.writeText(linkToCopy);
      setCopied(true);
      onToast("success", "Lien court copié dans le presse-papier !");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onToast("info", "Veuillez copier le lien manuellement.");
    }
  };

  return (
    <div id="url-shortener-root" className="max-w-4xl mx-auto flex flex-col gap-8">
      {/* Creation Card */}
      <div id="shortener-form-card" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Link2 className="w-5 h-5 text-indigo-600" />
            Raccourcir une nouvelle URL
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Transformez vos URL longues en liens courts, élégants et faciles à partager.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Link2 className="w-4 h-4" />
              </div>
              <input
                id="input-long-url"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Collez votre lien long ici (ex: https://monsite.fr/articles/guide-2026)"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-mono"
              />
            </div>

            <button
              id="btn-submit-shorten"
              type="submit"
              disabled={isLoading || !url.trim()}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold shadow-xs shadow-indigo-200 transition-all active:scale-[0.98] shrink-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Raccourcissement...
                </>
              ) : (
                <>
                  Raccourcir
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Toggle for Advanced Options */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              id="toggle-advanced-slug"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-semibold text-slate-600 hover:text-indigo-600 flex items-center gap-1.5 transition-colors"
            >
              <Hash className="w-3.5 h-3.5" />
              {showAdvanced ? "Masquer les options avancées" : "Personnaliser le lien (alias & titre)"}
            </button>
            <span className="text-[11px] text-slate-400">Redirection 302 instantanée</span>
          </div>

          {/* Advanced fields: Custom slug & Title */}
          {showAdvanced && (
            <div
              id="advanced-options-panel"
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 animate-in fade-in slide-in-from-top-2"
            >
              <div>
                <label
                  htmlFor="input-custom-slug"
                  className="text-xs font-medium text-slate-700 flex items-center gap-1.5 mb-1.5"
                >
                  <Hash className="w-3.5 h-3.5 text-indigo-500" />
                  Alias personnalisé (slug optionnel)
                </label>
                <div className="flex items-center rounded-lg border border-slate-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-600">
                  <span className="pl-3 pr-1 text-xs text-slate-400 font-mono select-none">
                    /s/
                  </span>
                  <input
                    id="input-custom-slug"
                    type="text"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                    placeholder="mon-alias"
                    className="w-full py-2 pr-3 text-xs font-mono text-slate-900 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Lettres, chiffres, tirets. Ex: <code>promo-ete</code>
                </p>
              </div>

              <div>
                <label
                  htmlFor="input-link-title"
                  className="text-xs font-medium text-slate-700 flex items-center gap-1.5 mb-1.5"
                >
                  <Tag className="w-3.5 h-3.5 text-indigo-500" />
                  Titre du lien (mémo personnel)
                </label>
                <input
                  id="input-link-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Campagne Printemps 2026"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Facilite l'organisation dans votre historique.
                </p>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Result Card: Displayed right after shortening */}
      {latestCreated && (
        <div
          id="latest-created-result-card"
          className="bg-gradient-to-r from-indigo-50/70 via-white to-violet-50/70 p-6 sm:p-7 rounded-2xl border border-indigo-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 animate-in fade-in zoom-in-95"
        >
          <div className="flex flex-col gap-2 min-w-0 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Lien raccourci prêt
              </span>
              {latestCreated.title && (
                <span className="text-xs font-semibold text-slate-700 truncate max-w-xs">
                  {latestCreated.title}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-base sm:text-lg font-bold text-indigo-950 truncate select-all">
                {latestCreated.shortUrl}
              </span>
            </div>

            <div className="text-xs text-slate-500 truncate max-w-md flex items-center gap-1">
              <span>Redirige vers :</span>
              <a
                href={latestCreated.originalUrl}
                target="_blank"
                rel="noreferrer"
                className="text-slate-600 hover:text-indigo-600 underline truncate max-w-xs"
              >
                {latestCreated.originalUrl}
              </a>
            </div>
          </div>

          {/* Quick Action buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              id="btn-copy-latest-short"
              onClick={() => handleCopyLink(latestCreated.shortUrl)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  Copié !
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copier le lien
                </>
              )}
            </button>

            <a
              id="btn-test-latest-short"
              href={latestCreated.shortUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              Tester
            </a>

            <button
              id="btn-generate-qr-for-latest"
              onClick={() => onOpenQrForUrl(latestCreated.shortUrl)}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
              title="Générer le QR code pour ce lien court"
            >
              <QrCode className="w-4 h-4 text-indigo-400" />
              Générer le QR Code
            </button>
          </div>
        </div>
      )}

      {/* Value Proposition Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 flex flex-col gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
            1
          </div>
          <h4 className="text-sm font-semibold text-slate-900">Scan QR Optimisé</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Un lien court comporte moins de données, produisant un QR Code aux motifs plus espacés et beaucoup plus facile à scanner de loin.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 flex flex-col gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
            2
          </div>
          <h4 className="text-sm font-semibold text-slate-900">Suivi des Clics</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Chaque fois qu'un utilisateur clique sur le lien ou scanne le QR code, les statistiques de clics sont immédiatement comptabilisées.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 flex flex-col gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
            3
          </div>
          <h4 className="text-sm font-semibold text-slate-900">Alias Personnalisables</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Créez des slugs mémorables comme <code>/s/mon-site</code> pour renforcer la confiance et la lisibilité auprès de vos destinataires.
          </p>
        </div>
      </div>
    </div>
  );
}
