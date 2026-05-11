"use client";

import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  interactive?: boolean;
}

export default function GlassCard({
  children,
  className,
  interactive = false,
  ...props
}: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        "relative overflow-hidden bg-[var(--glass-bg)] backdrop-blur-2xl border border-[var(--glass-border)] shadow-sm ring-1 ring-white/10 dark:ring-white/5 rounded-[28px]",
        interactive && "transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-xl hover:border-white/50 dark:hover:border-white/20",
        className
      )}
      {...props}
    >
      <div className="relative z-10 size-full">{children}</div>
    </motion.div>
  );
}
