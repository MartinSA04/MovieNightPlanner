import {
  buildRankedVotes,
  canManageEvent,
  canTransitionEventStatus,
  canUserVote,
  canCreateEvent,
  statusClearsWinner,
  statusRequiresWinner,
  type AddSuggestionInput,
  type CastVoteInput,
  type CreateEventInput,
  type EventStatus,
  getVotePoints,
  type RemoveSuggestionInput,
  type TransitionEventStatusInput,
  type VoteDto,
  type VoteRank
} from "@movie-night/domain";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { ensureProfileForUser, requireCurrentUser, type AppProfile } from "@/server/auth";
import { recordCompletedEventForMembers } from "@/server/personal-lists";
import { getMovieDetails, getWatchProviderAvailability } from "@/server/tmdb/client";

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
  actorVoteRank: VoteRank | null;
  availableFlatrateProviders: string[];
  availabilityKnown: boolean;
  ballotCount: number;
  createdAt: string;
  firstChoiceCount: number;
  id: string;
  matchedMemberCount: number;
  note: string | null;
  originalTitle: string | null;
  overview: string | null;
  points: number;
  posterPath: string | null;
  releaseDate: string | null;
  secondChoiceCount: number;
  suggestedByDisplayName: string;
  suggestedByUserId: string;
  thirdChoiceCount: number;
  title: string;
  tmdbMovieId: number;
  totalMemberCount: number;
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

export interface SetEventVotesResult {
  status: "updated";
  voteCount: number;
}

export interface TransitionEventStatusResult {
  event: EventRecordView;
  status: "updated";
}

interface SuggestionRecord {
  created_at: string;
  id: string;
  note: string | null;
  suggested_by_user_id: string;
  tmdb_movie_id: number;
}

interface VoteRecord {
  choice_rank?: number | null;
  created_at: string;
  id: string;
  rank?: number | null;
  suggestion_id: string;
  user_id: string;
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

function normalizeVoteRecord(record: VoteRecord, eventId: string): VoteDto {
  const rawRank = record.choice_rank ?? record.rank;

  if (rawRank !== 1 && rawRank !== 2 && rawRank !== 3) {
    throw new Error("Movie night votes contain an invalid rank.");
  }

  return {
    createdAt: record.created_at,
    eventId,
    id: record.id,
    rank: rawRank,
    suggestionId: record.suggestion_id,
    userId: record.user_id
  };
}

function buildSuggestionVoteMetrics(
  suggestions: EventSuggestionView[],
  votes: VoteDto[],
  actorUserId: string
) {
  const metricsBySuggestionId = new Map(
    suggestions.map((suggestion) => [
      suggestion.id,
      {
        actorVoteRank: null as VoteRank | null,
        ballotCount: 0,
        firstChoiceCount: 0,
        points: 0,
        secondChoiceCount: 0,
        thirdChoiceCount: 0
      }
    ])
  );

  for (const vote of votes) {
    const metrics = metricsBySuggestionId.get(vote.suggestionId);

    if (!metrics) {
      continue;
    }

    metrics.ballotCount += 1;
    metrics.points += getVotePoints(vote.rank);

    if (vote.rank === 1) {
      metrics.firstChoiceCount += 1;
    } else if (vote.rank === 2) {
      metrics.secondChoiceCount += 1;
    } else {
      metrics.thirdChoiceCount += 1;
    }

    if (
      vote.userId === actorUserId &&
      (metrics.actorVoteRank === null || vote.rank < metrics.actorVoteRank)
    ) {
      metrics.actorVoteRank = vote.rank;
    }
  }

  return metricsBySuggestionId;
}

function sortSuggestionsByLeaderboard(suggestions: EventSuggestionView[]) {
  return [...suggestions].sort((left, right) => {
    if (right.points !== left.points) {
      return right.points - left.points;
    }

    if (right.firstChoiceCount !== left.firstChoiceCount) {
      return right.firstChoiceCount - left.firstChoiceCount;
    }

    if (right.secondChoiceCount !== left.secondChoiceCount) {
      return right.secondChoiceCount - left.secondChoiceCount;
    }

    if (right.thirdChoiceCount !== left.thirdChoiceCount) {
      return right.thirdChoiceCount - left.thirdChoiceCount;
    }

    return (
      left.createdAt.localeCompare(right.createdAt) ||
      left.title.localeCompare(right.title)
    );
  });
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
      actorVoteRank: null,
      availabilityKnown: false,
      availableFlatrateProviders: [],
      ballotCount: 0,
      createdAt: row.created_at,
      firstChoiceCount: 0,
      id: row.id,
      matchedMemberCount: 0,
      note: row.note,
      originalTitle: movie?.original_title ?? null,
      overview: movie?.overview ?? null,
      points: 0,
      posterPath: movie?.poster_path ?? null,
      releaseDate: movie?.release_date ?? null,
      secondChoiceCount: 0,
      suggestedByDisplayName: profile?.display_name ?? "Movie fan",
      suggestedByUserId: row.suggested_by_user_id,
      thirdChoiceCount: 0,
      title: movie?.title ?? `TMDb ${row.tmdb_movie_id}`,
      tmdbMovieId: row.tmdb_movie_id,
      totalMemberCount: 0
    };
  });
}

