import { useState, useEffect } from "react";
import {
  Database,
  Cloud,
  Check,
  Copy,
  Terminal,
  ExternalLink,
  ShieldCheck,
  Zap,
  Server,
  Code2,
  RefreshCw,
} from "lucide-react";

interface DeploymentGuideProps {
  onToast: (type: "success" | "error" | "info", text: string) => void;
}

const SQL_SCHEMA = `-- Copiez ce script et exécutez-le dans Supabase SQL Editor ou Neon Console :
CREATE TABLE IF NOT EXISTS links (
    id VARCHAR(64) PRIMARY KEY,
    original_url TEXT NOT NULL,
    short_code VARCHAR(64) UNIQUE NOT NULL,
    title VARCHAR(255),
    clicks INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_clicked_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_links_short_code ON links (short_code);
CREATE INDEX IF NOT EXISTS idx_links_created_at ON links (created_at DESC);`;

export function DeploymentGuide({ onToast }: DeploymentGuideProps) {
  const [activePlatform, setActivePlatform] = useState<"vercel" | "netlify">("vercel");
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [dbStatus, setDbStatus] = useState<{
    database?: string;
    linksCount?: number;
    loading: boolean;
  }>({ loading: true });

  const checkDbStatus = async () => {
    setDbStatus((prev) => ({ ...prev, loading: true }));
    try {
      const res = await fetch("/api/health");
      if (res.ok) {
        const data = await res.json();
        setDbStatus({
          database: data.database,
          linksCount: data.linksCount,
          loading: false,
        });
      } else {
        setDbStatus({ loading: false });
      }
    } catch {
      setDbStatus({ loading: false });
    }
  };

  useEffect(() => {
    checkDbStatus();
  }, []);

  const handleCopy = async (text: string, type: "sql" | "env") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "sql") {
        setCopiedSql(true);
        setTimeout(() => setCopiedSql(false), 2000);
      } else {
        setCopiedEnv(true);
        setTimeout(() => setCopiedEnv(false), 2000);
      }
      onToast("success", "Copié dans le presse-papier !");
    } catch {
      onToast("info", "Veuillez copier manuellement.");
    }
  };

  return (
    <div id="deployment-guide-root" className="max-w-5xl mx-auto flex flex-col gap-8">
      {/* Current DB Status Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                État du stockage de données
              </h2>
              {dbStatus.loading ? (
                <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin" />
              ) : (
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    dbStatus.database === "postgresql"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {dbStatus.database === "postgresql"
                    ? "PostgreSQL Connecté"
                    : "Fichier Local (prêt pour migration PostgreSQL)"}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {dbStatus.database === "postgresql"
                ? "Vos liens et statistiques sont persistés en base de données SQL relationnelle."
                : "Les données sont temporairement stockées localement. Activez Netlify Database ou définissez DATABASE_URL avant le déploiement."}
            </p>
          </div>
        </div>

        <button
          onClick={checkDbStatus}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors self-end sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          Actualiser l'état
        </button>
      </div>

      {/* Platform Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Guide de déploiement Cloud & Base de données
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            L'application est déjà pré-configurée avec les fichiers Vercel et Netlify.
          </p>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActivePlatform("vercel")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activePlatform === "vercel"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Vercel (Recommandé)
          </button>
          <button
            onClick={() => setActivePlatform("netlify")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activePlatform === "netlify"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Netlify
          </button>
        </div>
      </div>

      {/* Step by step deployment */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Steps */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Step 1: Database Setup */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                1
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                Créer la base de données PostgreSQL gratuite
              </h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pour Vercel et Netlify, vous avez le choix entre plusieurs fournisseurs PostgreSQL gratuits et performants :
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-1">
              <a
                href="https://neon.tech"
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50/60 flex flex-col gap-1 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">
                    Neon.tech
                  </span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </div>
                <span className="text-[11px] text-slate-500">
                  Postgres serverless gratuit, connexion en 30 sec.
                </span>
              </a>

              <a
                href="https://supabase.com"
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50/60 flex flex-col gap-1 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">
                    Supabase
                  </span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </div>
                <span className="text-[11px] text-slate-500">
                  Dashboard visuel puissant avec éditeur SQL intégré.
                </span>
              </a>

              <a
                href="https://vercel.com/storage/postgres"
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50/60 flex flex-col gap-1 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">
                    Vercel Postgres
                  </span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </div>
                <span className="text-[11px] text-slate-500">
                  Intégration directe dans le tableau de bord Vercel.
                </span>
              </a>
            </div>
            <p className="text-xs text-slate-500">
              💡 <em>L'application crée automatiquement la table lors de la première connexion</em>, mais vous pouvez également copier le script SQL ci-contre.
            </p>
          </div>

          {/* Step 2: Push code or Connect Repo */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                2
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                Exporter et connecter le projet à GitHub
              </h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dans le menu en haut à droite d'AI Studio, cliquez sur <strong>Export to GitHub</strong> ou téléchargez le ZIP pour créer un dépôt sur votre compte GitHub.
            </p>
          </div>

          {/* Step 3: Deploy on Platform */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                3
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                Déployer sur {activePlatform === "vercel" ? "Vercel" : "Netlify"}
              </h4>
            </div>
            {activePlatform === "vercel" ? (
              <ol className="list-decimal list-inside text-xs text-slate-600 space-y-2 leading-relaxed">
                <li>
                  Rendez-vous sur <a href="https://vercel.com/new" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-medium">vercel.com/new</a> et importez votre dépôt GitHub.
                </li>
                <li>
                  Le framework est automatiquement détecté comme <strong>Vite</strong>.
                </li>
                <li>
                  Dans la section <strong>Environment Variables</strong>, ajoutez :
                  <ul className="list-disc list-inside ml-4 mt-1 font-mono text-[11px] text-slate-700 space-y-1">
                    <li><code>DATABASE_URL</code> = votre chaîne de connexion PostgreSQL</li>
                    <li><code>APP_URL</code> = (optionnel) l'URL de votre domaine Vercel</li>
                  </ul>
                </li>
                <li>
                  Cliquez sur <strong>Deploy</strong>. Le fichier <code>vercel.json</code> et les Serverless Functions <code>/api</code> et <code>/s/*</code> s'occupent de tout !
                </li>
              </ol>
            ) : (
              <ol className="list-decimal list-inside text-xs text-slate-600 space-y-2 leading-relaxed">
                <li>
                  Rendez-vous sur <a href="https://app.netlify.com/start" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-medium">app.netlify.com/start</a> et importez le dépôt GitHub.
                </li>
                <li>
                  Les paramètres de build sont lus automatiquement depuis <code>netlify.toml</code>.
                </li>
                <li>
                  Dans <strong>Site configuration &gt; Environment variables</strong>, ajoutez :
                  <ul className="list-disc list-inside ml-4 mt-1 font-mono text-[11px] text-slate-700 space-y-1">
                    <li><code>DATABASE_URL</code> = votre chaîne de connexion PostgreSQL</li>
                  </ul>
                </li>
                <li>
                  Cliquez sur <strong>Deploy site</strong>. Netlify Functions redirigera les requêtes <code>/s/:code</code> en 302 instantanément.
                </li>
              </ol>
            )}
          </div>
        </div>

        {/* Right Column: Code snippets & Ready-to-copy tools */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* SQL Schema Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-indigo-600" />
                Script SQL (schema.sql)
              </span>
              <button
                onClick={() => handleCopy(SQL_SCHEMA, "sql")}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-all"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    Copié
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copier SQL
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto leading-relaxed max-h-56">
              {SQL_SCHEMA}
            </pre>
          </div>

          {/* Environment Variables Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-indigo-600" />
                Variables d'environnement (.env)
              </span>
              <button
                onClick={() =>
                  handleCopy(
                    `DATABASE_URL="postgresql://username:password@ep-example.neon.tech/neondb?sslmode=require"\nAPP_URL="https://mon-app.vercel.app"`,
                    "env"
                  )
                }
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-all"
              >
                {copiedEnv ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    Copié
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copier .env
                  </>
                )}
              </button>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto leading-relaxed">
              <p className="text-slate-400"># PostgreSQL (Neon, Supabase, Vercel)</p>
              <p className="text-emerald-400">DATABASE_URL="postgresql://..."</p>
              <p className="text-slate-400 mt-2"># Domaine en production (optionnel)</p>
              <p className="text-emerald-400">APP_URL="https://mon-app.vercel.app"</p>
            </div>
          </div>

          {/* Architecture verification info */}
          <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100 text-xs text-slate-600 flex flex-col gap-2">
            <span className="font-bold text-indigo-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Fichiers déjà prêts dans le projet
            </span>
            <ul className="space-y-1 font-mono text-[11px] text-slate-700">
              <li>• <code>vercel.json</code> : configuration rewrites Vercel</li>
              <li>• <code>api/index.ts</code> : Serverless Function Vercel</li>
              <li>• <code>netlify.toml</code> : configuration redirects Netlify</li>
              <li>• <code>netlify/functions/server.ts</code> : Fonction Netlify</li>
              <li>• <code>server/db.ts</code> : adaptateur PostgreSQL auto-migrant</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
