import { getVotePoints, type EventStatus, type VoteRank } from "@movie-night/domain";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ensureProfileForUser,
  getCurrentUser,
  requireCurrentUser,
  type AppProfile
} from "@/server/auth";
import { makeInviteCode, normalizeInviteCode } from "@/server/invite-code";

export interface DashboardGroup {
  countryCode: string;
  createdAt: string;
  id: string;
  inviteCode: string;
  name: string;
  role: "owner" | "admin" | "member";
}

export interface DashboardData {
  groups: DashboardGroup[];
  profile: AppProfile;
}

export interface DashboardGroupPreview extends DashboardGroup {
  memberCount: number;
}

export interface DashboardMovieNightPreview {
  groupId: string;
  groupName: string;
  id: string;
  isUpcomingHighlight: boolean;
  memberCount: number;
  scheduledFor: string | null;
  status: EventStatus;
  title: string;
  topVote: GroupEventPreview["topVote"];
}

export interface DashboardPageData {
  groups: DashboardGroupPreview[];
  movieNights: DashboardMovieNightPreview[];
  profile: AppProfile;
  upcomingMovieNights: DashboardMovieNightPreview[];
}

export interface NavigationGroup {
  countryCode: string;
  id: string;
  name: string;
  role: "owner" | "admin" | "member";
}

export interface GroupMemberView {
  avatarUrl: string | null;
  countryCode: string;
  displayName: string;
  email: string;
  joinedAt: string;
  role: "owner" | "admin" | "member";
  userId: string;
}

export interface GroupEventPreview {
  id: string;
  isUpcomingHighlight: boolean;
  scheduledFor: string | null;
  status: EventStatus;
  title: string;
  topVote: {
    posterPath: string | null;
    releaseDate: string | null;
    title: string;
  } | null;
}

export interface GroupPageData {
  actorRole: "owner" | "admin" | "member";
  events: GroupEventPreview[];
  group: {
    countryCode: string;
    createdAt: string;
    id: string;
    inviteCode: string;
    name: string;
  };
  members: GroupMemberView[];
  profile: AppProfile;
}

export interface InvitePreviewData {
  currentUserMembershipRole: "owner" | "admin" | "member" | null;
  group: {
    countryCode: string;
    id: string;
    inviteCode: string;
    name: string;
  };
  isAuthenticated: boolean;
  memberCount: number;
}

export type JoinGroupByInviteResult =
  | {
      group: {
        countryCode: string;
        id: string;
        inviteCode: string;
        name: string;
      };
      status: "already-member" | "joined";
    }
  | {
      status: "not-found";
    };

function normalizeGroupRecord(record: Record<string, unknown>, role: DashboardGroup["role"]) {
  return {
    countryCode:
      typeof record.country_code === "string" ? record.country_code.toUpperCase() : "US",
    createdAt: typeof record.created_at === "string" ? record.created_at : "",
    id: typeof record.id === "string" ? record.id : "",
    inviteCode: typeof record.invite_code === "string" ? record.invite_code : "",
    name: typeof record.name === "string" ? record.name : "Untitled group",
    role
    };
}

interface GroupSuggestionRecord {
  created_at: string;
  event_id: string;
  id: string;
  tmdb_movie_id: number;
}

interface GroupEventRecord {
  created_at: string;
  id: string;
  scheduled_for: string | null;
  status: EventStatus;
  title: string;
}

interface DashboardGroupEventRecord extends GroupEventRecord {
  group_id: string;
}

interface GroupVoteRecord {
  choice_rank?: number | null;
  event_id: string;
  id: string;
  rank?: number | null;
  suggestion_id: string;
  user_id: string;
}

interface GroupSuggestionLeader {
  createdAt: string;
  eventId: string;
  firstChoiceCount: number;
  id: string;
  points: number;
  posterPath: string | null;
  releaseDate: string | null;
  secondChoiceCount: number;
  thirdChoiceCount: number;
  title: string;
}

const GROUP_EVENT_STALE_AFTER_MS = 24 * 60 * 60 * 1000;
const GROUP_EVENT_LIMIT = 6;

