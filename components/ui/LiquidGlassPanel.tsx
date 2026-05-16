"use client";

import React, { ReactNode } from "react";
import { motion } from "framer-motion";
import LiquidGlass from "liquid-glass-react";

type LiquidGlassMode = "standard" | "polar" | "prominent" | "shader";
type LiquidGlassVariant = "hero" | "navbar" | "card" | "modal" | "custom";

interface LiquidGlassOptions {
  displacementScale?: number;
  blurAmount?: number;
  saturation?: number;
  aberrationIntensity?: number;
  elasticity?: number;
  cornerRadius?: number;
  mode?: LiquidGlassMode;
  overLight?: boolean;
}

interface LiquidGlassPanelProps extends LiquidGlassOptions {
  children?: ReactNode;
  variant?: LiquidGlassVariant;
  className?: string;
  interactive?: boolean;
}

export default function LiquidGlassPanel({
  children,
  variant = "custom",
  className = "",
  interactive = false,
  ...props
}: LiquidGlassPanelProps) {
  
  const presets: Record<LiquidGlassVariant, LiquidGlassOptions> = {
    hero: {
      displacementScale: 42,
      blurAmount: 0.28,
      saturation: 132,
      aberrationIntensity: 0.75,
      elasticity: 0.25,
      cornerRadius: 36,
      mode: "polar",
      overLight: true,
    },
    navbar: {
      displacementScale: 35,
      blurAmount: 0.4,
      saturation: 130,
      aberrationIntensity: 1.0,
      elasticity: 0.15,
      cornerRadius: 28,
      mode: "standard",
      overLight: true,
    },
    card: {
      displacementScale: 30,
      blurAmount: 0.35,
      saturation: 120,
      aberrationIntensity: 0.6,
      elasticity: 0.12,
      cornerRadius: 28,
      mode: "standard",
    },
    modal: {
      displacementScale: 55,
      blurAmount: 0.6,
      saturation: 130,
      aberrationIntensity: 1.0,
      elasticity: 0.18,
      cornerRadius: 32,
      mode: "standard",
      overLight: true,
    },
    custom: {},
  };

  const selectedPreset = presets[variant];
  const isHero = variant === "hero";
  const tintClass = isHero
    ? "bg-[var(--color-glass)] opacity-10"
    : "bg-[var(--color-glass)]";
  
  return (
    <motion.div
      initial={isHero ? { opacity: 0, y: 18 } : false}
      animate={isHero ? { opacity: 1, y: 0 } : undefined}
      transition={isHero ? { duration: 0.45, ease: [0.22, 1, 0.36, 1] } : undefined}
      className={`relative ${className} ${interactive ? "transition-all duration-300 hover:scale-[1.01]" : ""}`}
    >
      <div className="absolute inset-0 z-0">
        <LiquidGlass
          displacementScale={props.displacementScale ?? selectedPreset.displacementScale}
          blurAmount={props.blurAmount ?? selectedPreset.blurAmount}
          saturation={props.saturation ?? selectedPreset.saturation}
          aberrationIntensity={props.aberrationIntensity ?? selectedPreset.aberrationIntensity}
          elasticity={props.elasticity ?? selectedPreset.elasticity}
          cornerRadius={props.cornerRadius ?? selectedPreset.cornerRadius}
          mode={props.mode ?? selectedPreset.mode}
          overLight={props.overLight ?? selectedPreset.overLight}
          {...props}
        />
      </div>
      
      {/* Uniform Tint Layer for Readability */}
      <div 
        className={`pointer-events-none absolute inset-0 z-0 ${tintClass}`}
        style={{ borderRadius: "inherit" }} 
      />

      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </motion.div>
  );
}
