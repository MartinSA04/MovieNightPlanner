import Link from "next/link";
import type { ReactNode } from "react";
import { Film } from "lucide-react";
import { cn } from "@movie-night/ui";
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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link className="inline-flex items-center gap-2.5" href="/">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Film className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold tracking-tight text-foreground">
                Movie Night Planner
              </span>
            </Link>

            {menu.length > 0 ? (
              <nav className="hidden items-center gap-1 sm:flex">
                {menu.map((item) => (
                  <Link
                    key={`${item.href}-${item.label}`}
                    className={cn(
                      "inline-flex h-9 items-center rounded-md px-3 text-sm font-medium transition-colors",
                      item.active
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {actions}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {title || subtitle ? (
          <section className="mb-8 max-w-2xl space-y-2">
            {title ? (
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-[32px]">
                {title}
              </h1>
            ) : null}
            {subtitle ? (
              <p className="text-base text-muted-foreground">{subtitle}</p>
            ) : null}
          </section>
        ) : null}

        <div className="space-y-6">{children}</div>
      </main>
    </div>
  );
}