async function loadGroupsForUser(userId: string, supabase: Awaited<ReturnType<typeof createSupabaseClient>>) {
  const { data: membershipRows, error: membershipsError } = await supabase
    .from("group_members")
    .select("group_id, role, joined_at")
    .eq("user_id", userId)
    .order("joined_at", { ascending: false });

  if (membershipsError) {
    throw new Error(`Could not load memberships: ${membershipsError.message}`);
  }

  const memberships = membershipRows ?? [];
  const groupIds = memberships.map((row) => row.group_id);

  if (groupIds.length === 0) {
    return [];
  }

  const { data: groupRows, error: groupsError } = await supabase
    .from("groups")
    .select("id, name, country_code, invite_code, created_at")
    .in("id", groupIds);

  if (groupsError) {
    throw new Error(`Could not load groups: ${groupsError.message}`);
  }

  const groupsById = new Map(
    (groupRows ?? []).map((row) => [row.id, normalizeGroupRecord(row, "member")])
  );

  return memberships
    .map((membership) => {
      const baseGroup = groupsById.get(membership.group_id);

      if (!baseGroup) {
        return null;
      }

      return {
        ...baseGroup,
        role: membership.role
      };
    })
    .filter((group): group is DashboardGroup => group !== null);
}

function mapGroupPreview(record: {
  country_code: string;
  id: string;
  invite_code: string;
  name: string;
}) {
  return {
    countryCode: record.country_code.toUpperCase(),
    id: record.id,
    inviteCode: record.invite_code,
    name: record.name
  };
}

function normalizeGroupVoteRank(record: GroupVoteRecord): VoteRank {
  const rawRank = record.choice_rank ?? record.rank;

  if (rawRank !== 1 && rawRank !== 2 && rawRank !== 3) {
    throw new Error("Movie night votes contain an invalid rank.");
  }

  return rawRank;
}

function compareGroupSuggestionLeaders(left: GroupSuggestionLeader, right: GroupSuggestionLeader) {
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

  return left.createdAt.localeCompare(right.createdAt) || left.title.localeCompare(right.title);
}

function parseGroupEventTime(value: string | null) {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);

  return Number.isNaN(timestamp) ? null : timestamp;
}

function shouldShowGroupEvent(event: GroupEventRecord, now: number) {
  const scheduledAt = parseGroupEventTime(event.scheduled_for);

  if (scheduledAt === null) {
    return true;
  }

  return scheduledAt >= now - GROUP_EVENT_STALE_AFTER_MS;
}

function getGroupEventSortBucket(event: GroupEventRecord, now: number) {
  const scheduledAt = parseGroupEventTime(event.scheduled_for);

  if (scheduledAt === null) {
    return 1;
  }

  if (scheduledAt >= now) {
    return 0;
  }

  return 2;
}

function compareGroupEvents(left: GroupEventRecord, right: GroupEventRecord, now: number) {
  const leftBucket = getGroupEventSortBucket(left, now);
  const rightBucket = getGroupEventSortBucket(right, now);

  if (leftBucket !== rightBucket) {
    return leftBucket - rightBucket;
  }

  const leftScheduledAt = parseGroupEventTime(left.scheduled_for);
  const rightScheduledAt = parseGroupEventTime(right.scheduled_for);

  if (leftBucket === 0 && leftScheduledAt !== null && rightScheduledAt !== null) {
    return leftScheduledAt - rightScheduledAt;
  }

  if (leftBucket === 2 && leftScheduledAt !== null && rightScheduledAt !== null) {
    return rightScheduledAt - leftScheduledAt;
  }

  return right.created_at.localeCompare(left.created_at) || left.title.localeCompare(right.title);
}

function buildGroupEventPreviews(
  events: GroupEventRecord[],
  topVotesByEventId: Map<string, GroupEventPreview["topVote"]>,
  now: number
): GroupEventPreview[] {
  const visibleEvents = events
    .filter((event) => shouldShowGroupEvent(event, now))
    .sort((left, right) => compareGroupEvents(left, right, now))
    .slice(0, GROUP_EVENT_LIMIT);

  const upcomingHighlightId =
    visibleEvents.find((event) => {
      const scheduledAt = parseGroupEventTime(event.scheduled_for);
      return scheduledAt !== null && scheduledAt >= now;
    })?.id ?? null;

  return visibleEvents.map((event) => ({
    id: event.id,
    isUpcomingHighlight: event.id === upcomingHighlightId,
    scheduledFor: event.scheduled_for,
    status: event.status,
    title: event.title,
    topVote: topVotesByEventId.get(event.id) ?? null
  }));
}

