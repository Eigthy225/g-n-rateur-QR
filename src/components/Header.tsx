import { QrCode, Link2, Activity, Cloud, KeyRound } from "lucide-react";

interface HeaderProps {
  activeTab: "generator" | "shortener" | "history" | "deployment" | "password";
  onTabChange: (tab: "generator" | "shortener" | "history" | "deployment" | "password") => void;
  totalLinksCount: number;
}

export function Header({
  activeTab,
  onTabChange,
  totalLinksCount,
}: HeaderProps) {
  return (
    <>
      {/* Top Header */}
      <header
        id="main-header"
        className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-40"
      >
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-3">
          {/* Brand Wordmark */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200 shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
                QR & URL Studio
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate hidden xs:block">
                QR codes vectoriels & liens courts intelligents
              </p>
            </div>
          </div>

          {/* Navigation Tabs on Desktop / Tablet */}
          <div className="flex items-center gap-2 shrink-0">
            <nav
              id="header-navigation-desktop"
              className="hidden md:flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 text-xs font-semibold"
            >
              <button
                id="tab-btn-generator"
                onClick={() => onTabChange("generator")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "generator"
                    ? "bg-white text-indigo-700 shadow-xs border border-slate-200/60 font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Code QR</span>
              </button>

              <button
                id="tab-btn-shortener"
                onClick={() => onTabChange("shortener")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "shortener"
                    ? "bg-white text-indigo-700 shadow-xs border border-slate-200/60 font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Raccourcisseur</span>
              </button>

              <button onClick={() => onTabChange("password")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${activeTab === "password" ? "bg-white text-indigo-700" : "text-slate-600"}`}><KeyRound className="w-4 h-4" /> Mots de passe</button>

            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Ergonomic Bottom Tab Navigation (Natural Thumb Reach Zone) */}
      <nav
        id="mobile-bottom-nav"
        aria-label="Navigation mobile"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-2 py-1 pb-safe shadow-lg grid grid-cols-3 items-center"
      >
        <button
          onClick={() => onTabChange("generator")}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors ${
            activeTab === "generator" ? "text-indigo-600 font-bold" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span className="text-[10px] mt-0.5 tracking-tight">Code QR</span>
        </button>

        <button
          onClick={() => onTabChange("shortener")}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors ${
            activeTab === "shortener" ? "text-indigo-600 font-bold" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Link2 className="w-4 h-4" />
          <span className="text-[10px] mt-0.5 tracking-tight">Lien court</span>
        </button>

        <button onClick={() => onTabChange("password")} className={`flex flex-col items-center justify-center min-h-[44px] ${activeTab === "password" ? "text-indigo-600" : "text-slate-500"}`}><KeyRound className="w-4 h-4"/><span className="text-[10px]">Mot de passe</span></button>

      </nav>
    </>
  );
}
