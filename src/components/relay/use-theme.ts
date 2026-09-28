import { useEffect, useState } from "react";

const THEME_KEY = "yizhan-theme";
export type ThemeId = "night" | "day";

export function useTheme() {
  const [theme, setTheme] = useState<ThemeId>("night");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "day" || saved === "night") setTheme(saved);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme, ready]);

  return { theme, setTheme };
}
