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

export function AppearanceSetting() {
  const [theme, setTheme] = useState<ThemeMode>("dark");
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

  function selectTheme(next: ThemeMode) {
    if (next === theme) return;
    setTheme(next);
    applyTheme(next);
  }

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Appearance
          </h2>
          <p className="text-sm text-muted-foreground">
            Choose between light and dark mode for this device.
          </p>
        </div>

        <div
          aria-label="Theme"
          className="inline-flex shrink-0 rounded-lg border border-border/60 bg-secondary/40 p-0.5"
          role="radiogroup"
        >
          <button
            aria-checked={theme === "light"}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition",
              theme === "light"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            disabled={!ready}
            onClick={() => selectTheme("light")}
            role="radio"
            type="button"
          >
            <SunMedium className="h-4 w-4" />
            Light
          </button>
          <button
            aria-checked={theme === "dark"}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition",
              theme === "dark"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            disabled={!ready}
            onClick={() => selectTheme("dark")}
            role="radio"
            type="button"
          >
            <MoonStar className="h-4 w-4" />
            Dark
          </button>
        </div>
      </div>
    </section>
  );
}