interface WatchProviderCacheRow {
  flatrate_json: unknown;
  region_code: string;
  tmdb_movie_id: number;
}

interface WatchProviderEntry {
  provider_id?: number;
  provider_name?: string;
}

function parseProviderEntries(value: unknown): WatchProviderEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is WatchProviderEntry =>
      typeof entry === "object" && entry !== null
  );
}

async function loadAvailabilityByMovieId(
  tmdbMovieIds: number[],
  regionCode: string,
  admin = createAdminClient()
): Promise<Map<number, { providerIds: Set<number>; providerNames: string[] }>> {
  const result = new Map<number, { providerIds: Set<number>; providerNames: string[] }>();
  if (tmdbMovieIds.length === 0) return result;

  const { data, error } = await admin
    .from("watch_provider_cache")
    .select("tmdb_movie_id, region_code, flatrate_json")
    .in("tmdb_movie_id", tmdbMovieIds)
    .eq("region_code", regionCode.toUpperCase());

  if (error) {
    throw new Error(`Could not load watch providers: ${error.message}`);
  }

  for (const row of (data ?? []) as WatchProviderCacheRow[]) {
    const entries = parseProviderEntries(row.flatrate_json);
    const providerIds = new Set<number>();
    const providerNames: string[] = [];
    for (const entry of entries) {
      if (typeof entry.provider_id === "number") {
        providerIds.add(entry.provider_id);
      }
      if (typeof entry.provider_name === "string") {
        providerNames.push(entry.provider_name);
      }
    }
    result.set(row.tmdb_movie_id, { providerIds, providerNames });
  }

  return result;
}

async function loadMemberProviderIdsByUserId(
  groupId: string,
  admin = createAdminClient()
): Promise<Map<string, Set<number>>> {
  const members = new Map<string, Set<number>>();

  const { data: memberRows, error: memberError } = await admin
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId);

  if (memberError) {
    throw new Error(`Could not load group members: ${memberError.message}`);
  }

  const userIds = (memberRows ?? []).map((row) => row.user_id);
  for (const userId of userIds) members.set(userId, new Set());

  if (userIds.length === 0) return members;

  const { data: subs, error: subsError } = await admin
    .from("user_streaming_services")
    .select("user_id, streaming_services(tmdb_provider_id)")
    .in("user_id", userIds);

  if (subsError) {
    throw new Error(`Could not load member streaming services: ${subsError.message}`);
  }

  for (const row of (subs ?? []) as Array<{
    user_id: string;
    streaming_services: { tmdb_provider_id: number } | { tmdb_provider_id: number }[] | null;
  }>) {
    const service = Array.isArray(row.streaming_services)
      ? row.streaming_services[0]
      : row.streaming_services;
    if (!service) continue;
    const bucket = members.get(row.user_id) ?? new Set<number>();
    bucket.add(service.tmdb_provider_id);
    members.set(row.user_id, bucket);
  }

  return members;
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

  const { data: eventRegionRow } = await supabase
    .from("movie_night_events")
    .select("region_code")
    .eq("id", input.eventId)
    .maybeSingle();

  if (eventRegionRow?.region_code) {
    try {
      await getWatchProviderAvailability(input.tmdbMovieId, eventRegionRow.region_code);
    } catch (providerError) {
      console.warn(
        `Could not warm watch provider cache for tmdb ${input.tmdbMovieId}`,
        providerError
      );
    }
  }

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

