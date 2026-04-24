"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TmdbMovieSearchResultDto } from "@movie-night/domain";
import { buttonVariants, cn, inputClassName } from "@movie-night/ui";
import { Bookmark, BookmarkCheck, CheckCircle2, History, Search } from "lucide-react";
import { MoviePoster } from "@/components/movie-poster";

interface TmdbSearchPanelProps {
  canAddMovies: boolean;
  enabled: boolean;
  eventId: string;
  groupWatchedMovieIds: number[];
  regionCode: string;
  suggestedMovieIds: number[];
  watchedMovieIds: number[];
  watchlistMovieIds: number[];
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
    return "—";
  }

  return names.join(", ");
}

export function TmdbSearchPanel({
  canAddMovies,
  enabled,
  eventId,
  groupWatchedMovieIds,
  regionCode,
  suggestedMovieIds,
  watchedMovieIds,
  watchlistMovieIds
}: TmdbSearchPanelProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TmdbMovieSearchResultDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingMovieId, setPendingMovieId] = useState<number | null>(null);
  const [pendingWatchlistMovieId, setPendingWatchlistMovieId] = useState<number | null>(null);
  const [addedMovieIds, setAddedMovieIds] = useState<number[]>(suggestedMovieIds);
  const [watchlistIds, setWatchlistIds] = useState<number[]>(watchlistMovieIds);
  const watchedIds = new Set(watchedMovieIds);
  const groupWatchedIds = new Set(groupWatchedMovieIds);
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

  async function handleAddToWatchlist(tmdbMovieId: number) {
    setPendingWatchlistMovieId(tmdbMovieId);
    setError(null);

    try {
      const response = await fetch(`/api/watchlist`, {
        body: JSON.stringify({ tmdbMovieId }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; status?: string }
        | null;

      if (!response.ok) {
        setError(payload?.error ?? "Could not add to watchlist.");
        return;
      }

      setWatchlistIds((current) =>
        current.includes(tmdbMovieId) ? current : [...current, tmdbMovieId]
      );
    } catch {
      setError("Could not add to watchlist.");
    } finally {
      setPendingWatchlistMovieId(null);
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
    <section id="search" className="space-y-5">
      {!enabled ? (
        <div className="rounded-xl border border-border/60 bg-card px-4 py-3 text-sm text-muted-foreground">
          TMDb is not configured.
        </div>
      ) : (
        <form className="flex flex-col gap-2 sm:flex-row" onSubmit={handleSubmit}>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <label className="sr-only" htmlFor="tmdb-query">
              Search TMDb
            </label>
            <input
              autoFocus
              className={cn(inputClassName, "pl-10")}
              id="tmdb-query"
              name="query"
              onChange={(currentEvent) => setQuery(currentEvent.target.value)}
              placeholder="Search movies by title"
              type="text"
              value={query}
            />
          </div>
          <button
            className={buttonVariants({ size: "md" })}
            disabled={!canSearch}
            type="submit"
          >
            {isLoading ? "Searching…" : "Search"}
          </button>
        </form>
      )}

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {!canAddMovies ? (
        <div className="rounded-xl border border-border/60 bg-card px-4 py-3 text-sm text-muted-foreground">
          Suggestions are locked for this movie night.
        </div>
      ) : null}

      {hasSearched && !error && results.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/40 px-4 py-8 text-center text-sm text-muted-foreground">
          No results.
        </div>
      ) : null}

      {results.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {results.length === 1 ? "1 result" : `${results.length} results`}
          </p>

          <div className="space-y-3">
            {results.map((result) => {
              const flatrateNames =
                result.watchProviders?.flatrateProviders.map((provider) => provider.providerName) ?? [];
              const rentNames =
                result.watchProviders?.rentProviders.map((provider) => provider.providerName) ?? [];
              const buyNames =
                result.watchProviders?.buyProviders.map((provider) => provider.providerName) ?? [];
              const isAdded = addedMovieIds.includes(result.tmdbMovieId);
              const isPending = pendingMovieId === result.tmdbMovieId;
              const onWatchlist = watchlistIds.includes(result.tmdbMovieId);
              const userWatched = watchedIds.has(result.tmdbMovieId);
              const groupWatched = groupWatchedIds.has(result.tmdbMovieId);
              const watchlistPending = pendingWatchlistMovieId === result.tmdbMovieId;

              return (
                <div
                  key={result.tmdbMovieId}
                  className="rounded-2xl border border-border/60 bg-card p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 gap-4 sm:gap-5">
                      <MoviePoster
                        posterPath={result.posterPath ?? null}
                        size="search"
                        title={result.title}
                      />

                      <div className="min-w-0 space-y-3">
                        <div>
                          <div className="flex flex-wrap items-baseline gap-2">
                            <h3 className="text-base font-semibold text-foreground">
                              {result.title}
                            </h3>
                            {getReleaseYear(result.releaseDate) ? (
                              <span className="text-sm text-muted-foreground">
                                {getReleaseYear(result.releaseDate)}
                              </span>
                            ) : null}
                          </div>
                          {result.originalTitle && result.originalTitle !== result.title ? (
                            <p className="text-xs text-muted-foreground">
                              {result.originalTitle}
                            </p>
                          ) : null}
                        </div>

                        {(onWatchlist || userWatched || groupWatched) ? (
                          <div className="flex flex-wrap gap-1.5">
                            {onWatchlist ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                                <BookmarkCheck className="h-3 w-3" />
                                On your list
                              </span>
                            ) : null}
                            {userWatched ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-chart-4/40 bg-chart-4/10 px-2 py-0.5 text-[11px] font-medium text-chart-4">
                                <CheckCircle2 className="h-3 w-3" />
                                You watched this
                              </span>
                            ) : null}
                            {groupWatched && !userWatched ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                <History className="h-3 w-3" />
                                Group watched this
                              </span>
                            ) : null}
                          </div>
                        ) : null}

                        {result.overview ? (
                          <p className="line-clamp-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                            {result.overview}
                          </p>
                        ) : null}

                        <div className="grid gap-2 text-xs sm:grid-cols-3">
                          <ProviderRow label="Stream" value={formatProviderNames(flatrateNames)} />
                          <ProviderRow label="Rent" value={formatProviderNames(rentNames)} />
                          <ProviderRow label="Buy" value={formatProviderNames(buyNames)} />
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2 lg:flex-col lg:items-end">
                      <p className="text-xs text-muted-foreground">
                        {flatrateNames.length > 0 ? "Included with subscription" : "Not on any stream"}
                      </p>
                      <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end">
                        <button
                          className={buttonVariants({
                            size: "sm",
                            variant: isAdded ? "outline" : "primary"
                          })}
                          disabled={!canAddMovies || isAdded || isPending}
                          onClick={() => void handleAddMovie(result.tmdbMovieId)}
                          type="button"
                        >
                          {isPending ? "Adding…" : isAdded ? "Added" : "Add"}
                        </button>
                        <button
                          className={buttonVariants({ size: "sm", variant: "ghost" })}
                          disabled={onWatchlist || watchlistPending}
                          onClick={() => void handleAddToWatchlist(result.tmdbMovieId)}
                          type="button"
                        >
                          <Bookmark className="h-4 w-4" />
                          {watchlistPending
                            ? "Saving…"
                            : onWatchlist
                              ? "On your list"
                              : "Save for later"}
                        </button>
                      </div>
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

function ProviderRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 truncate text-foreground/90">{value}</p>
    </div>
  );
}
