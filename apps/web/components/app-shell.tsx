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
      <header className="sticky top-0 z-10 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
              <Link className="inline-flex items-center gap-3" href="/">
                <span className="rounded-lg bg-primary p-2 text-primary-foreground">
                  <Film className="h-6 w-6" />
                </span>
                <span className="text-base font-semibold tracking-tight text-foreground">
                  Movie Night Planner
                </span>
              </Link>

              {menu.length > 0 ? (
                <nav className="flex flex-wrap gap-2">
                  {menu.map((item) => (
                    <Link
                      key={`${item.href}-${item.label}`}
                      className={cn(
                        "inline-flex min-h-11 items-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors sm:min-h-12",
                        item.active
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      )}
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
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {title || subtitle ? (
          <section className="mb-8 max-w-3xl space-y-2">
            {title ? <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1> : null}
            {subtitle ? <p className="text-sm text-muted-foreground sm:text-base">{subtitle}</p> : null}
          </section>
        ) : null}

        <div className="space-y-6">{children}</div>
      </main>
    </div>
  );
}
