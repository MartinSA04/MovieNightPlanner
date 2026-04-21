"use client";

import { buttonVariants, cn, inputClassName } from "@movie-night/ui";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";

interface EventVoteSuggestionOption {
  actorVoteRank: 1 | 2 | 3 | null;
  id: string;
  releaseDate: string | null;
  title: string;
}

interface EventVoteDialogProps {
  canVote: boolean;
  eventId: string;
  suggestions: EventVoteSuggestionOption[];
}

interface SetVotesResponse {
  error?: string;
  status?: "updated";
}

const EMPTY_PICK = "";

function getReleaseYear(releaseDate: string | null | undefined) {
  if (!releaseDate) {
    return null;
  }

  return releaseDate.slice(0, 4);
}

function buildInitialVote(suggestions: EventVoteSuggestionOption[]) {
  return [...suggestions]
    .filter((suggestion) => suggestion.actorVoteRank !== null)
    .sort((left, right) => (left.actorVoteRank ?? 99) - (right.actorVoteRank ?? 99))
    .map((suggestion) => suggestion.id);
}

function expandVote(voteSuggestionIds: string[]) {
  return [
    voteSuggestionIds[0] ?? EMPTY_PICK,
    voteSuggestionIds[1] ?? EMPTY_PICK,
    voteSuggestionIds[2] ?? EMPTY_PICK
  ];
}

function normalizeDraftVote(draftVote: string[]) {
  const filledPicks = draftVote.filter((suggestionId) => suggestionId.length > 0);

  if (new Set(filledPicks).size !== filledPicks.length) {
    return {
      error: "Pick different movies for each spot.",
      suggestionIds: null as string[] | null
    };
  }

  const firstEmptyIndex = draftVote.findIndex((suggestionId) => suggestionId.length === 0);

  if (firstEmptyIndex >= 0) {
    const hasGap = draftVote.slice(firstEmptyIndex + 1).some((suggestionId) => suggestionId.length > 0);

    if (hasGap) {
      return {
        error: "Fill your picks in order from 1st to 3rd.",
        suggestionIds: null as string[] | null
      };
    }
  }

  return {
    error: null,
    suggestionIds: filledPicks
  };
}

export function EventVoteDialog({
  canVote,
  eventId,
  suggestions
}: EventVoteDialogProps) {
  const router = useRouter();
  const [voteSuggestionIds, setVoteSuggestionIds] = useState<string[]>(() =>
    buildInitialVote(suggestions)
  );
  const [draftVote, setDraftVote] = useState<string[]>(() =>
    expandVote(buildInitialVote(suggestions))
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const nextVote = buildInitialVote(suggestions);
    setVoteSuggestionIds(nextVote);
    setDraftVote(expandVote(nextVote));
  }, [suggestions]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSaving) {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSaving, open]);

  function openModal() {
    if (!canVote) {
      return;
    }

    setDraftVote(expandVote(voteSuggestionIds));
    setError(null);
    setOpen(true);
  }

  function closeModal() {
    if (isSaving) {
      return;
    }

    setOpen(false);
    setDraftVote(expandVote(voteSuggestionIds));
    setError(null);
  }

  function updateDraftPick(index: number, value: string) {
    setDraftVote((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
  }

  async function handleSaveVote() {
    if (!canVote || isSaving) {
      return;
    }

    const normalized = normalizeDraftVote(draftVote);

    if (normalized.error) {
      setError(normalized.error);
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch(`/api/events/${eventId}/votes`, {
        body: JSON.stringify({ suggestionIds: normalized.suggestionIds }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "PUT"
      });
      const payload = (await response.json().catch(() => null)) as SetVotesResponse | null;

      if (!response.ok) {
        setError(payload?.error ?? "Could not save picks.");
        return;
      }

      setVoteSuggestionIds(normalized.suggestionIds ?? []);
      setOpen(false);

      startTransition(() => {
        router.refresh();
      });
    } catch {
      setError("Could not save picks.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!canVote || suggestions.length === 0) {
    return null;
  }

  return (
    <>
      <button
        className={buttonVariants({ size: "sm", variant: "outline" })}
        onClick={openModal}
        type="button"
      >
        Vote
      </button>

      {open ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-[90] flex items-center justify-center bg-background/70 px-4 py-6 backdrop-blur-sm"
          onClick={closeModal}
          role="dialog"
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-border/60 bg-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  Choose your top 3
                </h2>
                <p className="text-sm text-muted-foreground">
                  Rank up to three picks. Leave later slots empty for fewer.
                </p>
              </div>

              <button
                aria-label="Close vote popup"
                className={cn(
                  buttonVariants({ size: "sm", variant: "ghost" }),
                  "h-9 w-9 px-0"
                )}
                onClick={closeModal}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {[
                { label: "1st pick", placeholder: "Choose your favorite" },
                { label: "2nd pick", placeholder: "Choose your runner-up" },
                { label: "3rd pick", placeholder: "Choose one more" }
              ].map((slot, index) => (
                <label key={slot.label} className="grid gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    {slot.label}
                  </span>
                  <select
                    className={cn(inputClassName, "appearance-none")}
                    onChange={(event) => updateDraftPick(index, event.target.value)}
                    value={draftVote[index] ?? EMPTY_PICK}
                  >
                    <option value={EMPTY_PICK}>{slot.placeholder}</option>
                    {suggestions.map((suggestion) => (
                      <option key={suggestion.id} value={suggestion.id}>
                        {suggestion.title}
                        {getReleaseYear(suggestion.releaseDate)
                          ? ` (${getReleaseYear(suggestion.releaseDate)})`
                          : ""}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>

            {error ? (
              <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <div className="mt-6 flex justify-end gap-2">
              <button
                className={buttonVariants({ size: "sm", variant: "ghost" })}
                onClick={closeModal}
                type="button"
              >
                Cancel
              </button>
              <button
                className={buttonVariants({ size: "sm" })}
                disabled={isSaving}
                onClick={() => void handleSaveVote()}
                type="button"
              >
                {isSaving ? "Saving…" : "Save picks"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
