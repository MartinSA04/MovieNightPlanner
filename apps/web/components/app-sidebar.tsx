"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Film,
  KeyRound,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings2,
  Users
} from "lucide-react";
import { cn } from "@movie-night/ui";
import { ThemeToggle } from "@/components/theme-toggle";

interface SidebarGroup {
  countryCode: string;
  id: string;
  name: string;
  role: "owner" | "admin" | "member";
}

interface AppSidebarProps {
  groups: SidebarGroup[];
  profile: {
    display_name: string;
    email: string;
  };
}

const SIDEBAR_COLLAPSED_KEY = "movie-night-sidebar-collapsed";
const SIDEBAR_GROUPS_OPEN_KEY = "movie-night-sidebar-groups-open";

function navItemClass(active: boolean, collapsed: boolean) {
  return cn(
    "flex min-h-11 items-center rounded-xl border text-[15px] font-medium transition sm:min-h-12",
    collapsed ? "justify-between px-3 py-3 lg:justify-center lg:px-2" : "justify-between px-4 py-3",
    active
      ? "border-violet-400/24 bg-violet-500 text-white shadow-[0_14px_36px_rgba(139,92,246,0.35)]"
      : "border-violet-400/12 bg-white/6 text-violet-100 hover:border-violet-400/24 hover:bg-violet-400/10 hover:text-white"
  );
}

