import {
  buildRankedVotes,
  canUserVote,
  canCreateEvent,
  type AddSuggestionInput,
  type CastVoteInput,
  type CreateEventInput,
  type EventStatus,
  getVotePoints,
  type RemoveSuggestionInput,
  type VoteDto,
  type VoteRank
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
  actorVoteRank: VoteRank | null;
  ballotCount: number;
  createdAt: string;
  firstChoiceCount: number;
  id: string;
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
      ballotCount: 0,
      createdAt: row.created_at,
      firstChoiceCount: 0,
      id: row.id,
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
  const suggestions = sortSuggestionsByLeaderboard(
    suggestionViews.map((suggestion) => {
      const metrics = voteMetricsBySuggestionId.get(suggestion.id);

      return {
        ...suggestion,
        actorVoteRank: metrics?.actorVoteRank ?? null,
        ballotCount: metrics?.ballotCount ?? 0,
        firstChoiceCount: metrics?.firstChoiceCount ?? 0,
        points: metrics?.points ?? 0,
        secondChoiceCount: metrics?.secondChoiceCount ?? 0,
        thirdChoiceCount: metrics?.thirdChoiceCount ?? 0
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