function buildDashboardMovieNightPreviews(input: {
  events: DashboardGroupEventRecord[];
  groupsById: Map<string, DashboardGroup>;
  memberCountsByGroupId: Map<string, number>;
  topVotesByEventId: Map<string, GroupEventPreview["topVote"]>;
  now: number;
}): DashboardMovieNightPreview[] {
  const visibleEvents = input.events
    .filter((event) => shouldShowGroupEvent(event, input.now))
    .sort((left, right) => compareGroupEvents(left, right, input.now))
    .slice(0, 24);

  const upcomingHighlightId =
    visibleEvents.find((event) => {
      const scheduledAt = parseGroupEventTime(event.scheduled_for);
      return scheduledAt !== null && scheduledAt >= input.now;
    })?.id ?? null;

  return visibleEvents
    .map((event) => {
      const group = input.groupsById.get(event.group_id);

      if (!group) {
        return null;
      }

      return {
        groupId: group.id,
        groupName: group.name,
        id: event.id,
        isUpcomingHighlight: event.id === upcomingHighlightId,
        memberCount: input.memberCountsByGroupId.get(group.id) ?? 0,
        scheduledFor: event.scheduled_for,
        status: event.status,
        title: event.title,
        topVote: input.topVotesByEventId.get(event.id) ?? null
      };
    })
    .filter((event): event is DashboardMovieNightPreview => event !== null);
}

async function loadTopVotesByEventId(
  eventIds: string[],
  admin = createAdminClient()
): Promise<Map<string, GroupEventPreview["topVote"]>> {
  if (eventIds.length === 0) {
    return new Map();
  }

  const [
    { data: suggestionRows, error: suggestionsError },
    { data: voteRows, error: votesError }
  ] = await Promise.all([
    admin
      .from("movie_suggestions")
      .select("id, event_id, tmdb_movie_id, created_at")
      .in("event_id", eventIds),
    admin
      .from("votes")
      .select("*")
      .in("event_id", eventIds)
  ]);

  if (suggestionsError) {
    throw new Error(`Could not load group movie suggestions: ${suggestionsError.message}`);
  }

  if (votesError) {
    throw new Error(`Could not load group movie night votes: ${votesError.message}`);
  }

  const suggestions = (suggestionRows ?? []) as GroupSuggestionRecord[];

  if (suggestions.length === 0) {
    return new Map();
  }

  const movieIds = Array.from(new Set(suggestions.map((suggestion) => suggestion.tmdb_movie_id)));
  const { data: movieRows, error: movieError } = movieIds.length
    ? await admin
        .from("movie_cache")
        .select("tmdb_movie_id, title, poster_path, release_date")
        .in("tmdb_movie_id", movieIds)
    : { data: [], error: null };

  if (movieError) {
    throw new Error(`Could not load group movie details: ${movieError.message}`);
  }

  const moviesByMovieId = new Map((movieRows ?? []).map((row) => [row.tmdb_movie_id, row]));
  const leadersBySuggestionId = new Map<string, GroupSuggestionLeader>();
  const suggestionIdsByEventId = new Map<string, string[]>();

  for (const suggestion of suggestions) {
    const movie = moviesByMovieId.get(suggestion.tmdb_movie_id);

    leadersBySuggestionId.set(suggestion.id, {
      createdAt: suggestion.created_at,
      eventId: suggestion.event_id,
      firstChoiceCount: 0,
      id: suggestion.id,
      points: 0,
      posterPath: movie?.poster_path ?? null,
      releaseDate: movie?.release_date ?? null,
      secondChoiceCount: 0,
      thirdChoiceCount: 0,
      title: movie?.title ?? `TMDb ${suggestion.tmdb_movie_id}`
    });

    const currentEventSuggestionIds = suggestionIdsByEventId.get(suggestion.event_id) ?? [];
    currentEventSuggestionIds.push(suggestion.id);
    suggestionIdsByEventId.set(suggestion.event_id, currentEventSuggestionIds);
  }

  for (const vote of (voteRows ?? []) as GroupVoteRecord[]) {
    const leader = leadersBySuggestionId.get(vote.suggestion_id);

    if (!leader) {
      continue;
    }

    const rank = normalizeGroupVoteRank(vote);
    leader.points += getVotePoints(rank);

    if (rank === 1) {
      leader.firstChoiceCount += 1;
    } else if (rank === 2) {
      leader.secondChoiceCount += 1;
    } else {
      leader.thirdChoiceCount += 1;
    }
  }

  const topVotesByEventId = new Map<string, GroupEventPreview["topVote"]>();

  for (const [eventId, suggestionIds] of suggestionIdsByEventId) {
    const topLeader = suggestionIds
      .map((suggestionId) => leadersBySuggestionId.get(suggestionId))
      .filter((leader): leader is GroupSuggestionLeader => leader !== undefined)
      .sort(compareGroupSuggestionLeaders)[0];

    if (!topLeader || topLeader.points === 0) {
      continue;
    }

    topVotesByEventId.set(eventId, {
      posterPath: topLeader.posterPath,
      releaseDate: topLeader.releaseDate,
      title: topLeader.title
    });
  }

  return topVotesByEventId;
}

