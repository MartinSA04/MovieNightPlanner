"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogOut, Settings2 } from "lucide-react";
import { buttonVariants, cn } from "@movie-night/ui";

interface ProfileMenuProps {
  avatarUrl: string | null;
  displayName: string;
  email: string;
}

function deriveInitials(name: string, email: string) {
  const source = name.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  const initials = parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : source.slice(0, 2);

  return initials.toUpperCase();
}

export function ProfileMenu({ avatarUrl, displayName, email }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Open account menu"
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border/60 bg-secondary text-xs font-semibold text-foreground transition hover:border-primary/50",
          open && "border-primary/50"
        )}
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt=""
            className="h-full w-full object-cover"
            src={avatarUrl}
          />
        ) : (
          <span>{deriveInitials(displayName, email)}</span>
        )}
      </button>

      {open ? (
        <div
          className="absolute right-0 top-[calc(100%+0.5rem)] z-20 w-60 overflow-hidden rounded-xl border border-border/60 bg-card shadow-lg"
          role="menu"
        >
          <div className="space-y-0.5 border-b border-border/60 px-4 py-3">
            <p className="truncate text-sm font-semibold text-foreground">
              {displayName}
            </p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
          <div className="p-1">
            <Link
              className={cn(
                buttonVariants({ size: "sm", variant: "ghost" }),
                "w-full justify-start gap-2"
              )}
              href="/settings"
              onClick={() => setOpen(false)}
              role="menuitem"
            >
              <Settings2 className="h-4 w-4" />
              Settings
            </Link>
            <form action="/auth/signout" method="post">
              <button
                className={cn(
                  buttonVariants({ size: "sm", variant: "ghost" }),
                  "w-full justify-start gap-2"
                )}
                role="menuitem"
                type="submit"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
