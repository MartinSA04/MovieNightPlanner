"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Trash2 } from "lucide-react";
import { buttonVariants, cn } from "@movie-night/ui";
import { MoviePoster } from "@/components/movie-poster";

interface WatchlistRowMovie {
  addedAt: string;
  note: string | null;
  originalTitle: string | null;
  posterPath: string | null;
  rating: number | null;
  releaseDate: string | null;
  title: string;
  tmdbMovieId: number;
}

interface WatchlistRowProps {
  kind: "watchlist" | "watched";
  movie: WatchlistRowMovie;
}

function getReleaseYear(releaseDate: string | null) {
  if (!releaseDate) return null;
  return releaseDate.slice(0, 4);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium"
  }).format(new Date(value));
}

export function WatchlistRow({ kind, movie }: WatchlistRowProps) {
  const router = useRouter();
  const [pending, setPending] = useState<null | "remove" | "watched">(null);
  const [error, setError] = useState<string | null>(null);

  async function callApi(path: string, method: "POST" | "DELETE", body?: unknown) {
    const response = await fetch(path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined
    });
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!response.ok) {
      throw new Error(payload?.error ?? "Request failed.");
    }

    return payload;
  }

  async function handleRemove() {
    setPending("remove");
    setError(null);
    try {
      await callApi(
        kind === "watchlist"
          ? `/api/watchlist/${movie.tmdbMovieId}`
          : `/api/watched/${movie.tmdbMovieId}`,
        "DELETE"
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setPending(null);
    }
  }

  async function handleMarkWatched() {
    setPending("watched");
    setError(null);
    try {
      await callApi("/api/watched", "POST", { tmdbMovieId: movie.tmdbMovieId });
      await callApi(`/api/watchlist/${movie.tmdbMovieId}`, "DELETE");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 gap-4">
          <MoviePoster
            posterPath={movie.posterPath}
            size="list"
            title={movie.title}
          />
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <h3 className="text-base font-semibold text-foreground">{movie.title}</h3>
              {getReleaseYear(movie.releaseDate) ? (
                <span className="text-sm text-muted-foreground">
                  {getReleaseYear(movie.releaseDate)}
                </span>
              ) : null}
            </div>
            {movie.originalTitle && movie.originalTitle !== movie.title ? (
              <p className="text-xs text-muted-foreground">{movie.originalTitle}</p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              {kind === "watchlist" ? "Added" : "Watched"} · {formatDate(movie.addedAt)}
              {kind === "watched" && movie.rating
                ? ` · ${"★".repeat(movie.rating)}${"☆".repeat(5 - movie.rating)}`
                : ""}
            </p>
            {movie.note ? (
              <p className="rounded-lg bg-secondary/50 px-3 py-2 text-sm text-foreground/90">
                “{movie.note}”
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {kind === "watchlist" ? (
            <button
              className={buttonVariants({ size: "sm", variant: "outline" })}
              disabled={pending !== null}
              onClick={() => void handleMarkWatched()}
              type="button"
            >
              <CheckCircle2 className="h-4 w-4" />
              {pending === "watched" ? "Saving…" : "Mark watched"}
            </button>
          ) : null}
          <button
            className={cn(
              buttonVariants({ size: "sm", variant: "ghost" }),
              "text-muted-foreground"
            )}
            disabled={pending !== null}
            onClick={() => void handleRemove()}
            type="button"
          >
            <Trash2 className="h-4 w-4" />
            {pending === "remove" ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>

      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
