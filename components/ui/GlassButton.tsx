"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

interface GlassButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children?: React.ReactNode;
  variant?: "primary" | "secondary" | "pill" | "icon";
}

export default function GlassButton({
  children,
  className,
  variant = "primary",
  ...props
}: GlassButtonProps) {
  const baseClasses = "relative inline-flex items-center justify-center overflow-hidden transition duration-200 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]";
  
  const variants = {
    primary: "rounded-xl border border-primary/20 bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/18 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/24",
    secondary: "rounded-xl border border-border bg-background/75 px-6 py-3 text-sm font-bold text-foreground shadow-sm backdrop-blur hover:border-primary/35 hover:bg-background",
    pill: "rounded-full border border-border bg-background/70 px-4 py-2 text-sm font-semibold text-foreground shadow-sm backdrop-blur hover:border-primary/35 hover:bg-background",
    icon: "flex size-10 items-center justify-center rounded-xl border border-border bg-background/70 text-foreground shadow-sm backdrop-blur hover:border-primary/35 hover:bg-background",
  };

  return (
    <motion.button
      className={cn(baseClasses, variants[variant], className)}
      whileTap={{ scale: 0.96 }}
      {...props}
    >
      <div className="relative z-10 flex items-center justify-center gap-2 w-full h-full">
        {children}
      </div>
    </motion.button>
  );
}