function getInitials(name: string) {
  const letters = name
    .split(/\s+/)
    .map((part) => part.trim()[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return letters || "MN";
}

export function AppSidebar({ groups, profile }: AppSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [groupsOpen, setGroupsOpen] = useState(true);
  const settingsActive = pathname === "/settings";

  useEffect(() => {
    const storedCollapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    const storedGroupsOpen = localStorage.getItem(SIDEBAR_GROUPS_OPEN_KEY);

    if (storedCollapsed === "true") {
      setCollapsed(true);
    }

    if (storedGroupsOpen === "false") {
      setGroupsOpen(false);
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  }

  function toggleGroupsOpen() {
    setGroupsOpen((current) => {
      const next = !current;
      localStorage.setItem(SIDEBAR_GROUPS_OPEN_KEY, String(next));
      return next;
    });
  }

  const primaryLinks = [
    {
      active: pathname === "/groups/new",
      href: "/groups/new",
      icon: Plus,
      label: "Create group"
    },
    {
      active: pathname === "/groups/join",
      href: "/groups/join",
      icon: KeyRound,
      label: "Join group"
    }
  ];

  return (
    <aside
      className={cn(
        "w-full shrink-0 rounded-[32px] border border-violet-400/18 bg-[linear-gradient(180deg,rgba(30,20,59,0.88),rgba(17,12,34,0.94))] p-4 shadow-[0_24px_80px_rgba(2,1,12,0.42)] backdrop-blur-xl lg:sticky lg:top-6 lg:self-start lg:transition-[width]",
        collapsed ? "lg:w-24" : "lg:w-72"
      )}
    >
      <div className="flex flex-col gap-4">
        <div className={cn("flex items-start justify-between gap-3", collapsed && "lg:flex-col lg:items-center")}>
          <Link
            className={cn(
              "inline-flex min-w-0 items-center gap-3 text-lg font-semibold tracking-tight text-white",
              collapsed && "lg:text-center"
            )}
            href="/"
          >
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500 shadow-[0_14px_36px_rgba(139,92,246,0.35)]">
              <Film className="h-5 w-5 text-white" />
            </span>
            {collapsed ? (
              <>
                <span className="lg:hidden">Movie Night Planner</span>
                <span className="hidden lg:inline">MN</span>
              </>
            ) : (
              "Movie Night Planner"
            )}
          </Link>

          <div className={cn("flex items-center gap-2", collapsed && "lg:flex-col")}>
            <ThemeToggle />
            <button
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="hidden h-11 w-11 items-center justify-center rounded-xl border border-violet-400/18 bg-white/5 text-violet-100 transition hover:border-violet-400/32 hover:bg-violet-400/10 hover:text-white lg:inline-flex"
              onClick={toggleCollapsed}
              type="button"
            >
              {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <Link
          className={cn(
            "rounded-[24px] border transition",
            settingsActive
              ? "border-violet-400/24 bg-violet-500 text-white shadow-[0_14px_36px_rgba(139,92,246,0.35)]"
              : "border-violet-400/12 bg-white/5 text-white hover:border-violet-400/24 hover:bg-violet-400/10",
            collapsed ? "flex items-center justify-center px-3 py-4" : "block space-y-4 px-4 py-4"
          )}
          href="/settings"
          title={collapsed ? "Open settings" : undefined}
        >
          {collapsed ? (
            <span
              className={cn(
                "inline-flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-semibold uppercase",
                settingsActive ? "bg-white/18 text-current" : "bg-violet-500/18 text-violet-100"
              )}
            >
              {getInitials(profile.display_name)}
            </span>
          ) : (
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold uppercase",
                  settingsActive ? "bg-white/18 text-current" : "bg-violet-500/18 text-violet-100"
                )}
              >
                {getInitials(profile.display_name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{profile.display_name}</p>
                <p className={cn("truncate text-sm", settingsActive ? "text-white/70" : "text-violet-100/55")}>
                  {profile.email}
                </p>
              </div>
              <Settings2 className="mt-0.5 h-4 w-4 shrink-0" />
            </div>
          )}
        </Link>

        <div className="space-y-2">
          <nav className="space-y-1">
            {primaryLinks.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  aria-label={item.label}
                  className={navItemClass(item.active, collapsed)}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                >
                  <span className={cn("inline-flex items-center gap-3", collapsed && "lg:gap-0")}>
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className={cn(collapsed && "lg:sr-only")}>{item.label}</span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-violet-400/12 pt-4">
          <button
            aria-expanded={groupsOpen}
            className={navItemClass(false, collapsed)}
            onClick={toggleGroupsOpen}
            title={collapsed ? "Toggle groups" : undefined}
            type="button"
          >
            <span className={cn("inline-flex items-center gap-3", collapsed && "lg:gap-0")}>
              <Users className="h-4 w-4 shrink-0" />
              <span className={cn(collapsed && "lg:sr-only")}>Your groups</span>
            </span>
            <ChevronDown
              className={cn("h-4 w-4 transition", groupsOpen ? "rotate-180" : "rotate-0", collapsed && "lg:hidden")}
            />
          </button>

          {groupsOpen ? (
            <div className="mt-2 space-y-1">
              {groups.length > 0 ? (
                groups.map((group) => {
                  const href = `/groups/${group.id}`;
                  const active = pathname === href || pathname.startsWith(`${href}/`);

                  return (
                    <Link
                      key={group.id}
                      aria-label={group.name}
                      className={navItemClass(active, collapsed)}
                      href={href}
                      title={collapsed ? group.name : undefined}
                    >
                      {collapsed ? (
                        <>
                          <span className="hidden h-8 w-8 items-center justify-center rounded-full bg-violet-500/14 text-xs font-semibold text-violet-100 lg:inline-flex">
                            {getInitials(group.name)}
                          </span>
                          <span className="min-w-0 lg:hidden">
                            <span className="block truncate">{group.name}</span>
                            <span className="block text-xs uppercase tracking-[0.16em] opacity-70">
                              {group.countryCode}
                            </span>
                          </span>
                        </>
                      ) : (
                        <span className="min-w-0">
                          <span className="block truncate">{group.name}</span>
                          <span className="block text-xs uppercase tracking-[0.16em] opacity-70">
                            {group.countryCode}
                          </span>
                        </span>
                      )}
                    </Link>
                  );
                })
              ) : (
                <div
                  className={cn(
                    "rounded-2xl border border-violet-400/10 bg-white/5 text-sm text-violet-100/60",
                    collapsed ? "px-3 py-3 lg:px-3 lg:py-4 lg:text-center" : "px-3 py-3"
                  )}
                >
                  {collapsed ? (
                    <>
                      <span className="lg:hidden">No groups yet.</span>
                      <span className="hidden lg:inline">0</span>
                    </>
                  ) : (
                    "No groups yet."
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>

        <form action="/auth/signout" className="border-t border-violet-400/12 pt-4" method="post">
          <button
            aria-label="Sign out"
            className={navItemClass(false, collapsed)}
            title={collapsed ? "Sign out" : undefined}
            type="submit"
          >
            <span className={cn("inline-flex items-center gap-3", collapsed && "lg:gap-0")}>
              <LogOut className="h-4 w-4 shrink-0" />
              <span className={cn(collapsed && "lg:sr-only")}>Sign out</span>
            </span>
          </button>
        </form>
      </div>
    </aside>
  );
}