export async function setEventVotes(
  input: CastVoteInput & {
    actorUserId: string;
  }
): Promise<SetEventVotesResult> {
  const supabase = await createSupabaseClient();
  const { data: event, error: eventError } = await supabase
    .from("movie_night_events")
    .select("id, group_id, status")
    .eq("id", input.eventId)
    .maybeSingle();

  if (eventError) {
    throw new Error(`Could not load movie night for voting: ${eventError.message}`);
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
    throw new Error(`Could not verify voting permissions: ${membershipError.message}`);
  }

  if (!membership) {
    throw new Error("Only group members can vote.");
  }

  if (!canUserVote({ eventStatus: event.status, isGroupMember: true })) {
    throw new Error("Votes can only be changed while the movie night is in planning or open.");
  }

  if (input.suggestionIds.length > 0) {
    const { data: suggestionRows, error: suggestionError } = await supabase
      .from("movie_suggestions")
      .select("id")
      .eq("event_id", input.eventId)
      .in("id", input.suggestionIds);

    if (suggestionError) {
      throw new Error(`Could not validate movie picks: ${suggestionError.message}`);
    }

    const availableSuggestionIds = new Set((suggestionRows ?? []).map((row) => row.id));

    if (availableSuggestionIds.size !== input.suggestionIds.length) {
      throw new Error("Pick movies from this movie night only.");
    }
  }

  const nextVotes = buildRankedVotes({
    eventId: input.eventId,
    suggestionIds: input.suggestionIds,
    userId: input.actorUserId
  });

  const admin = createAdminClient();
  const { error: deleteError } = await admin
    .from("votes")
    .delete()
    .eq("event_id", input.eventId)
    .eq("user_id", input.actorUserId);

  if (deleteError) {
    throw new Error(`Could not clear existing picks: ${deleteError.message}`);
  }

  if (nextVotes.length > 0) {
    const { error: insertError } = await admin.from("votes").insert(
      nextVotes.map((vote) => ({
        choice_rank: vote.rank,
        event_id: vote.eventId,
        suggestion_id: vote.suggestionId,
        user_id: vote.userId
      }))
    );

    if (insertError) {
      throw new Error(`Could not save ranked picks: ${insertError.message}`);
    }
  }

  return {
    status: "updated",
    voteCount: nextVotes.length
  };
}

