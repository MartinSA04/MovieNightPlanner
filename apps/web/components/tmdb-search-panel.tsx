"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TmdbMovieSearchResultDto } from "@movie-night/domain";
import {
  SectionHeading,
  buttonVariants,
  cn,
  inputClassName
} from "@movie-night/ui";
import { MoviePoster } from "@/components/movie-poster";

interface TmdbSearchPanelProps {
  canAddMovies: boolean;
  enabled: boolean;
  eventId: string;
  regionCode: string;
  suggestedMovieIds: number[];
}

interface TmdbSearchResponse {
  error?: string;
  results?: TmdbMovieSearchResultDto[];
}

interface AddSuggestionResponse {
  error?: string;
  status?: "added" | "already-exists";
}

function getReleaseYear(releaseDate: string | null | undefined) {
  if (!releaseDate) {
    return null;
  }

  return releaseDate.slice(0, 4);
}

function formatProviderNames(names: string[]) {
  if (names.length === 0) {
    return "None";
  }

  return names.join(", ");
}

export function TmdbSearchPanel({
  canAddMovies,
  enabled,
  eventId,
  regionCode,
  suggestedMovieIds
}: TmdbSearchPanelProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TmdbMovieSearchResultDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingMovieId, setPendingMovieId] = useState<number | null>(null);
  const [addedMovieIds, setAddedMovieIds] = useState<number[]>(suggestedMovieIds);
  const canSearch = enabled && query.trim().length >= 2 && !isLoading;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      setError("Search with at least 2 characters.");
      setHasSearched(false);
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/tmdb/search?query=${encodeURIComponent(trimmedQuery)}&regionCode=${encodeURIComponent(regionCode)}`,
        {
          method: "GET"
        }
      );
      const payload = (await response.json()) as TmdbSearchResponse;

      setError(response.ok ? null : payload.error ?? "TMDb search failed.");
      setResults(response.ok ? payload.results ?? [] : []);
      setHasSearched(true);
    } catch {
      setError("TMDb search failed.");
      setResults([]);
      setHasSearched(true);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddMovie(tmdbMovieId: number) {
    setPendingMovieId(tmdbMovieId);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}/suggestions`, {
        body: JSON.stringify({ tmdbMovieId }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      const payload = (await response.json()) as AddSuggestionResponse;

      if (!response.ok) {
        setError(payload.error ?? "Could not add movie suggestion.");
        return;
      }

      setAddedMovieIds((current) =>
        current.includes(tmdbMovieId) ? current : [...current, tmdbMovieId]
      );
      router.refresh();
    } catch {
      setError("Could not add movie suggestion.");
    } finally {
      setPendingMovieId(null);
    }
  }

  return (
    <section id="search" className={cn("space-y-5")}>
      <div className="space-y-2">
        <SectionHeading>Search</SectionHeading>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Search TMDb
        </h2>
      </div>

      {!enabled ? (
        <div className="rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-muted-foreground">
          TMDb not configured.
        </div>
      ) : (
        <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
          <div className="flex-1">
            <label className="sr-only" htmlFor="tmdb-query">
              Search TMDb
            </label>
            <input
              autoFocus
              className={inputClassName}
              id="tmdb-query"
              name="query"
              onChange={(currentEvent) => setQuery(currentEvent.target.value)}
              placeholder="Search by title"
              type="text"
              value={query}
            />
          </div>
          <button className={buttonVariants()} disabled={!canSearch}>
            {isLoading ? "Finding" : "Find"}
          </button>
        </form>
      )}

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {!canAddMovies ? (
        <div className="rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-muted-foreground">
          Suggestions are locked for this movie night.
        </div>
      ) : null}

      {hasSearched && !error && results.length === 0 ? (
        <div className="rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-muted-foreground">
          No results.
        </div>
      ) : null}

      {results.length > 0 ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionHeading>Results</SectionHeading>
            <p className="text-sm text-muted-foreground">
              {results.length === 1 ? "1 result" : `${results.length} results`}
            </p>
          </div>

          <div className="grid gap-3">
            {results.map((result) => {
              const flatrateNames =
                result.watchProviders?.flatrateProviders.map((provider) => provider.providerName) ?? [];
              const rentNames =
                result.watchProviders?.rentProviders.map((provider) => provider.providerName) ?? [];
              const buyNames =
                result.watchProviders?.buyProviders.map((provider) => provider.providerName) ?? [];
              const isAdded = addedMovieIds.includes(result.tmdbMovieId);
              const isPending = pendingMovieId === result.tmdbMovieId;

              return (
                <div key={result.tmdbMovieId} className="rounded-xl border border-border bg-secondary p-5">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex gap-4 sm:gap-5">
                      <MoviePoster posterPath={result.posterPath ?? null} size="search" title={result.title} />

                      <div className="min-w-0 space-y-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-baseline gap-2">
                            <h3 className="text-xl font-semibold text-foreground">
                              {result.title}
                            </h3>
                            {getReleaseYear(result.releaseDate) ? (
                              <span className="text-sm text-muted-foreground">
                                {getReleaseYear(result.releaseDate)}
                              </span>
                            ) : null}
                          </div>

                          {result.originalTitle && result.originalTitle !== result.title ? (
                            <p className="text-sm text-muted-foreground">
                              {result.originalTitle}
                            </p>
                          ) : null}
                        </div>

                        {result.overview ? (
                          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                            {result.overview}
                          </p>
                        ) : null}

                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="rounded-lg border border-border bg-card px-4 py-3">
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                              Stream
                            </p>
                            <p className="mt-2 text-sm text-muted-foreground">
                              {formatProviderNames(flatrateNames)}
                            </p>
                          </div>
                          <div className="rounded-lg border border-border bg-card px-4 py-3">
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                              Rent
                            </p>
                            <p className="mt-2 text-sm text-muted-foreground">
                              {formatProviderNames(rentNames)}
                            </p>
                          </div>
                          <div className="rounded-lg border border-border bg-card px-4 py-3">
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                              Buy
                            </p>
                            <p className="mt-2 text-sm text-muted-foreground">
                              {formatProviderNames(buyNames)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2 lg:flex-col lg:items-end">
                      <p className="text-sm text-muted-foreground">
                        {flatrateNames.length > 0 ? "Included with subscription" : "No included stream"}
                      </p>
                      <button
                        className={buttonVariants({ size: "sm" })}
                        disabled={!canAddMovies || isAdded || isPending}
                        onClick={() => void handleAddMovie(result.tmdbMovieId)}
                        type="button"
                      >
                        {isPending ? "Adding" : isAdded ? "Added" : "Add"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
