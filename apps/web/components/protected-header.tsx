"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Bookmark, Film, Users } from "lucide-react";
import { cn } from "@movie-night/ui";
import { ProfileMenu } from "@/components/profile-menu";

interface ProtectedHeaderProps {
  profile: {
    avatar_url: string | null;
    display_name: string;
    email: string;
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
  const watchlistActive = pathname.startsWith("/watchlist");

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
            <Link className={navLinkClass(watchlistActive)} href="/watchlist?view=watchlist">
              <Bookmark className="h-4 w-4" />
              <span>Watchlist</span>
            </Link>
          </nav>
        </div>

        <ProfileMenu
          avatarUrl={profile.avatar_url}
          displayName={profile.display_name}
          email={profile.email}
        />
      </div>
    </header>
  );
}
