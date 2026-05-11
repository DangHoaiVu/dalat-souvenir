"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface GlassOverlayProps {
  isOpen: boolean;
  onClick?: () => void;
  zIndex?: number;
}

export default function GlassOverlay({ isOpen, onClick, zIndex = 999 }: GlassOverlayProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/35 backdrop-blur-md"
          style={{ zIndex }}
          onClick={onClick}
          aria-hidden="true"
        />
      )}
    </AnimatePresence>
  );
}
