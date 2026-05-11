"use client";

import { useEffect } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";
import { useUIStore } from "@/lib/store/uiStore";

export default function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-xs w-full">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onRemove={removeToast} />
      ))}
    </div>
  );
}

function Toast({
  id,
  message,
  type,
  onRemove,
}: {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  onRemove: (id: string) => void;
}) {
  useEffect(() => {
    const t = setTimeout(() => onRemove(id), 4000);
    return () => clearTimeout(t);
  }, [id, onRemove]);

  const Icon = type === "success" ? CheckCircle : type === "error" ? XCircle : Info;
  const colour =
    type === "success"
      ? "bg-green-600"
      : type === "error"
      ? "bg-red-600"
      : "bg-[var(--color-accent)]";

  return (
    <div className={`${colour} text-white rounded-lg shadow-lg px-4 py-3 flex items-start gap-3 text-sm`}>
      <Icon size={16} className="mt-0.5 flex-shrink-0" />
      <span className="flex-1">{message}</span>
      <button onClick={() => onRemove(id)} className="flex-shrink-0 opacity-70 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
}
