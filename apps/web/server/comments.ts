import type { DeleteCommentInput, PostCommentInput } from "@movie-night/domain";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";

export interface EventCommentView {
  authorAvatarUrl: string | null;
  authorDisplayName: string;
  authorUserId: string;
  body: string;
  createdAt: string;
  id: string;
  updatedAt: string;
}

interface CommentRecord {
  body: string;
  created_at: string;
  id: string;
  updated_at: string;
  user_id: string;
}

async function requireMembership(params: {
  actorUserId: string;
  eventId: string;
}) {
  const supabase = await createSupabaseClient();

  const { data: event, error: eventError } = await supabase
    .from("movie_night_events")
    .select("id, group_id")
    .eq("id", params.eventId)
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
    .eq("user_id", params.actorUserId)
    .maybeSingle();

  if (membershipError) {
    throw new Error(`Could not verify comment permissions: ${membershipError.message}`);
  }

  if (!membership) {
    throw new Error("Only group members can comment on this movie night.");
  }

  return { event, membership, supabase };
}

export async function loadEventComments(eventId: string): Promise<EventCommentView[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("comments")
    .select("id, user_id, body, created_at, updated_at")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Could not load comments: ${error.message}`);
  }

  const rows = (data ?? []) as CommentRecord[];
  if (rows.length === 0) return [];

  const userIds = Array.from(new Set(rows.map((row) => row.user_id)));
  const { data: profileRows, error: profileError } = await admin
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", userIds);

  if (profileError) {
    throw new Error(`Could not load comment authors: ${profileError.message}`);
  }

  const profilesById = new Map(
    (profileRows ?? []).map((row) => [row.id, row])
  );

  return rows.map((row) => {
    const profile = profilesById.get(row.user_id);
    return {
      authorAvatarUrl: profile?.avatar_url ?? null,
      authorDisplayName: profile?.display_name ?? "Movie fan",
      authorUserId: row.user_id,
      body: row.body,
      createdAt: row.created_at,
      id: row.id,
      updatedAt: row.updated_at
    };
  });
}

export async function postComment(
  input: PostCommentInput & { actorUserId: string }
): Promise<EventCommentView> {
  await requireMembership({ actorUserId: input.actorUserId, eventId: input.eventId });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("comments")
    .insert({
      body: input.body,
      event_id: input.eventId,
      user_id: input.actorUserId
    })
    .select("id, user_id, body, created_at, updated_at")
    .single<CommentRecord>();

  if (error) {
    throw new Error(`Could not post comment: ${error.message}`);
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", data.user_id)
    .maybeSingle();

  if (profileError) {
    throw new Error(`Could not load comment author: ${profileError.message}`);
  }

  return {
    authorAvatarUrl: profile?.avatar_url ?? null,
    authorDisplayName: profile?.display_name ?? "Movie fan",
    authorUserId: data.user_id,
    body: data.body,
    createdAt: data.created_at,
    id: data.id,
    updatedAt: data.updated_at
  };
}

export async function deleteComment(
  input: DeleteCommentInput & { actorUserId: string }
): Promise<{ status: "deleted" }> {
  const admin = createAdminClient();
  const { data: comment, error } = await admin
    .from("comments")
    .select("id, user_id, event_id")
    .eq("id", input.commentId)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load comment for removal: ${error.message}`);
  }

  if (!comment) {
    throw new Error("Comment not found.");
  }

  if (comment.user_id !== input.actorUserId) {
    throw new Error("You can only delete your own comments.");
  }

  const { error: deleteError } = await admin
    .from("comments")
    .delete()
    .eq("id", input.commentId);

  if (deleteError) {
    throw new Error(`Could not delete comment: ${deleteError.message}`);
  }

  return { status: "deleted" };
}
