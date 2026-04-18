"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
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
    "flex min-h-11 items-center rounded-2xl border text-[15px] font-medium shadow-sm transition sm:min-h-12",
    collapsed ? "justify-between px-3 py-3 lg:justify-center lg:px-2" : "justify-between px-4 py-3",
    active
      ? "border-slate-950 bg-slate-950 text-white dark:border-amber-300 dark:bg-amber-300 dark:text-slate-950"
      : "border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-100 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800/80"
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
        "w-full shrink-0 rounded-[28px] border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 lg:sticky lg:top-6 lg:self-start lg:transition-[width]",
        collapsed ? "lg:w-24" : "lg:w-72"
      )}
    >
      <div className="flex flex-col gap-4">
        <div className={cn("flex items-start justify-between gap-3", collapsed && "lg:flex-col lg:items-center")}>
          <Link
            className={cn(
              "min-w-0 text-lg font-semibold tracking-tight text-slate-950 dark:text-white",
              collapsed && "lg:text-center"
            )}
            href="/"
          >
            {collapsed ? (
              <>
                <span className="lg:hidden">Movie Night Planner</span>
                <span className="hidden lg:inline">MNP</span>
              </>
            ) : (
              "Movie Night Planner"
            )}
          </Link>

          <div className={cn("flex items-center gap-2", collapsed && "lg:flex-col")}>
            <ThemeToggle />
            <button
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="hidden h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white/90 text-slate-700 shadow-sm transition hover:border-slate-900 hover:bg-slate-50 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-400 dark:hover:bg-slate-800 dark:hover:text-white lg:inline-flex"
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
              ? "border-slate-950 bg-slate-950 text-white dark:border-amber-300 dark:bg-amber-300 dark:text-slate-950"
              : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:border-slate-700",
            collapsed
              ? "flex items-center justify-center px-3 py-4"
              : "block space-y-4 px-4 py-4"
          )}
          href="/settings"
          title={collapsed ? "Open settings" : undefined}
        >
          {collapsed ? (
            <span
              className={cn(
                "inline-flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-semibold uppercase",
                settingsActive
                  ? "bg-white/20 text-current dark:bg-slate-950/10"
                  : "bg-white text-slate-700 dark:bg-slate-950 dark:text-slate-200"
              )}
            >
              {getInitials(profile.display_name)}
            </span>
          ) : (
            <>
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold uppercase",
                    settingsActive
                      ? "bg-white/20 text-current dark:bg-slate-950/10"
                      : "bg-white text-slate-700 dark:bg-slate-950 dark:text-slate-200"
                  )}
                >
                  {getInitials(profile.display_name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{profile.display_name}</p>
                  <p
                    className={cn(
                      "truncate text-sm",
                      settingsActive
                        ? "text-white/70 dark:text-slate-950/70"
                        : "text-slate-500 dark:text-slate-400"
                    )}
                  >
                    {profile.email}
                  </p>
                </div>
                <Settings2 className="mt-0.5 h-4 w-4 shrink-0" />
              </div>
            </>
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

        <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
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
              className={cn(
                "h-4 w-4 transition",
                groupsOpen ? "rotate-180" : "rotate-0",
                collapsed && "lg:hidden"
              )}
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
                          <span className="hidden h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200 lg:inline-flex">
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
                        <>
                          <span className="min-w-0">
                            <span className="block truncate">{group.name}</span>
                            <span className="block text-xs uppercase tracking-[0.16em] opacity-70">
                              {group.countryCode}
                            </span>
                          </span>
                        </>
                      )}
                    </Link>
                  );
                })
              ) : (
                <div
                  className={cn(
                    "rounded-2xl bg-slate-50 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400",
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

        <form action="/auth/signout" className="border-t border-slate-200 pt-4 dark:border-slate-800" method="post">
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
