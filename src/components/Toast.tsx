import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  text: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      id="toast-container"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          id={`toast-${toast.id}`}
          className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all transform animate-in fade-in slide-in-from-bottom-3 ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : toast.type === "error"
              ? "bg-rose-50 text-rose-900 border-rose-200"
              : "bg-indigo-50 text-indigo-900 border-indigo-200"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === "success" && (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            )}
            {toast.type === "error" && (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            {toast.type === "info" && (
              <Info className="w-5 h-5 text-indigo-600 shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
          <button
            id={`dismiss-toast-${toast.id}`}
            onClick={() => onDismiss(toast.id)}
            className="p-1 rounded-lg hover:bg-black/5 text-slate-500 hover:text-slate-800 transition-colors"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
