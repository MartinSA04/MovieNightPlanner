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
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatVoteCount(count: number) {
  if (count === 0) {
    return "No votes";
  }

  return count === 1 ? "1 vote" : `${count} votes`;
}

function formatPoints(points: number) {
  return points === 1 ? "1 point" : `${points} points`;
}

export function EventSuggestionsBoard({
  canRemoveMovies,
  currentUserId,
  eventId,
  suggestions
}: EventSuggestionsBoardProps) {
  return (
    <div className="grid gap-3">
      {suggestions.map((suggestion, index) => (
        <div key={suggestion.id} className="rounded-[28px] bg-white px-5 py-5 dark:bg-slate-950">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex gap-4 sm:gap-5">
              <MoviePoster posterPath={suggestion.posterPath} title={suggestion.title} />

              <div className="min-w-0 space-y-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-xl font-semibold text-slate-950 dark:text-white">
                      {suggestion.title}
                    </h3>
                    {getReleaseYear(suggestion.releaseDate) ? (
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {getReleaseYear(suggestion.releaseDate)}
                      </span>
                    ) : null}
                  </div>

                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {formatPoints(suggestion.points)} / {formatVoteCount(suggestion.ballotCount)}
                  </p>
                </div>

                {suggestion.originalTitle && suggestion.originalTitle !== suggestion.title ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {suggestion.originalTitle}
                  </p>
                ) : null}

                {suggestion.overview ? (
                  <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
                    {suggestion.overview}
                  </p>
                ) : null}

                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {suggestion.suggestedByDisplayName} / {formatDate(suggestion.createdAt)}
                </p>

                {suggestion.note ? (
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {suggestion.note}
                  </p>
                ) : null}
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
