"use client";

import React, { ReactNode } from "react";
import LiquidGlass from "liquid-glass-react";

interface LiquidGlassPanelProps extends Partial<any> {
  children?: ReactNode;
  variant?: "hero" | "navbar" | "card" | "modal" | "custom";
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
  
  const presets: Record<string, any> = {
    hero: {
      displacementScale: 65,
      blurAmount: 0.6,
      saturation: 140,
      aberrationIntensity: 1.5,
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
  
  return (
    <div className={`relative ${className} ${interactive ? "transition-all duration-300 hover:scale-[1.01]" : ""}`}>
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
        className="pointer-events-none absolute inset-0 z-0 bg-white/40 dark:bg-[#0F1115]/60" 
        style={{ borderRadius: "inherit" }} 
      />

      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}
