import { useState, useEffect, useCallback } from "react";
import { PasswordGenerator } from "./components/PasswordGenerator";
import { Header } from "./components/Header";
import { QrGenerator } from "./components/QrGenerator";
import { UrlShortener } from "./components/UrlShortener";
import { HistoryList } from "./components/HistoryList";
import { DeploymentGuide } from "./components/DeploymentGuide";
import { ToastContainer, ToastMessage } from "./components/Toast";
import { ShortLink } from "./types";
import { QrCode, Link2, ShieldCheck, Zap } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"generator" | "shortener" | "history" | "deployment" | "password">("generator");
  const [qrUrl, setQrUrl] = useState<string>("https://google.com");
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: "success" | "error" | "info", text: string) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Les liens ne sont conservés que pendant cette session ; aucune liste publique.
  useEffect(() => { setLinks([]); }, []);

  const handleLinkCreated = (newLink: ShortLink) => {
    setLinks((prev) => [newLink, ...prev]);
  };

  const handleOpenQrForUrl = (targetUrl: string) => {
    setQrUrl(targetUrl);
    setActiveTab("generator");
    addToast("info", "URL chargée dans le générateur de QR Code !");
  };

  const handleDeleteLink = async (code: string) => {
    setLinks((prev) => prev.filter((l) => l.shortCode !== code));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white pb-16 md:pb-0">
      {/* Top and Mobile Adaptive Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        totalLinksCount={links.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-8">

        {activeTab === "generator" && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <QrCode className="w-5 h-5 text-indigo-600" />
                Générateur de QR Code Personnalisé
              </h2>
              <p className="text-xs text-slate-500">
                Créez, personnalisez les couleurs et téléchargez vos QR codes en haute définition ou SVG vectoriel.
              </p>
            </div>

            <QrGenerator
              initialUrl={qrUrl}
              onToast={addToast}
            />
          </div>
        )}

        {activeTab === "password" && <PasswordGenerator />}

        {activeTab === "shortener" && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Link2 className="w-5 h-5 text-indigo-600" />
                Raccourcisseur d'URL
              </h2>
              <p className="text-xs text-slate-500">
                Créez des liens courts faciles à retenir avec statistiques de clics en temps réel.
              </p>
            </div>

            <UrlShortener
              onLinkCreated={handleLinkCreated}
              onOpenQrForUrl={handleOpenQrForUrl}
              onToast={addToast}
            />
          </div>
        )}

        {activeTab === "history" && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Historique & Statistiques des Liens
              </h2>
              <p className="text-xs text-slate-500">
                Consultez le nombre de redirections et gérez vos liens raccourcis.
              </p>
            </div>

            <HistoryList
              links={links}
              onSelectQrForUrl={handleOpenQrForUrl}
              onDeleteLink={handleDeleteLink}
              onToast={addToast}
            />
          </div>
        )}

        {activeTab === "deployment" && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            <DeploymentGuide onToast={addToast} />
          </div>
        )}
      </main>

      {/* Modern subtle footer */}
      <footer id="main-footer" className="border-t border-slate-200/80 bg-white py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <Zap className="w-3.5 h-3.5 text-indigo-600" />
              Génération vectorielle instantanée
            </span>
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Redirection sécurisée
            </span>
          </div>
          <p className="text-slate-400 text-center sm:text-right">
            QR Code & Raccourcisseur d'URL • Testez vos codes avant diffusion
          </p>
        </div>
      </footer>

      {/* Floating Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
