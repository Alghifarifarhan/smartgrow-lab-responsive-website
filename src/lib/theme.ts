import type { ThemeConfig } from "@/types";

export interface ThemePreset {
  id: string;
  name: string;
  subtitle: string;
  colors: [string, string, string, string, string];
  theme: ThemeConfig;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "sunset-orange",
    name: "Sunset Orange",
    subtitle: "Orange & Dark Slate",
    colors: ["#EA580C", "#FFFFFF", "#1E293B", "#0F172A", "#64748B"],
    theme: {
      presetId: "sunset-orange",
      primary: "#EA580C",
      darkBg: "#0F172A",
      lightBg: "#FFF7ED",
      textDark: "#0F172A",
      textMedium: "#334155",
      textLight: "#64748B",
    },
  },
  {
    id: "ocean-blue",
    name: "Ocean Blue",
    subtitle: "Blue & Navy Night",
    colors: ["#2196F3", "#FFFFFF", "#1E293B", "#0B0F12", "#3B82F6"],
    theme: {
      presetId: "ocean-blue",
      primary: "#2196F3",
      darkBg: "#0B0F12",
      lightBg: "#F8F8F8",
      textDark: "#111827",
      textMedium: "#374151",
      textLight: "#6B7280",
    },
  },
  {
    id: "royal-purple",
    name: "Royal Purple",
    subtitle: "Violet & Deep Indigo",
    colors: ["#8B5CF6", "#FFFFFF", "#1E1B4B", "#0F172A", "#A855F7"],
    theme: {
      presetId: "royal-purple",
      primary: "#8B5CF6",
      darkBg: "#0F172A",
      lightBg: "#FAF5FF",
      textDark: "#1E1B4B",
      textMedium: "#4C1D95",
      textLight: "#7C3AED",
    },
  },
  {
    id: "emerald-green",
    name: "Emerald Green",
    subtitle: "Emerald & Forest Green",
    colors: ["#10B981", "#FFFFFF", "#064E3B", "#022C22", "#34D399"],
    theme: {
      presetId: "emerald-green",
      primary: "#10B981",
      darkBg: "#022C22",
      lightBg: "#F0FDF4",
      textDark: "#064E3B",
      textMedium: "#047857",
      textLight: "#10B981",
    },
  },
  {
    id: "golden-amber",
    name: "Golden Amber",
    subtitle: "Gold & Dark Obsidian",
    colors: ["#EAB308", "#FEFCE8", "#0A0A0A", "#171717", "#474747"],
    theme: {
      presetId: "golden-amber",
      primary: "#EAB308",
      darkBg: "#0A0A0A",
      lightBg: "#FEFCE8",
      textDark: "#171717",
      textMedium: "#262626",
      textLight: "#474747",
    },
  },
];

export const DEFAULT_THEME: ThemeConfig = {
  presetId: "ocean-blue",
  primary: "#2196F3",
  darkBg: "#0B0F12",
  lightBg: "#F8F8F8",
  textDark: "#111827",
  textMedium: "#374151",
  textLight: "#6B7280",
};

/**
 * Apply theme to document element CSS custom properties
 */
export function applyTheme(theme?: ThemeConfig | null) {
  if (typeof document === "undefined") return;
  const t = theme || DEFAULT_THEME;
  const root = document.documentElement;

  if (t.primary) root.style.setProperty("--primary", t.primary);
  if (t.darkBg) root.style.setProperty("--bg-dark", t.darkBg);
  if (t.lightBg) root.style.setProperty("--bg-light", t.lightBg);
  if (t.textDark) root.style.setProperty("--text-dark", t.textDark);
  if (t.textMedium) root.style.setProperty("--text-medium", t.textMedium);
  if (t.textLight) root.style.setProperty("--text-light", t.textLight);
}

/**
 * Read cached theme from localStorage safely
 */
export function getStoredTheme(): ThemeConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("site_theme");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Save theme to localStorage and apply immediately
 */
export function setStoredTheme(theme: ThemeConfig) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("site_theme", JSON.stringify(theme));
  } catch (e) {
    console.error("Failed to save theme in localStorage:", e);
  }
  applyTheme(theme);
}

