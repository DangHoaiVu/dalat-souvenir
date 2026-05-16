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
        "relative overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] shadow-[var(--shadow-sm)] backdrop-blur-xl",
        interactive && "transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-md)] hover:border-[color-mix(in_srgb,var(--color-accent)_34%,var(--glass-border))]",
        className
      )}
      {...props}
    >
      <div className="relative z-10 size-full">{children}</div>
    </motion.div>
  );
}