export async function loadDashboardData(): Promise<DashboardData> {
  const user = await requireCurrentUser();
  const supabase = await createSupabaseClient();
  const profile = await ensureProfileForUser(user, supabase);
  const groups = await loadGroupsForUser(user.id, supabase);

  return {
    groups,
    profile
  };
}

export async function loadNavigationGroups(): Promise<NavigationGroup[]> {
  const user = await requireCurrentUser();
  const supabase = await createSupabaseClient();

  return loadGroupsForUser(user.id, supabase);
}

export async function loadDashboardPageData(): Promise<DashboardPageData> {
  const user = await requireCurrentUser();
  const supabase = await createSupabaseClient();
  const profile = await ensureProfileForUser(user, supabase);
  const groups = await loadGroupsForUser(user.id, supabase);

  if (groups.length === 0) {
    return {
      groups: [],
      movieNights: [],
      profile,
      upcomingMovieNights: []
    };
  }

  const now = Date.now();
  const groupIds = groups.map((group) => group.id);
  const groupsById = new Map(groups.map((group) => [group.id, group]));
  const admin = createAdminClient();
  const [
    { data: eventRows, error: eventsError },
    { data: membershipRows, error: membershipsError }
  ] = await Promise.all([
    admin
      .from("movie_night_events")
      .select("id, group_id, title, status, scheduled_for, created_at")
      .in("group_id", groupIds),
    admin
      .from("group_members")
      .select("group_id")
      .in("group_id", groupIds)
  ]);

  if (eventsError) {
    throw new Error(`Could not load dashboard movie nights: ${eventsError.message}`);
  }

  if (membershipsError) {
    throw new Error(`Could not load dashboard group memberships: ${membershipsError.message}`);
  }

  const memberCountsByGroupId = new Map<string, number>();

  for (const membership of membershipRows ?? []) {
    memberCountsByGroupId.set(
      membership.group_id,
      (memberCountsByGroupId.get(membership.group_id) ?? 0) + 1
    );
  }

  const dashboardEvents = (eventRows ?? []) as DashboardGroupEventRecord[];
  const visibleEventIds = dashboardEvents
    .filter((event) => shouldShowGroupEvent(event, now))
    .map((event) => event.id);
  const topVotesByEventId = await loadTopVotesByEventId(visibleEventIds, admin);
  const movieNights = buildDashboardMovieNightPreviews({
    events: dashboardEvents,
    groupsById,
    memberCountsByGroupId,
    now,
    topVotesByEventId
  });
  const groupPreviews = groups.map((group) => ({
    ...group,
    memberCount: memberCountsByGroupId.get(group.id) ?? 0
  }));

  return {
    groups: groupPreviews,
    movieNights,
    profile,
    upcomingMovieNights: movieNights.filter((movieNight) => {
      const scheduledAt = parseGroupEventTime(movieNight.scheduledFor);
      return scheduledAt !== null && scheduledAt >= now;
    })
  };
}

