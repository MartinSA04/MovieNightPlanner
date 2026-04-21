"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Plus, X } from "lucide-react";
import { buttonVariants, cn } from "@movie-night/ui";

interface GroupOption {
  countryCode: string;
  id: string;
  name: string;
}

interface CreateMovieNightButtonProps {
  groups: GroupOption[];
}

export function CreateMovieNightButton({ groups }: CreateMovieNightButtonProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (groups.length === 0) {
    return null;
  }

  if (groups.length === 1) {
    return (
      <Link
        className={buttonVariants({ size: "sm" })}
        href={`/groups/${groups[0].id}?view=new-event`}
      >
        <Plus className="h-4 w-4" />
        Create
      </Link>
    );
  }

  return (
    <>
      <button
        className={buttonVariants({ size: "sm" })}
        onClick={() => setOpen(true)}
        type="button"
      >
        <Plus className="h-4 w-4" />
        Create
      </button>

      {open ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-[90] flex items-center justify-center bg-background/70 px-4 py-6 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  Create movie night
                </h2>
                <p className="text-sm text-muted-foreground">
                  Choose which group to create it in.
                </p>
              </div>

              <button
                aria-label="Close"
                className={cn(
                  buttonVariants({ size: "sm", variant: "ghost" }),
                  "h-9 w-9 px-0"
                )}
                onClick={() => setOpen(false)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-2">
              {groups.map((group) => (
                <Link
                  key={group.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-transparent px-4 py-3 transition hover:border-primary/40 hover:bg-secondary/40"
                  href={`/groups/${group.id}?view=new-event`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {group.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{group.countryCode}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
