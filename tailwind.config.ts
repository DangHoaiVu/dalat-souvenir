import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--color-bg)",
        "background-soft": "var(--color-bg-soft)",
        surface: "var(--color-surface)",
        "surface-muted": "var(--color-surface-muted)",
        "surface-hover": "var(--color-surface-hover)",
        border: "var(--color-border)",
        "border-focus": "var(--color-border-focus)",
        "border-hover": "var(--color-border-hover)",
        "border-strong": "var(--color-border-strong)",
        primary: {
          DEFAULT: "var(--color-text-primary)",
          foreground: "var(--color-surface)",
        },
        "primary-dark": "var(--color-accent-hover)",
        secondary: {
          DEFAULT: "var(--color-text-secondary)",
          foreground: "var(--color-surface)",
        },
        tertiary: "var(--color-text-tertiary)",
        disabled: "var(--color-text-disabled)",
        accent: {
          DEFAULT: "var(--color-accent)",
          foreground: "var(--color-surface)",
        },
        "accent-hover": "var(--color-accent-hover)",
        "accent-active": "var(--color-accent-active)",
        "accent-light": "var(--color-accent-light)",
        "accent-text": "var(--color-accent-text)",
        success: "var(--color-success)",
        "success-light": "var(--color-success-light)",
        "success-text": "var(--color-success-text)",
        warning: "var(--color-warning)",
        "warning-light": "var(--color-warning-light)",
        "warning-text": "var(--color-warning-text)",
        error: "var(--color-error)",
        "error-light": "var(--color-error-light)",
        "error-text": "var(--color-error-text)",
        foreground: "var(--color-text-primary)",
        card: {
          DEFAULT: "var(--color-surface)",
          foreground: "var(--color-text-primary)",
        },
        popover: {
          DEFAULT: "var(--color-surface)",
          foreground: "var(--color-text-primary)",
        },
        warm: {
          DEFAULT: "var(--color-warning)",
          foreground: "var(--color-warning-text)",
          light: "var(--color-warning-light)",
        },
        gold: {
          DEFAULT: "var(--color-warning)",
          light: "var(--color-warning-light)",
        },
        muted: {
          DEFAULT: "var(--color-surface-muted)",
          foreground: "var(--color-text-secondary)",
        },
        destructive: {
          DEFAULT: "var(--color-error)",
          foreground: "var(--color-surface)",
        },
        input: "var(--color-border)",
        ring: "var(--color-accent)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
        sm: "var(--radius)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        full: "9999px",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
        serif: ["var(--font-serif)"],
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        card: "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
      },
      animation: {
        "fade-in-up": "fadeInUp 0.5s ease-out forwards",
        "fade-in": "fadeIn 0.5s ease-out forwards",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
