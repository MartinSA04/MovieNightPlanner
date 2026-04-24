"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Play, RotateCcw, X } from "lucide-react";
import { buttonVariants, cn } from "@movie-night/ui";
import type { EventStatus } from "@movie-night/domain";

interface StatusActionSuggestion {
  id: string;
  points: number;
  title: string;
}

interface EventStatusActionsProps {
  canManage: boolean;
  eventId: string;
  status: EventStatus;
  suggestions: StatusActionSuggestion[];
  winningSuggestionId: string | null;
}

interface StatusUpdateResponse {
  error?: string;
  status?: "updated";
}

async function requestStatus(
  eventId: string,
  payload: { status: EventStatus; winningSuggestionId?: string | null }
): Promise<StatusUpdateResponse> {
  const response = await fetch(`/api/events/${eventId}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const body = (await response.json().catch(() => null)) as StatusUpdateResponse | null;

  if (!response.ok) {
    return { error: body?.error ?? "Could not update movie night." };
  }

  return body ?? { status: "updated" };
}

export function EventStatusActions({
  canManage,
  eventId,
  status,
  suggestions,
  winningSuggestionId
}: EventStatusActionsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<null | "lock" | "open" | "complete" | "cancel">(
    null
  );
  const [lockDialogOpen, setLockDialogOpen] = useState(false);
  const [selectedWinnerId, setSelectedWinnerId] = useState<string>(
    winningSuggestionId ?? suggestions[0]?.id ?? ""
  );

  useEffect(() => {
    if (!lockDialogOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setLockDialogOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lockDialogOpen]);

  async function runTransition(
    label: NonNullable<typeof pending>,
    payload: { status: EventStatus; winningSuggestionId?: string | null }
  ) {
    setPending(label);
    setError(null);

    const result = await requestStatus(eventId, payload);

    if (result.error) {
      setError(result.error);
      setPending(null);
      return;
    }

    setPending(null);
    setLockDialogOpen(false);
    router.refresh();
  }

  if (!canManage) {
    return null;
  }

  const isTerminal = status === "completed" || status === "cancelled";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "draft" ? (
        <button
          className={buttonVariants({ size: "sm", variant: "outline" })}
          disabled={pending !== null}
          onClick={() => void runTransition("open", { status: "open" })}
          type="button"
        >
          <Play className="h-4 w-4" />
          {pending === "open" ? "Opening…" : "Open voting"}
        </button>
      ) : null}

      {(status === "draft" || status === "open") && suggestions.length > 0 ? (
        <button
          className={buttonVariants({ size: "sm" })}
          disabled={pending !== null}
          onClick={() => {
            setSelectedWinnerId(winningSuggestionId ?? suggestions[0]?.id ?? "");
            setLockDialogOpen(true);
          }}
          type="button"
        >
          <Lock className="h-4 w-4" />
          Lock winner
        </button>
      ) : null}

      {status === "locked" ? (
        <>
          <button
            className={buttonVariants({ size: "sm" })}
            disabled={pending !== null}
            onClick={() => void runTransition("complete", { status: "completed" })}
            type="button"
          >
            {pending === "complete" ? "Saving…" : "Mark watched"}
          </button>
          <button
            className={buttonVariants({ size: "sm", variant: "outline" })}
            disabled={pending !== null}
            onClick={() =>
              void runTransition("open", { status: "open", winningSuggestionId: null })
            }
            type="button"
          >
            <RotateCcw className="h-4 w-4" />
            Unlock
          </button>
        </>
      ) : null}

      {!isTerminal ? (
        <button
          className={buttonVariants({ size: "sm", variant: "ghost" })}
          disabled={pending !== null}
          onClick={() => {
            if (!window.confirm("Cancel this movie night? This cannot be undone.")) return;
            void runTransition("cancel", { status: "cancelled", winningSuggestionId: null });
          }}
          type="button"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {lockDialogOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-[90] flex items-center justify-center bg-background/70 px-4 py-6 backdrop-blur-sm"
          onClick={() => setLockDialogOpen(false)}
          role="dialog"
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  Lock winner
                </h2>
                <p className="text-sm text-muted-foreground">
                  This closes voting and marks the chosen movie as the pick.
                </p>
              </div>
              <button
                aria-label="Close"
                className={cn(
                  buttonVariants({ size: "sm", variant: "ghost" }),
                  "h-9 w-9 px-0"
                )}
                onClick={() => setLockDialogOpen(false)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 max-h-[22rem] space-y-2 overflow-y-auto pr-1">
              {suggestions.map((suggestion) => {
                const selected = suggestion.id === selectedWinnerId;
                return (
                  <label
                    key={suggestion.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                      selected
                        ? "border-primary/50 bg-primary/10 text-foreground"
                        : "border-border/60 text-foreground hover:border-primary/30 hover:bg-secondary/40"
                    )}
                  >
                    <input
                      checked={selected}
                      className="sr-only"
                      name="winner"
                      onChange={() => setSelectedWinnerId(suggestion.id)}
                      type="radio"
                    />
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {suggestion.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {suggestion.points} {suggestion.points === 1 ? "point" : "points"}
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                className={buttonVariants({ size: "sm", variant: "ghost" })}
                disabled={pending !== null}
                onClick={() => setLockDialogOpen(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className={buttonVariants({ size: "sm" })}
                disabled={pending !== null || !selectedWinnerId}
                onClick={() =>
                  void runTransition("lock", {
                    status: "locked",
                    winningSuggestionId: selectedWinnerId
                  })
                }
                type="button"
              >
                {pending === "lock" ? "Locking…" : "Lock this pick"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
