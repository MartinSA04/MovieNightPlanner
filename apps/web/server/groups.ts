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
  scheduledFor: string | null;
  status: string;
  title: string;
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
        .select("id, title, status, scheduled_for")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false })
        .limit(6)
    ]);

  if (membershipError) {
    throw new Error(`Could not verify group membership: ${membershipError.message}`);
  }

  if (groupError) {
    throw new Error(`Could not load group: ${groupError.message}`);
  }

  if (eventsError) {
    throw new Error(`Could not load group events: ${eventsError.message}`);
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
    events: (events ?? []).map((event) => ({
      id: event.id,
      scheduledFor: event.scheduled_for,
      status: event.status,
      title: event.title
    })),
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
