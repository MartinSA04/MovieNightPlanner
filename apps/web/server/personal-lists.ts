import type { AddToWatchlistInput, MarkWatchedInput } from "@movie-night/domain";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { getMovieDetails } from "@/server/tmdb/client";

export interface PersonalMovieRow {
  addedAt: string;
  eventId: string | null;
  note: string | null;
  originalTitle: string | null;
  posterPath: string | null;
  rating: number | null;
  releaseDate: string | null;
  title: string;
  tmdbMovieId: number;
}

export interface GroupWatchHistoryEntry {
  eventId: string;
  eventTitle: string;
  posterPath: string | null;
  releaseDate: string | null;
  status: "locked" | "completed";
  title: string;
  tmdbMovieId: number;
  watchedAt: string;
}

interface MovieCacheLite {
  original_title: string | null;
  poster_path: string | null;
  release_date: string | null;
  title: string;
  tmdb_movie_id: number;
}

async function loadMovieCacheByIds(
  tmdbMovieIds: number[],
  admin = createAdminClient()
): Promise<Map<number, MovieCacheLite>> {
  if (tmdbMovieIds.length === 0) return new Map();
  const { data, error } = await admin
    .from("movie_cache")
    .select("tmdb_movie_id, title, original_title, poster_path, release_date")
    .in("tmdb_movie_id", tmdbMovieIds);

  if (error) {
    throw new Error(`Could not load movie cache: ${error.message}`);
  }

  return new Map((data ?? []).map((row) => [row.tmdb_movie_id, row as MovieCacheLite]));
}

export async function loadWatchlist(userId: string): Promise<PersonalMovieRow[]> {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("user_watchlist")
    .select("tmdb_movie_id, note, added_at")
    .eq("user_id", userId)
    .order("added_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load watchlist: ${error.message}`);
  }

  const rows = data ?? [];
  if (rows.length === 0) return [];

  const admin = createAdminClient();
  const moviesById = await loadMovieCacheByIds(
    rows.map((row) => row.tmdb_movie_id),
    admin
  );

  return rows.map((row) => {
    const movie = moviesById.get(row.tmdb_movie_id);
    return {
      addedAt: row.added_at,
      eventId: null,
      note: row.note,
      originalTitle: movie?.original_title ?? null,
      posterPath: movie?.poster_path ?? null,
      rating: null,
      releaseDate: movie?.release_date ?? null,
      title: movie?.title ?? `TMDb ${row.tmdb_movie_id}`,
      tmdbMovieId: row.tmdb_movie_id
    };
  });
}

export async function loadWatched(userId: string): Promise<PersonalMovieRow[]> {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("user_watched")
    .select("tmdb_movie_id, note, rating, watched_at, event_id")
    .eq("user_id", userId)
    .order("watched_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load watched list: ${error.message}`);
  }

  const rows = data ?? [];
  if (rows.length === 0) return [];

  const admin = createAdminClient();
  const moviesById = await loadMovieCacheByIds(
    rows.map((row) => row.tmdb_movie_id),
    admin
  );

  return rows.map((row) => {
    const movie = moviesById.get(row.tmdb_movie_id);
    return {
      addedAt: row.watched_at,
      eventId: row.event_id,
      note: row.note,
      originalTitle: movie?.original_title ?? null,
      posterPath: movie?.poster_path ?? null,
      rating: row.rating,
      releaseDate: movie?.release_date ?? null,
      title: movie?.title ?? `TMDb ${row.tmdb_movie_id}`,
      tmdbMovieId: row.tmdb_movie_id
    };
  });
}

export async function loadWatchlistMovieIds(userId: string): Promise<Set<number>> {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("user_watchlist")
    .select("tmdb_movie_id")
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Could not load watchlist ids: ${error.message}`);
  }

  return new Set((data ?? []).map((row) => row.tmdb_movie_id));
}

export async function loadWatchedMovieIds(userId: string): Promise<Set<number>> {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("user_watched")
    .select("tmdb_movie_id")
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Could not load watched ids: ${error.message}`);
  }

  return new Set((data ?? []).map((row) => row.tmdb_movie_id));
}

export async function addToWatchlist(
  input: AddToWatchlistInput & { actorUserId: string }
): Promise<{ status: "added" | "already-exists" }> {
  await getMovieDetails(input.tmdbMovieId).catch((error) => {
    console.warn(
      `Could not warm movie_cache for watchlist (tmdb ${input.tmdbMovieId})`,
      error
    );
  });

  const admin = createAdminClient();
  const { error } = await admin.from("user_watchlist").insert({
    note: input.note ?? null,
    tmdb_movie_id: input.tmdbMovieId,
    user_id: input.actorUserId
  });

  if (error) {
    if (error.code === "23505") {
      return { status: "already-exists" };
    }
    throw new Error(`Could not add to watchlist: ${error.message}`);
  }

  return { status: "added" };
}

