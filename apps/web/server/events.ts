import { canCreateEvent, type CreateEventInput, type EventStatus } from "@movie-night/domain";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { ensureProfileForUser, requireCurrentUser, type AppProfile } from "@/server/auth";

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
    throw new Error(`Could not verify event permissions: ${membershipError.message}`);
  }

  if (!membership || !canCreateEvent(membership.role)) {
    throw new Error("Only group owners and admins can create events.");
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
    throw new Error(`Could not create event: ${eventError.message}`);
  }

  return normalizeEventRecord(event);
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
    throw new Error(`Could not load event: ${eventError.message}`);
  }

  if (!event) {
    return null;
  }

  const admin = createAdminClient();
  const [
    { data: membership, error: membershipError },
    { data: group, error: groupError },
    { count: memberCount, error: memberCountError },
    { count: suggestionCount, error: suggestionCountError },
    { count: voteCount, error: voteCountError },
    { data: creatorProfile, error: creatorError }
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
    admin.from("group_members").select("user_id", { count: "exact", head: true }).eq("group_id", event.group_id),
    supabase.from("movie_suggestions").select("id", { count: "exact", head: true }).eq("event_id", eventId),
    supabase.from("votes").select("id", { count: "exact", head: true }).eq("event_id", eventId),
    admin
      .from("profiles")
      .select("display_name")
      .eq("id", event.created_by_user_id)
      .maybeSingle()
  ]);

  if (membershipError) {
    throw new Error(`Could not load actor event role: ${membershipError.message}`);
  }

  if (groupError) {
    throw new Error(`Could not load event group: ${groupError.message}`);
  }

  if (memberCountError) {
    throw new Error(`Could not load group member count: ${memberCountError.message}`);
  }

  if (suggestionCountError) {
    throw new Error(`Could not load suggestion count: ${suggestionCountError.message}`);
  }

  if (voteCountError) {
    throw new Error(`Could not load vote count: ${voteCountError.message}`);
  }

  if (creatorError) {
    throw new Error(`Could not load event creator profile: ${creatorError.message}`);
  }

  if (!membership || !group) {
    return null;
  }

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
      suggestionCount: suggestionCount ?? 0,
      voteCount: voteCount ?? 0
    }
  };
}
