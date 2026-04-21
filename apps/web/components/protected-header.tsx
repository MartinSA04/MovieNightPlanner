"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Calendar, Film, LogOut, Settings2, Users } from "lucide-react";
import { buttonVariants, cn } from "@movie-night/ui";
import { ThemeToggle } from "@/components/theme-toggle";

interface ProtectedHeaderProps {
  profile: {
    display_name: string;
  };
}

function navLinkClass(active: boolean) {
  return cn(
    "inline-flex min-h-11 items-center gap-2 rounded-lg px-4 py-2.5 font-medium transition-colors sm:min-h-12",
    active
      ? "bg-primary text-primary-foreground"
      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
  );
}

export function ProtectedHeader({ profile }: ProtectedHeaderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dashboardView = searchParams.get("view");

  const groupsActive =
    pathname.startsWith("/groups") || (pathname === "/dashboard" && (!dashboardView || dashboardView === "groups"));
  const nightsActive =
    pathname.startsWith("/events") || (pathname === "/dashboard" && dashboardView === "nights");
  const upcomingActive = pathname === "/dashboard" && dashboardView === "upcoming";

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
            <Link className="inline-flex items-center gap-3" href="/dashboard?view=groups">
              <span className="rounded-lg bg-primary p-2 text-primary-foreground">
                <Film className="h-6 w-6" />
              </span>
              <span className="text-base font-semibold tracking-tight text-foreground">
                Movie Night Planner
              </span>
            </Link>

            <nav className="flex flex-wrap gap-2">
              <Link className={navLinkClass(groupsActive)} href="/dashboard?view=groups">
                <Users className="h-4 w-4" />
                Groups
              </Link>
              <Link className={navLinkClass(nightsActive)} href="/dashboard?view=nights">
                <Film className="h-4 w-4" />
                Movie nights
              </Link>
              <Link className={navLinkClass(upcomingActive)} href="/dashboard?view=upcoming">
                <Calendar className="h-4 w-4" />
                Upcoming
              </Link>
            </nav>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <p className="hidden text-sm text-muted-foreground lg:block">{profile.display_name}</p>
            <ThemeToggle />
            <Link
              aria-label="Open settings"
              className={cn(buttonVariants({ size: "sm", variant: "secondary" }), "h-11 w-11 px-0")}
              href="/settings"
            >
              <Settings2 className="h-4 w-4" />
            </Link>
            <form action="/auth/signout" method="post">
              <button
                aria-label="Sign out"
                className={cn(buttonVariants({ size: "sm", variant: "secondary" }), "h-11 w-11 px-0")}
                type="submit"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
