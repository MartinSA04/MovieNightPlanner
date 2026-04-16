import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

interface MenuItem {
  active?: boolean;
  href: string;
  label: string;
}

interface AppShellProps {
  actions?: ReactNode;
  children: ReactNode;
  menu?: MenuItem[];
  subtitle?: string;
  title?: string;
}

export function AppShell({
  actions,
  children,
  menu = [],
  subtitle,
  title
}: AppShellProps) {
  return (
    <main className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6">
        <header className="rounded-3xl border border-slate-200 bg-white/95 px-4 py-4 shadow-sm backdrop-blur sm:px-6 dark:border-slate-800 dark:bg-slate-950/95">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
              <Link
                className="text-base font-semibold tracking-tight text-slate-950 dark:text-white"
                href="/"
              >
                Movie Night Planner
              </Link>
              {menu.length > 0 ? (
                <nav className="flex flex-wrap gap-2 text-sm text-slate-600 dark:text-slate-300">
                  {menu.map((item) => (
                    <Link
                      key={`${item.href}-${item.label}`}
                      className={`rounded-full px-3 py-1.5 transition ${
                        item.active
                          ? "bg-slate-900 text-white dark:bg-amber-300 dark:text-slate-950"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                      }`}
                      href={item.href}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ThemeToggle />
              {actions}
            </div>
          </div>
          {title || subtitle ? (
            <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
              {title ? (
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                  {title}
                </h1>
              ) : null}
              {subtitle ? (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{subtitle}</p>
              ) : null}
            </div>
          ) : null}
        </header>
        <div className="flex flex-col gap-6">{children}</div>
      </div>
    </main>
  );
}
