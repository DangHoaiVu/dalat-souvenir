"use client";

import { Cat, Gift, Heart, Leaf, Sparkles, TreePine } from "lucide-react";

export function AuthBackgroundDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, var(--color-border-hover) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="absolute left-8 top-10 hidden rotate-[-10deg] items-center gap-2 rounded-full border border-sky-200 bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-sky-600 shadow-sm backdrop-blur sm:flex">
        <TreePine className="size-4" />
        Da Lat souvenir
      </div>

      <div className="absolute right-10 top-24 hidden rotate-[8deg] items-center gap-2 rounded-full border border-sky-200 bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-sky-600 shadow-sm backdrop-blur lg:flex">
        <Gift className="size-4" />
        Qua tang nho
      </div>

      <TreePine className="absolute bottom-16 left-12 size-28 -rotate-12 text-sky-300/25 sm:size-36" aria-hidden="true" />
      <Leaf className="absolute left-[18%] top-[32%] hidden size-16 rotate-12 text-emerald-300/30 sm:block" aria-hidden="true" />
      <Heart className="absolute bottom-[22%] right-[18%] size-20 rotate-12 text-sky-300/25" aria-hidden="true" />
      <Sparkles className="absolute right-[22%] top-[18%] hidden size-14 -rotate-12 text-amber-300/35 md:block" aria-hidden="true" />

      <div className="absolute bottom-10 left-1/2 hidden -translate-x-1/2 select-none text-center text-5xl font-black uppercase tracking-[0.24em] text-sky-500/[0.06] sm:block lg:text-7xl">
        lovehoaivulover
      </div>
    </div>
  );
}

export function AuthCardMascot() {
  return (
    <div className="pointer-events-none absolute -right-9 -top-12 z-20 hidden sm:block">
      <div className="relative">
        <div className="absolute left-2 top-14 h-8 w-6 rotate-[-18deg] rounded-full border border-sky-200 bg-white shadow-sm" />
        <div className="absolute right-2 top-14 h-8 w-6 rotate-[18deg] rounded-full border border-sky-200 bg-white shadow-sm" />
        <div className="grid size-20 place-items-center rounded-full border border-sky-200 bg-white text-sky-600 shadow-lg">
          <Cat className="size-10" strokeWidth={1.8} />
        </div>
      </div>
    </div>
  );
}