export async function removeFromWatchlist(input: {
  actorUserId: string;
  tmdbMovieId: number;
}): Promise<{ status: "removed" }> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("user_watchlist")
    .delete()
    .eq("user_id", input.actorUserId)
    .eq("tmdb_movie_id", input.tmdbMovieId);

  if (error) {
    throw new Error(`Could not remove from watchlist: ${error.message}`);
  }

  return { status: "removed" };
}

export async function markWatched(
  input: MarkWatchedInput & { actorUserId: string }
): Promise<{ status: "added" | "updated" }> {
  await getMovieDetails(input.tmdbMovieId).catch((error) => {
    console.warn(
      `Could not warm movie_cache for watched (tmdb ${input.tmdbMovieId})`,
      error
    );
  });

  const admin = createAdminClient();
  const { data: existing, error: existingError } = await admin
    .from("user_watched")
    .select("tmdb_movie_id")
    .eq("user_id", input.actorUserId)
    .eq("tmdb_movie_id", input.tmdbMovieId)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Could not check watched state: ${existingError.message}`);
  }

  const payload = {
    event_id: input.eventId ?? null,
    note: input.note ?? null,
    rating: input.rating ?? null,
    tmdb_movie_id: input.tmdbMovieId,
    user_id: input.actorUserId
  };

  if (existing) {
    const { error } = await admin
      .from("user_watched")
      .update(payload)
      .eq("user_id", input.actorUserId)
      .eq("tmdb_movie_id", input.tmdbMovieId);

    if (error) {
      throw new Error(`Could not update watched entry: ${error.message}`);
    }

    return { status: "updated" };
  }

  const { error } = await admin.from("user_watched").insert(payload);

  if (error) {
    throw new Error(`Could not mark as watched: ${error.message}`);
  }

  return { status: "added" };
}

export async function unmarkWatched(input: {
  actorUserId: string;
  tmdbMovieId: number;
}): Promise<{ status: "removed" }> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("user_watched")
    .delete()
    .eq("user_id", input.actorUserId)
    .eq("tmdb_movie_id", input.tmdbMovieId);

  if (error) {
    throw new Error(`Could not unmark watched: ${error.message}`);
  }

  return { status: "removed" };
}

export async function recordCompletedEventForMembers(input: {
  eventId: string;
  groupId: string;
  tmdbMovieId: number;
}): Promise<void> {
  const admin = createAdminClient();
  const { data: members, error } = await admin
    .from("group_members")
    .select("user_id")
    .eq("group_id", input.groupId);

  if (error) {
    console.warn(`Could not load members for completion record: ${error.message}`);
    return;
  }

  const rows = (members ?? []).map((member) => ({
    event_id: input.eventId,
    tmdb_movie_id: input.tmdbMovieId,
    user_id: member.user_id
  }));

  if (rows.length === 0) return;

  const { error: upsertError } = await admin
    .from("user_watched")
    .upsert(rows, { onConflict: "user_id,tmdb_movie_id", ignoreDuplicates: true });

  if (upsertError) {
    console.warn(
      `Could not record completed event for members: ${upsertError.message}`
    );
  }
}

export async function loadGroupWatchHistory(
  groupId: string
): Promise<GroupWatchHistoryEntry[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("movie_night_events")
    .select("id, title, status, winning_suggestion_id, updated_at")
    .eq("group_id", groupId)
    .in("status", ["locked", "completed"])
    .not("winning_suggestion_id", "is", null)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(`Could not load group watch history: ${error.message}`);
  }

  const rows = data ?? [];
  if (rows.length === 0) return [];

  const suggestionIds = rows
    .map((row) => row.winning_suggestion_id)
    .filter((id): id is string => Boolean(id));

  const { data: suggestionRows, error: suggestionsError } = await admin
    .from("movie_suggestions")
    .select("id, tmdb_movie_id")
    .in("id", suggestionIds);

  if (suggestionsError) {
    throw new Error(`Could not load history suggestions: ${suggestionsError.message}`);
  }

  const movieIdBySuggestionId = new Map(
    (suggestionRows ?? []).map((row) => [row.id, row.tmdb_movie_id])
  );
  const moviesById = await loadMovieCacheByIds(
    Array.from(new Set(movieIdBySuggestionId.values())),
    admin
  );

  return rows
    .map((row) => {
      const movieId = row.winning_suggestion_id
        ? movieIdBySuggestionId.get(row.winning_suggestion_id)
        : undefined;
      if (!movieId) return null;
      const movie = moviesById.get(movieId);
      return {
        eventId: row.id,
        eventTitle: row.title,
        posterPath: movie?.poster_path ?? null,
        releaseDate: movie?.release_date ?? null,
        status: row.status as "locked" | "completed",
        title: movie?.title ?? `TMDb ${movieId}`,
        tmdbMovieId: movieId,
        watchedAt: row.updated_at
      };
    })
    .filter((row): row is GroupWatchHistoryEntry => row !== null);
}

export async function loadGroupWatchedMovieIds(groupId: string): Promise<Set<number>> {
  const history = await loadGroupWatchHistory(groupId);
  return new Set(history.map((entry) => entry.tmdbMovieId));
}
