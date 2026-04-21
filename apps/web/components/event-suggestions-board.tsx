"use client";

import { MoviePoster } from "@/components/movie-poster";
import { RemoveSuggestionButton } from "@/components/remove-suggestion-button";

interface EventSuggestionBoardItem {
  ballotCount: number;
  createdAt: string;
  id: string;
  note: string | null;
  originalTitle: string | null;
  overview: string | null;
  points: number;
  posterPath: string | null;
  releaseDate: string | null;
  suggestedByDisplayName: string;
  suggestedByUserId: string;
  title: string;
}

interface EventSuggestionsBoardProps {
  canRemoveMovies: boolean;
  currentUserId: string;
  eventId: string;
  suggestions: EventSuggestionBoardItem[];
}

function getReleaseYear(releaseDate: string | null | undefined) {
  if (!releaseDate) {
    return null;
  }

  return releaseDate.slice(0, 4);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium"
  }).format(new Date(value));
}

function formatStanding(points: number, ballotCount: number) {
  if (points === 0 && ballotCount === 0) {
    return "No votes yet";
  }

  const pointsLabel = `${points} ${points === 1 ? "point" : "points"}`;
  const ballotLabel = `${ballotCount} ${ballotCount === 1 ? "vote" : "votes"}`;
  return `${pointsLabel} · ${ballotLabel}`;
}

export function EventSuggestionsBoard({
  canRemoveMovies,
  currentUserId,
  eventId,
  suggestions
}: EventSuggestionsBoardProps) {
  return (
    <div className="space-y-3">
      {suggestions.map((suggestion, index) => (
        <div
          key={suggestion.id}
          className="rounded-2xl border border-border/60 bg-card p-5"
        >
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex gap-4 sm:gap-5">
              <div className="flex flex-col items-center gap-2">
                <MoviePoster posterPath={suggestion.posterPath} title={suggestion.title} />
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  #{String(index + 1).padStart(2, "0")}
                </span>
              </div>

              <div className="min-w-0 space-y-2">
                <div>
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <h3 className="text-base font-semibold text-foreground">
                      {suggestion.title}
                    </h3>
                    {getReleaseYear(suggestion.releaseDate) ? (
                      <span className="text-sm text-muted-foreground">
                        {getReleaseYear(suggestion.releaseDate)}
                      </span>
                    ) : null}
                  </div>
                  {suggestion.originalTitle &&
                  suggestion.originalTitle !== suggestion.title ? (
                    <p className="text-xs text-muted-foreground">
                      {suggestion.originalTitle}
                    </p>
                  ) : null}
                </div>

                <p className="text-sm font-medium text-foreground/90">
                  {formatStanding(suggestion.points, suggestion.ballotCount)}
                </p>

                {suggestion.overview ? (
                  <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                    {suggestion.overview}
                  </p>
                ) : null}

                {suggestion.note ? (
                  <p className="rounded-lg bg-secondary/50 px-3 py-2 text-sm text-foreground/90">
                    “{suggestion.note}”
                  </p>
                ) : null}

                <p className="text-xs text-muted-foreground">
                  Suggested by {suggestion.suggestedByDisplayName} ·{" "}
                  {formatDate(suggestion.createdAt)}
                </p>
              </div>
            </div>

            {canRemoveMovies && suggestion.suggestedByUserId === currentUserId ? (
              <RemoveSuggestionButton eventId={eventId} suggestionId={suggestion.id} />
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
