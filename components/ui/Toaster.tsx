"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
  remaining: number;
  startedAt: number;
  paused: boolean;
}

// Global helper: call toast("message", "success" | "error" | "info") from anywhere
export function toast(message: string, type: ToastType = "success") {
  window.dispatchEvent(new CustomEvent("ww-toast", { detail: { message, type } }));
}

const DURATION_BY_TYPE: Record<ToastType, number> = {
  success: 3500,
  info: 3500,
  error: 6000, // errors need to be read
};

export default function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<number, number>>(new Map());

  const startTimer = useCallback((t: Toast) => {
    const id = window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== t.id));
      timersRef.current.delete(t.id);
    }, t.remaining);
    timersRef.current.set(t.id, id);
  }, []);

  const clearTimer = useCallback((id: number) => {
    const t = timersRef.current.get(id);
    if (t) {
      clearTimeout(t);
      timersRef.current.delete(id);
    }
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const { message, type } = (e as CustomEvent).detail as { message: string; type: ToastType };
      const id = Date.now() + Math.random();
      const duration = DURATION_BY_TYPE[type];
      const newToast: Toast = {
        id, message, type, duration,
        remaining: duration,
        startedAt: Date.now(),
        paused: false,
      };
      setToasts((prev) => [...prev, newToast]);
      // Start timer on next tick so state is settled
      setTimeout(() => startTimer(newToast), 0);
    };
    window.addEventListener("ww-toast", handler);
    return () => {
      window.removeEventListener("ww-toast", handler);
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current.clear();
    };
  }, [startTimer]);

  // Global Escape dismisses most recent toast
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && toasts.length > 0) {
        const latest = toasts[toasts.length - 1];
        dismiss(latest.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const dismiss = (id: number) => {
    clearTimer(id);
    setToasts((prev) => prev.filter((x) => x.id !== id));
  };

  const handleEnter = (t: Toast) => {
    // Pause: stop the countdown timer, remember how much time is left
    clearTimer(t.id);
    const elapsed = Date.now() - t.startedAt;
    setToasts((prev) =>
      prev.map((x) =>
        x.id === t.id ? { ...x, paused: true, remaining: Math.max(x.remaining - elapsed, 500) } : x
      )
    );
  };

  const handleLeave = (t: Toast) => {
    // Resume: start a fresh timer with the remaining time
    setToasts((prev) => {
      const updated = prev.map((x) =>
        x.id === t.id ? { ...x, paused: false, startedAt: Date.now() } : x
      );
      const target = updated.find((x) => x.id === t.id);
      if (target) setTimeout(() => startTimer(target), 0);
      return updated;
    });
  };

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-[#17824A]" />,
    error: <AlertTriangle className="w-4 h-4 text-[#B91C1C]" />,
    info: <Info className="w-4 h-4 text-[#F1622C]" />,
  };

  const accents = {
    success: "border-l-[#17824A]",
    error: "border-l-[#B91C1C]",
    info: "border-l-[#F1622C]",
  };

  return (
    <div
      role="region"
      aria-label="Notifications"
      className="fixed top-5 right-5 z-[100] flex flex-col gap-2 w-[340px] pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            role={t.type === "error" ? "alert" : "status"}
            aria-live={t.type === "error" ? "assertive" : "polite"}
            aria-atomic="true"
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onMouseEnter={() => handleEnter(t)}
            onMouseLeave={() => handleLeave(t)}
            className={`pointer-events-auto flex items-start gap-3 bg-white/95 backdrop-blur-xl border border-[#EAE6DF] border-l-4 ${accents[t.type]} rounded-xl px-4 py-3 shadow-[0_16px_40px_-12px_rgba(24,20,15,0.2)]`}
          >
            <div className="shrink-0 mt-0.5">{icons[t.type]}</div>
            <p className="flex-1 text-[13px] font-medium text-[#18140F] leading-snug">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="shrink-0 p-1 rounded-md hover:bg-[#F1EEE8] text-[#B3AC9F] hover:text-[#18140F] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F1622C]/40"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}