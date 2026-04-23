"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Film, LogOut, Settings2, Users } from "lucide-react";
import { buttonVariants, cn } from "@movie-night/ui";
import { ThemeToggle } from "@/components/theme-toggle";

interface ProtectedHeaderProps {
  profile: {
    display_name: string;
  };
}

function navLinkClass(active: boolean) {
  return cn(
    "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors",
    active
      ? "bg-secondary text-foreground"
      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
  );
}

export function ProtectedHeader({ profile }: ProtectedHeaderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dashboardView = searchParams.get("view");

  const groupsActive =
    pathname.startsWith("/groups") ||
    (pathname === "/dashboard" && (!dashboardView || dashboardView === "groups"));
  const nightsActive =
    pathname.startsWith("/events") ||
    (pathname === "/dashboard" && dashboardView === "nights");

  return (
    <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link className="inline-flex items-center gap-2.5" href="/dashboard?view=groups">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Film className="h-4 w-4" />
            </span>
            <span className="hidden text-sm font-semibold tracking-tight text-foreground sm:inline">
              Movie Night Planner
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            <Link className={navLinkClass(groupsActive)} href="/dashboard?view=groups">
              <Users className="h-4 w-4" />
              <span>Groups</span>
            </Link>
            <Link className={navLinkClass(nightsActive)} href="/dashboard?view=nights">
              <Film className="h-4 w-4" />
              <span className="hidden sm:inline">Movie nights</span>
              <span className="sm:hidden">Nights</span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="hidden text-sm text-muted-foreground lg:inline">
            {profile.display_name}
          </span>
          <ThemeToggle />
          <Link
            aria-label="Open settings"
            className={cn(buttonVariants({ size: "sm", variant: "ghost" }), "h-9 w-9 px-0")}
            href="/settings"
          >
            <Settings2 className="h-4 w-4" />
          </Link>
          <form action="/auth/signout" method="post">
            <button
              aria-label="Sign out"
              className={cn(buttonVariants({ size: "sm", variant: "ghost" }), "h-9 w-9 px-0")}
              type="submit"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
