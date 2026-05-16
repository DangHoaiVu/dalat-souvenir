"use client";

import React, { ReactNode, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlassOverlay from "./GlassOverlay";
import { X } from "lucide-react";

import LiquidGlassPanel from "./LiquidGlassPanel";

interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export default function GlassModal({ isOpen, onClose, children, className = "" }: GlassModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  return (
    <>
      <GlassOverlay isOpen={isOpen} onClick={onClose} zIndex={1000} />
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[1001] flex items-center justify-center pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className={`relative pointer-events-auto w-[92vw] max-w-[860px] max-h-[85vh] overflow-y-auto custom-scrollbar rounded-3xl border border-border/70 bg-card/80 shadow-[var(--shadow-lg)] ${className}`}
            >
              <LiquidGlassPanel variant="modal" className="w-full h-full min-h-[400px]">
                <button
                  onClick={onClose}
                  className="absolute right-5 top-5 z-50 flex size-10 items-center justify-center rounded-xl border border-border bg-background/75 text-foreground shadow-sm backdrop-blur transition hover:border-primary/35 hover:bg-background"
                  aria-label="Đóng"
                >
                  <X className="size-5" />
                </button>
                {children}
              </LiquidGlassPanel>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
