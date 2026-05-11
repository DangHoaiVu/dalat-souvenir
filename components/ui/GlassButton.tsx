"use client";

import React, { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

interface GlassButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "pill" | "icon";
}

export default function GlassButton({
  children,
  className,
  variant = "primary",
  ...props
}: GlassButtonProps) {
  const baseClasses = "relative inline-flex items-center justify-center overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";
  
  const variants = {
    primary: "bg-gradient-to-r from-primary/80 to-primary/90 text-white backdrop-blur-md border border-white/20 shadow-lg shadow-primary/20 rounded-full px-8 py-3.5 font-bold tracking-wider uppercase text-sm hover:shadow-xl hover:shadow-primary/30 hover:bg-primary",
    secondary: "bg-white/40 text-foreground backdrop-blur-lg border border-white/50 shadow-sm rounded-full px-8 py-3.5 font-bold tracking-wider uppercase text-sm hover:bg-white/60 hover:border-white/70",
    pill: "bg-white/30 text-foreground backdrop-blur-md border border-white/40 rounded-full px-4 py-2 text-sm font-semibold hover:bg-white/50",
    icon: "bg-white/30 text-foreground backdrop-blur-md border border-white/40 rounded-full size-10 hover:bg-white/50 flex items-center justify-center",
  };

  return (
    <motion.button
      className={cn(baseClasses, variants[variant], className)}
      whileTap={{ scale: 0.96 }}
      {...props}
    >
      <div className="relative z-10 flex items-center justify-center gap-2 w-full h-full">
        {children as any}
      </div>
      {/* Light blob effect on hover for primary */}
      {variant === "primary" && (
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-150%] hover:animate-[shimmer_1.5s_infinite]" />
      )}
    </motion.button>
  );
}
