import {
  canCreateEvent,
  type AddSuggestionInput,
  type CreateEventInput,
  type EventStatus,
  type RemoveSuggestionInput
} from "@movie-night/domain";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { ensureProfileForUser, requireCurrentUser, type AppProfile } from "@/server/auth";
import { getMovieDetails } from "@/server/tmdb/client";

export interface EventRecordView {
  createdAt: string;
  createdByDisplayName: string;
  createdByUserId: string;
  description: string | null;
  groupId: string;
  id: string;
  regionCode: string;
  scheduledFor: string | null;
  status: EventStatus;
  title: string;
  winningSuggestionId: string | null;
}

export interface EventSuggestionView {
  createdAt: string;
  id: string;
  note: string | null;
  originalTitle: string | null;
  overview: string | null;
  posterPath: string | null;
  releaseDate: string | null;
  suggestedByDisplayName: string;
  suggestedByUserId: string;
  title: string;
  tmdbMovieId: number;
}

export interface EventPageData {
  actorRole: "owner" | "admin" | "member";
  event: EventRecordView;
  group: {
    countryCode: string;
    id: string;
    inviteCode: string;
    name: string;
  };
  profile: AppProfile;
  stats: {
    memberCount: number;
    suggestionCount: number;
    voteCount: number;
  };
  suggestions: EventSuggestionView[];
}

export interface AddSuggestionResult {
  status: "added" | "already-exists";
  suggestion: EventSuggestionView;
}

export interface RemoveSuggestionResult {
  status: "removed";
}

interface SuggestionRecord {
  created_at: string;
  id: string;
  note: string | null;
  suggested_by_user_id: string;
  tmdb_movie_id: number;
}

function normalizeEventRecord(record: {
  created_at: string;
  created_by_user_id: string;
  description: string | null;
  group_id: string;
  id: string;
  region_code: string;
  scheduled_for: string | null;
  status: EventStatus;
  title: string;
  winning_suggestion_id: string | null;
}) {
  return {
    createdAt: record.created_at,
    createdByDisplayName: "Movie fan",
    createdByUserId: record.created_by_user_id,
    description: record.description,
    groupId: record.group_id,
    id: record.id,
    regionCode: record.region_code.toUpperCase(),
    scheduledFor: record.scheduled_for,
    status: record.status,
    title: record.title,
    winningSuggestionId: record.winning_suggestion_id
  };
}

function canAddSuggestions(status: EventStatus) {
  return status === "draft" || status === "open";
}

async function buildSuggestionViews(
  rows: SuggestionRecord[],
  admin = createAdminClient()
): Promise<EventSuggestionView[]> {
  if (rows.length === 0) {
    return [];
  }

  const movieIds = Array.from(new Set(rows.map((row) => row.tmdb_movie_id)));
  const userIds = Array.from(new Set(rows.map((row) => row.suggested_by_user_id)));
  const [{ data: movieRows, error: movieError }, { data: profileRows, error: profileError }] =
    await Promise.all([
      admin
        .from("movie_cache")
        .select("tmdb_movie_id, title, original_title, overview, poster_path, release_date")
        .in("tmdb_movie_id", movieIds),
      admin.from("profiles").select("id, display_name").in("id", userIds)
    ]);

  if (movieError) {
    throw new Error(`Could not load cached movie details: ${movieError.message}`);
  }

  if (profileError) {
    throw new Error(`Could not load suggestion profiles: ${profileError.message}`);
  }

  const moviesById = new Map((movieRows ?? []).map((row) => [row.tmdb_movie_id, row]));
  const profilesById = new Map((profileRows ?? []).map((row) => [row.id, row]));

  return rows.map((row) => {
    const movie = moviesById.get(row.tmdb_movie_id);
    const profile = profilesById.get(row.suggested_by_user_id);

    return {
      createdAt: row.created_at,
      id: row.id,
      note: row.note,
      originalTitle: movie?.original_title ?? null,
      overview: movie?.overview ?? null,
      posterPath: movie?.poster_path ?? null,
      releaseDate: movie?.release_date ?? null,
      suggestedByDisplayName: profile?.display_name ?? "Movie fan",
      suggestedByUserId: row.suggested_by_user_id,
      title: movie?.title ?? `TMDb ${row.tmdb_movie_id}`,
      tmdbMovieId: row.tmdb_movie_id
    };
  });
}