export async function createGroupForOwner(input: {
  countryCode: string;
  name: string;
  ownerUserId: string;
}) {
  const admin = createAdminClient();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const inviteCode = makeInviteCode();
    const { data: group, error: groupError } = await admin
      .from("groups")
      .insert({
        country_code: input.countryCode,
        invite_code: inviteCode,
        name: input.name,
        owner_user_id: input.ownerUserId
      })
      .select("id, name, country_code, invite_code, created_at")
      .single();

    if (groupError) {
      if (groupError.code === "23505") {
        continue;
      }

      throw new Error(`Could not create group: ${groupError.message}`);
    }

    const { error: membershipError } = await admin.from("group_members").insert({
      group_id: group.id,
      role: "owner",
      user_id: input.ownerUserId
    });

    if (membershipError) {
      await admin.from("groups").delete().eq("id", group.id);
      throw new Error(`Could not create owner membership: ${membershipError.message}`);
    }

    return group;
  }

  throw new Error("Could not generate a unique invite code for the new group.");
}

export async function deleteGroupForOwner(input: {
  actorUserId: string;
  groupId: string;
}) {
  const supabase = await createSupabaseClient();
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id, owner_user_id")
    .eq("id", input.groupId)
    .maybeSingle();

  if (groupError) {
    throw new Error(`Could not load group for deletion: ${groupError.message}`);
  }

  if (!group) {
    throw new Error("Group not found.");
  }

  if (group.owner_user_id !== input.actorUserId) {
    throw new Error("Only the group owner can delete this group.");
  }

  const admin = createAdminClient();
  const { error: deleteError } = await admin.from("groups").delete().eq("id", input.groupId);

  if (deleteError) {
    throw new Error(`Could not delete group: ${deleteError.message}`);
  }
}

export async function joinGroupByInviteCode(input: {
  inviteCode: string;
  userId: string;
}): Promise<JoinGroupByInviteResult> {
  const normalizedInviteCode = normalizeInviteCode(input.inviteCode);

  if (!normalizedInviteCode) {
    return { status: "not-found" };
  }

  const admin = createAdminClient();
  const { data: group, error: groupError } = await admin
    .from("groups")
    .select("id, name, country_code, invite_code")
    .eq("invite_code", normalizedInviteCode)
    .maybeSingle();

  if (groupError) {
    throw new Error(`Could not load invite target: ${groupError.message}`);
  }

  if (!group) {
    return { status: "not-found" };
  }

  const { data: membership, error: membershipError } = await admin
    .from("group_members")
    .select("role")
    .eq("group_id", group.id)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (membershipError) {
    throw new Error(`Could not verify membership for invite join: ${membershipError.message}`);
  }

  if (membership) {
    return {
      group: mapGroupPreview(group),
      status: "already-member"
    };
  }

  const { error: joinError } = await admin.from("group_members").insert({
    group_id: group.id,
    role: "member",
    user_id: input.userId
  });

  if (joinError) {
    if (joinError.code === "23505") {
      return {
        group: mapGroupPreview(group),
        status: "already-member"
      };
    }

    throw new Error(`Could not join group from invite: ${joinError.message}`);
  }

  return {
    group: mapGroupPreview(group),
    status: "joined"
  };
}

