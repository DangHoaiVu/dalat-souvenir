"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label="Chuyển đổi chế độ sáng/tối"
      className="ml-2 flex items-center gap-1 rounded px-2 py-1 text-sm font-medium hover:bg-muted/50"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? (
        <>
          <Sun className="size-4" />
          <span>Light</span>
        </>
      ) : (
        <>
          <Moon className="size-4" />
          <span>Dark</span>
        </>
      )}
    </button>
  );
}