export async function createEventForGroup(
  input: CreateEventInput & {
    actorUserId: string;
  }
) {
  const supabase = await createSupabaseClient();
  const { data: membership, error: membershipError } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", input.groupId)
    .eq("user_id", input.actorUserId)
    .maybeSingle();

  if (membershipError) {
    throw new Error(`Could not verify movie night permissions: ${membershipError.message}`);
  }

  if (!membership || !canCreateEvent(membership.role)) {
    throw new Error("Only group owners and admins can create movie nights.");
  }

  const admin = createAdminClient();
  const { data: event, error: eventError } = await admin
    .from("movie_night_events")
    .insert({
      created_by_user_id: input.actorUserId,
      description: input.description?.trim() ? input.description.trim() : null,
      group_id: input.groupId,
      region_code: input.regionCode,
      scheduled_for: input.scheduledFor ?? null,
      title: input.title
    })
    .select(
      "id, group_id, title, description, scheduled_for, status, region_code, created_by_user_id, winning_suggestion_id, created_at"
    )
    .single();

  if (eventError) {
    throw new Error(`Could not create movie night: ${eventError.message}`);
  }

  return normalizeEventRecord(event);
}

export async function addSuggestionToEvent(
  input: AddSuggestionInput & {
    actorUserId: string;
  }
): Promise<AddSuggestionResult> {
  const supabase = await createSupabaseClient();
  const { data: event, error: eventError } = await supabase
    .from("movie_night_events")
    .select("id, group_id, status")
    .eq("id", input.eventId)
    .maybeSingle();

  if (eventError) {
    throw new Error(`Could not load movie night for suggestion: ${eventError.message}`);
  }

  if (!event) {
    throw new Error("Movie night not found.");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", event.group_id)
    .eq("user_id", input.actorUserId)
    .maybeSingle();

  if (membershipError) {
    throw new Error(`Could not verify suggestion permissions: ${membershipError.message}`);
  }

  if (!membership) {
    throw new Error("Only group members can add movies to this movie night.");
  }

  if (!canAddSuggestions(event.status)) {
    throw new Error("Movies can only be added while the movie night is in planning or open.");
  }

  await getMovieDetails(input.tmdbMovieId);

  const admin = createAdminClient();
  const note = input.note?.trim() ? input.note.trim() : null;
  const { data: suggestion, error: suggestionError } = await admin
    .from("movie_suggestions")
    .insert({
      event_id: input.eventId,
      note,
      suggested_by_user_id: input.actorUserId,
      tmdb_movie_id: input.tmdbMovieId
    })
    .select("id, tmdb_movie_id, suggested_by_user_id, note, created_at")
    .single<SuggestionRecord>();

  if (suggestionError) {
    if (suggestionError.code === "23505") {
      const { data: existingSuggestion, error: existingError } = await admin
        .from("movie_suggestions")
        .select("id, tmdb_movie_id, suggested_by_user_id, note, created_at")
        .eq("event_id", input.eventId)
        .eq("tmdb_movie_id", input.tmdbMovieId)
        .maybeSingle<SuggestionRecord>();

      if (existingError || !existingSuggestion) {
        throw new Error("That movie is already in this movie night.");
      }

      const [existingView] = await buildSuggestionViews([existingSuggestion], admin);

      return {
        status: "already-exists",
        suggestion: existingView
      };
    }

    throw new Error(`Could not add movie suggestion: ${suggestionError.message}`);
  }

  const [suggestionView] = await buildSuggestionViews([suggestion], admin);

  return {
    status: "added",
    suggestion: suggestionView
  };
}

export async function removeSuggestionFromEvent(
  input: RemoveSuggestionInput & {
    actorUserId: string;
  }
): Promise<RemoveSuggestionResult> {
  const supabase = await createSupabaseClient();
  const { data: event, error: eventError } = await supabase
    .from("movie_night_events")
    .select("id, group_id, status")
    .eq("id", input.eventId)
    .maybeSingle();

  if (eventError) {
    throw new Error(`Could not load movie night for removal: ${eventError.message}`);
  }

  if (!event) {
    throw new Error("Movie night not found.");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", event.group_id)
    .eq("user_id", input.actorUserId)
    .maybeSingle();

  if (membershipError) {
    throw new Error(`Could not verify removal permissions: ${membershipError.message}`);
  }

  if (!membership) {
    throw new Error("Only group members can remove movies from this movie night.");
  }

  if (!canAddSuggestions(event.status)) {
    throw new Error("Movies can only be removed while the movie night is in planning or open.");
  }

  const { data: suggestion, error: suggestionError } = await supabase
    .from("movie_suggestions")
    .select("id, event_id, suggested_by_user_id")
    .eq("id", input.suggestionId)
    .eq("event_id", input.eventId)
    .maybeSingle();

  if (suggestionError) {
    throw new Error(`Could not load movie for removal: ${suggestionError.message}`);
  }

  if (!suggestion) {
    throw new Error("Movie not found.");
  }

  if (suggestion.suggested_by_user_id !== input.actorUserId) {
    throw new Error("You can only remove movies you added.");
  }

  const admin = createAdminClient();
  const { error: deleteError } = await admin
    .from("movie_suggestions")
    .delete()
    .eq("id", input.suggestionId)
    .eq("event_id", input.eventId);

  if (deleteError) {
    throw new Error(`Could not remove movie: ${deleteError.message}`);
  }

  return {
    status: "removed"
  };
}

export async function loadEventPageData(eventId: string): Promise<EventPageData | null> {
  const user = await requireCurrentUser();
  const supabase = await createSupabaseClient();
  const profile = await ensureProfileForUser(user, supabase);

  const { data: event, error: eventError } = await supabase
    .from("movie_night_events")
    .select(
      "id, group_id, title, description, scheduled_for, status, region_code, created_by_user_id, winning_suggestion_id, created_at"
    )
    .eq("id", eventId)
    .maybeSingle();

  if (eventError) {
    throw new Error(`Could not load movie night: ${eventError.message}`);
  }

  if (!event) {
    return null;
  }

  const admin = createAdminClient();
  const [
    { data: membership, error: membershipError },
    { data: group, error: groupError },
    { count: memberCount, error: memberCountError },
    { count: voteCount, error: voteCountError },
    { data: creatorProfile, error: creatorError },
    { data: suggestionRows, error: suggestionsError }
  ] = await Promise.all([
    supabase
      .from("group_members")
      .select("role")
      .eq("group_id", event.group_id)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("groups")
      .select("id, name, country_code, invite_code")
      .eq("id", event.group_id)
      .maybeSingle(),
    admin
      .from("group_members")
      .select("user_id", { count: "exact", head: true })
      .eq("group_id", event.group_id),
    supabase.from("votes").select("id", { count: "exact", head: true }).eq("event_id", eventId),
    admin
      .from("profiles")
      .select("display_name")
      .eq("id", event.created_by_user_id)
      .maybeSingle(),
    admin
      .from("movie_suggestions")
      .select("id, tmdb_movie_id, suggested_by_user_id, note, created_at")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true })
  ]);

  if (membershipError) {
    throw new Error(`Could not load actor movie night role: ${membershipError.message}`);
  }

  if (groupError) {
    throw new Error(`Could not load movie night group: ${groupError.message}`);
  }

  if (memberCountError) {
    throw new Error(`Could not load group member count: ${memberCountError.message}`);
  }

  if (voteCountError) {
    throw new Error(`Could not load vote count: ${voteCountError.message}`);
  }

  if (creatorError) {
    throw new Error(`Could not load movie night creator profile: ${creatorError.message}`);
  }

  if (suggestionsError) {
    throw new Error(`Could not load movie night suggestions: ${suggestionsError.message}`);
  }

  if (!membership || !group) {
    return null;
  }

  const suggestions = await buildSuggestionViews((suggestionRows ?? []) as SuggestionRecord[], admin);
  const normalizedEvent = normalizeEventRecord(event);

  return {
    actorRole: membership.role,
    event: {
      ...normalizedEvent,
      createdByDisplayName: creatorProfile?.display_name ?? normalizedEvent.createdByDisplayName
    },
    group: {
      countryCode: group.country_code.toUpperCase(),
      id: group.id,
      inviteCode: group.invite_code,
      name: group.name
    },
    profile,
    stats: {
      memberCount: memberCount ?? 0,
      suggestionCount: suggestions.length,
      voteCount: voteCount ?? 0
    },
    suggestions
  };
}
