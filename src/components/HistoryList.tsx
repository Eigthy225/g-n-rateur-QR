import { useState } from "react";
import {
  Link2,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Trash2,
  Search,
  MousePointerClick,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { ShortLink } from "../types";

interface HistoryListProps {
  links: ShortLink[];
  onSelectQrForUrl: (url: string) => void;
  onDeleteLink: (code: string) => Promise<void>;
  onToast: (type: "success" | "error" | "info", text: string) => void;
}

export function HistoryList({
  links,
  onSelectQrForUrl,
  onDeleteLink,
  onToast,
}: HistoryListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [deletingCode, setDeletingCode] = useState<string | null>(null);

  const filteredLinks = links.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.shortCode.toLowerCase().includes(q) ||
      item.originalUrl.toLowerCase().includes(q) ||
      (item.title && item.title.toLowerCase().includes(q))
    );
  });

  const totalClicks = links.reduce((acc, curr) => acc + (curr.clicks || 0), 0);

  const handleCopy = async (link: ShortLink) => {
    try {
      await navigator.clipboard.writeText(link.shortUrl);
      setCopiedCode(link.shortCode);
      onToast("success", "Lien court copié !");
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      onToast("info", "Copie impossible. Copiez manuellement.");
    }
  };

  const handleDelete = async (shortCode: string) => {
    setDeletingCode(shortCode);
    try {
      await onDeleteLink(shortCode);
      onToast("info", "Lien supprimé de l'historique.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la suppression";
      onToast("error", msg);
    } finally {
      setDeletingCode(null);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return isoString;
    }
  };

  return (
    <div id="history-list-root" className="max-w-5xl mx-auto flex flex-col gap-6">
      {/* Top metrics header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Liens créés
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {links.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Link2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Clics & Scans totaux
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {totalClicks}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <MousePointerClick className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Statut du service
            </span>
            <div className="text-sm font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Opérationnel
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="input-search-history"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par URL, alias ou titre..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>
        <span className="text-xs text-slate-500 self-end sm:self-center">
          {filteredLinks.length} lien{filteredLinks.length > 1 ? "s" : ""} affiché{filteredLinks.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Links List */}
      {filteredLinks.length === 0 ? (
        <div
          id="history-empty-state"
          className="bg-white p-12 rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center gap-3"
        >
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            {searchQuery ? "Aucun résultat trouvé" : "Aucun lien raccourci pour l'instant"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm">
            {searchQuery
              ? "Essayez d'ajuster vos termes de recherche."
              : "Créez votre premier lien raccourci pour suivre les clics et générer son QR Code."}
          </p>
        </div>
      ) : (
        <div id="history-items-container" className="flex flex-col gap-3">
          {filteredLinks.map((item) => (
            <div
              key={item.id || item.shortCode}
              id={`history-item-${item.shortCode}`}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {item.title && (
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {item.title}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono text-xs font-bold">
                    /s/{item.shortCode}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    <MousePointerClick className="w-3 h-3" />
                    {item.clicks} clic{item.clicks > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="truncate max-w-md font-mono text-slate-700">
                    {item.shortUrl}
                  </span>
                  <span className="text-slate-300">→</span>
                  <a
                    href={item.originalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate max-w-xs text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {item.originalUrl}
                  </a>
                </div>

                <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-1">
                  <span>Créé le {formatDate(item.createdAt)}</span>
                  {item.lastClickedAt && (
                    <span>Dernier clic le {formatDate(item.lastClickedAt)}</span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-1.5 self-start md:self-center shrink-0">
                <button
                  id={`btn-copy-history-${item.shortCode}`}
                  onClick={() => handleCopy(item)}
                  className="min-h-[40px] flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all active:scale-[0.98]"
                  title="Copier l'URL courte"
                >
                  {copiedCode === item.shortCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copié</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copier</span>
                    </>
                  )}
                </button>

                <button
                  id={`btn-qr-history-${item.shortCode}`}
                  onClick={() => onSelectQrForUrl(item.shortUrl)}
                  className="min-h-[40px] flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-all active:scale-[0.98]"
                  title="Générer et personnaliser le QR Code"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Code QR</span>
                </button>

                <a
                  id={`btn-open-history-${item.shortCode}`}
                  href={item.shortUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                  title="Tester la redirection"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>

                <button
                  id={`btn-delete-history-${item.shortCode}`}
                  onClick={() => handleDelete(item.shortCode)}
                  disabled={deletingCode === item.shortCode}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-50"
                  title="Supprimer ce lien"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
