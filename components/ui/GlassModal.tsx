"use client";

import { ReactNode, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import GlassOverlay from "./GlassOverlay";

interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export default function GlassModal({ isOpen, onClose, children, className = "" }: GlassModalProps) {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  return (
    <>
      <GlassOverlay isOpen={isOpen} onClick={onClose} zIndex={1000} />
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[1001] flex items-end justify-center p-0 pointer-events-none sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className={`relative max-h-[92svh] w-full max-w-[860px] overflow-y-auto rounded-t-xl border border-[--color-border] bg-surface text-primary shadow-lg pointer-events-auto custom-scrollbar sm:max-h-[85vh] sm:w-[92vw] sm:rounded-xl ${className}`}
            >
              <button
                onClick={onClose}
                className="absolute right-3 top-3 z-50 flex size-10 items-center justify-center rounded-md border border-[--color-border] bg-surface/90 text-primary shadow-sm backdrop-blur transition hover:border-[--color-border-hover] hover:bg-surface-muted sm:right-4 sm:top-4"
                aria-label="Đóng"
              >
                <X className="size-5" />
              </button>
              {children}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