async function pickWinningSuggestionFromVotes(
  eventId: string,
  admin = createAdminClient()
): Promise<string | null> {
  const [{ data: suggestionRows, error: suggestionError }, { data: voteRows, error: voteError }] =
    await Promise.all([
      admin
        .from("movie_suggestions")
        .select("id, tmdb_movie_id, suggested_by_user_id, note, created_at")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true }),
      admin.from("votes").select("*").eq("event_id", eventId)
    ]);

  if (suggestionError) {
    throw new Error(`Could not load suggestions for winner pick: ${suggestionError.message}`);
  }

  if (voteError) {
    throw new Error(`Could not load votes for winner pick: ${voteError.message}`);
  }

  const suggestionRowList = (suggestionRows ?? []) as SuggestionRecord[];

  if (suggestionRowList.length === 0) {
    return null;
  }

  const suggestionViews = suggestionRowList.map((row) => ({
    actorVoteRank: null,
    availabilityKnown: false,
    availableFlatrateProviders: [],
    ballotCount: 0,
    createdAt: row.created_at,
    firstChoiceCount: 0,
    id: row.id,
    matchedMemberCount: 0,
    note: row.note,
    originalTitle: null,
    overview: null,
    points: 0,
    posterPath: null,
    releaseDate: null,
    secondChoiceCount: 0,
    suggestedByDisplayName: "",
    suggestedByUserId: row.suggested_by_user_id,
    thirdChoiceCount: 0,
    title: "",
    tmdbMovieId: row.tmdb_movie_id,
    totalMemberCount: 0
  })) as EventSuggestionView[];

  const normalizedVotes = ((voteRows ?? []) as VoteRecord[]).map((row) =>
    normalizeVoteRecord(row, eventId)
  );
  const metricsBySuggestionId = buildSuggestionVoteMetrics(suggestionViews, normalizedVotes, "");

  const enriched = suggestionViews.map((suggestion) => {
    const metrics = metricsBySuggestionId.get(suggestion.id);
    return {
      ...suggestion,
      ballotCount: metrics?.ballotCount ?? 0,
      firstChoiceCount: metrics?.firstChoiceCount ?? 0,
      points: metrics?.points ?? 0,
      secondChoiceCount: metrics?.secondChoiceCount ?? 0,
      thirdChoiceCount: metrics?.thirdChoiceCount ?? 0
    };
  });

  const sorted = sortSuggestionsByLeaderboard(enriched);
  const top = sorted[0];

  if (!top || top.points === 0) {
    return null;
  }

  return top.id;
}