export async function loadGroupPageData(groupId: string): Promise<GroupPageData | null> {
  const user = await requireCurrentUser();
  const supabase = await createSupabaseClient();
  const profile = await ensureProfileForUser(user, supabase);
  const now = Date.now();

  const [{ data: membership, error: membershipError }, { data: group, error: groupError }, { data: events, error: eventsError }] =
    await Promise.all([
      supabase
        .from("group_members")
        .select("role, joined_at")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("groups")
        .select("id, name, country_code, invite_code, created_at")
        .eq("id", groupId)
        .maybeSingle(),
      supabase
        .from("movie_night_events")
        .select("id, title, status, scheduled_for, created_at")
        .eq("group_id", groupId)
        .order("scheduled_for", { ascending: true, nullsFirst: false })
    ]);

  if (membershipError) {
    throw new Error(`Could not verify group membership: ${membershipError.message}`);
  }

  if (groupError) {
    throw new Error(`Could not load group: ${groupError.message}`);
  }

  if (eventsError) {
    throw new Error(`Could not load group movie nights: ${eventsError.message}`);
  }

  if (!membership || !group) {
    return null;
  }

  const admin = createAdminClient();
  const { data: memberRows, error: membersError } = await admin
    .from("group_members")
    .select("user_id, role, joined_at")
    .eq("group_id", groupId)
    .order("joined_at", { ascending: true });

  if (membersError) {
    throw new Error(`Could not load group members: ${membersError.message}`);
  }

  const userIds = (memberRows ?? []).map((row) => row.user_id);
  const { data: profileRows, error: profilesError } = userIds.length
    ? await admin
        .from("profiles")
        .select("id, display_name, email, avatar_url, country_code")
        .in("id", userIds)
    : { data: [], error: null };

  if (profilesError) {
    throw new Error(`Could not load member profiles: ${profilesError.message}`);
  }

  const visibleEvents = ((events ?? []) as GroupEventRecord[])
    .filter((event) => shouldShowGroupEvent(event, now))
    .sort((left, right) => compareGroupEvents(left, right, now))
    .slice(0, GROUP_EVENT_LIMIT);
  const topVotesByEventId = await loadTopVotesByEventId(visibleEvents.map((event) => event.id), admin);

  const profilesById = new Map((profileRows ?? []).map((row) => [row.id, row]));
  const members: GroupMemberView[] = (memberRows ?? []).map((row) => {
    const memberProfile = profilesById.get(row.user_id);

    return {
      avatarUrl: memberProfile?.avatar_url ?? null,
      countryCode: memberProfile?.country_code?.toUpperCase() ?? "US",
      displayName: memberProfile?.display_name ?? "Movie fan",
      email: memberProfile?.email ?? "",
      joinedAt: row.joined_at,
      role: row.role,
      userId: row.user_id
    };
  });

  return {
    actorRole: membership.role,
    events: buildGroupEventPreviews(visibleEvents, topVotesByEventId, now),
    group: {
      countryCode: group.country_code.toUpperCase(),
      createdAt: group.created_at,
      id: group.id,
      inviteCode: group.invite_code,
      name: group.name
    },
    members,
    profile
  };
}

export async function loadInvitePageData(inviteCode: string): Promise<InvitePreviewData | null> {
  const normalizedInviteCode = normalizeInviteCode(inviteCode);

  if (!normalizedInviteCode) {
    return null;
  }

  const admin = createAdminClient();
  const { data: group, error: groupError } = await admin
    .from("groups")
    .select("id, name, country_code, invite_code")
    .eq("invite_code", normalizedInviteCode)
    .maybeSingle();

  if (groupError) {
    throw new Error(`Could not load invite details: ${groupError.message}`);
  }

  if (!group) {
    return null;
  }

  const user = await getCurrentUser();
  const supabase = user ? await createSupabaseClient() : null;
  const [{ count: memberCount, error: memberCountError }, membershipResult] = await Promise.all([
    admin.from("group_members").select("user_id", { count: "exact", head: true }).eq("group_id", group.id),
    user && supabase
      ? supabase
          .from("group_members")
          .select("role")
          .eq("group_id", group.id)
          .eq("user_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null } as const)
  ]);

  if (memberCountError) {
    throw new Error(`Could not load invite member count: ${memberCountError.message}`);
  }

  if (membershipResult.error) {
    throw new Error(`Could not load invite membership state: ${membershipResult.error.message}`);
  }

  return {
    currentUserMembershipRole: membershipResult.data?.role ?? null,
    group: mapGroupPreview(group),
    isAuthenticated: Boolean(user),
    memberCount: memberCount ?? 0
  };
}
