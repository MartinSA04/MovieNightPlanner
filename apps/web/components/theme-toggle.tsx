"use client";

import { useEffect, useState } from "react";
import { MoonStar, SunMedium } from "lucide-react";
import { cn } from "@movie-night/ui";

type ThemeMode = "light" | "dark";

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.dataset.theme = theme;
  localStorage.setItem("theme", theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const rootTheme = document.documentElement.dataset.theme;

    if (rootTheme === "dark" || rootTheme === "light") {
      setTheme(rootTheme);
    } else {
      setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    }

    setReady(true);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <button
      aria-label={ready ? (theme === "dark" ? "Switch to light mode" : "Switch to dark mode") : "Toggle theme"}
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white/90 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-900 hover:bg-slate-50 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
      )}
      onClick={toggleTheme}
      type="button"
    >
      {theme === "dark" ? <SunMedium className="h-5 w-5" /> : <MoonStar className="h-5 w-5" />}
      <span className="sr-only">
        {ready ? (theme === "dark" ? "Light mode" : "Dark mode") : "Theme"}
      </span>
    </button>
  );
}