export async function transitionEventStatus(
  input: TransitionEventStatusInput & {
    actorUserId: string;
  }
): Promise<TransitionEventStatusResult> {
  const supabase = await createSupabaseClient();
  const { data: event, error: eventError } = await supabase
    .from("movie_night_events")
    .select(
      "id, group_id, title, description, scheduled_for, status, region_code, created_by_user_id, winning_suggestion_id, created_at"
    )
    .eq("id", input.eventId)
    .maybeSingle();

  if (eventError) {
    throw new Error(`Could not load movie night: ${eventError.message}`);
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
    throw new Error(`Could not verify movie night permissions: ${membershipError.message}`);
  }

  if (!membership || !canManageEvent(membership.role)) {
    throw new Error("Only group owners and admins can change movie night status.");
  }

  if (!canTransitionEventStatus(event.status, input.status)) {
    throw new Error(
      `Movie night cannot go from "${event.status}" to "${input.status}".`
    );
  }

  const admin = createAdminClient();
  let nextWinningSuggestionId: string | null = event.winning_suggestion_id;

  if (statusRequiresWinner(input.status)) {
    const explicit = input.winningSuggestionId ?? null;

    if (explicit) {
      const { data: suggestion, error: suggestionError } = await admin
        .from("movie_suggestions")
        .select("id")
        .eq("event_id", input.eventId)
        .eq("id", explicit)
        .maybeSingle();

      if (suggestionError) {
        throw new Error(`Could not verify winning movie: ${suggestionError.message}`);
      }

      if (!suggestion) {
        throw new Error("Pick a movie from this movie night.");
      }

      nextWinningSuggestionId = suggestion.id;
    } else if (!nextWinningSuggestionId) {
      nextWinningSuggestionId = await pickWinningSuggestionFromVotes(input.eventId, admin);

      if (!nextWinningSuggestionId) {
        throw new Error(
          "No votes yet. Pick a winning movie explicitly to lock this movie night."
        );
      }
    }
  } else if (statusClearsWinner(input.status)) {
    nextWinningSuggestionId = null;
  }

  const { data: updated, error: updateError } = await admin
    .from("movie_night_events")
    .update({
      status: input.status,
      winning_suggestion_id: nextWinningSuggestionId
    })
    .eq("id", input.eventId)
    .select(
      "id, group_id, title, description, scheduled_for, status, region_code, created_by_user_id, winning_suggestion_id, created_at"
    )
    .single();

  if (updateError) {
    throw new Error(`Could not update movie night status: ${updateError.message}`);
  }

  if (input.status === "completed" && nextWinningSuggestionId) {
    const { data: winningSuggestion } = await admin
      .from("movie_suggestions")
      .select("tmdb_movie_id")
      .eq("id", nextWinningSuggestionId)
      .maybeSingle();

    if (winningSuggestion?.tmdb_movie_id) {
      await recordCompletedEventForMembers({
        eventId: input.eventId,
        groupId: event.group_id,
        tmdbMovieId: winningSuggestion.tmdb_movie_id
      });
    }
  }

  return {
    event: normalizeEventRecord(updated),
    status: "updated"
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
    { data: creatorProfile, error: creatorError },
    { data: suggestionRows, error: suggestionsError },
    { data: voteRows, error: votesError }
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
    admin
      .from("profiles")
      .select("display_name")
      .eq("id", event.created_by_user_id)
      .maybeSingle(),
    admin
      .from("movie_suggestions")
      .select("id, tmdb_movie_id, suggested_by_user_id, note, created_at")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true }),
    admin
      .from("votes")
      .select("*")
      .eq("event_id", eventId)
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

  if (creatorError) {
    throw new Error(`Could not load movie night creator profile: ${creatorError.message}`);
  }

  if (suggestionsError) {
    throw new Error(`Could not load movie night suggestions: ${suggestionsError.message}`);
  }

  if (votesError) {
    throw new Error(`Could not load movie night votes: ${votesError.message}`);
  }

  if (!membership || !group) {
    return null;
  }

  const normalizedVotes = ((voteRows ?? []) as VoteRecord[]).map((row) =>
    normalizeVoteRecord(row, eventId)
  );
  const suggestionViews = await buildSuggestionViews((suggestionRows ?? []) as SuggestionRecord[], admin);
  const voteMetricsBySuggestionId = buildSuggestionVoteMetrics(suggestionViews, normalizedVotes, user.id);

  const suggestionMovieIds = Array.from(
    new Set(suggestionViews.map((suggestion) => suggestion.tmdbMovieId))
  );
  const [availabilityByMovieId, memberProviderIdsByUserId] = await Promise.all([
    loadAvailabilityByMovieId(suggestionMovieIds, event.region_code, admin),
    loadMemberProviderIdsByUserId(event.group_id, admin)
  ]);
  const totalMemberCount = memberProviderIdsByUserId.size;

  const suggestions = sortSuggestionsByLeaderboard(
    suggestionViews.map((suggestion) => {
      const metrics = voteMetricsBySuggestionId.get(suggestion.id);
      const availability = availabilityByMovieId.get(suggestion.tmdbMovieId);
      let matchedMemberCount = 0;

      if (availability) {
        for (const providerIds of memberProviderIdsByUserId.values()) {
          for (const providerId of providerIds) {
            if (availability.providerIds.has(providerId)) {
              matchedMemberCount += 1;
              break;
            }
          }
        }
      }

      return {
        ...suggestion,
        actorVoteRank: metrics?.actorVoteRank ?? null,
        availabilityKnown: availability !== undefined,
        availableFlatrateProviders: availability?.providerNames ?? [],
        ballotCount: metrics?.ballotCount ?? 0,
        firstChoiceCount: metrics?.firstChoiceCount ?? 0,
        matchedMemberCount,
        points: metrics?.points ?? 0,
        secondChoiceCount: metrics?.secondChoiceCount ?? 0,
        thirdChoiceCount: metrics?.thirdChoiceCount ?? 0,
        totalMemberCount
      };
    })
  );
  const normalizedEvent = normalizeEventRecord(event);
  const ballotCount = new Set(normalizedVotes.map((vote) => vote.userId)).size;

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
      voteCount: ballotCount
    },
    suggestions
  };
}
