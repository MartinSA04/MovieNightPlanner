import type { SupabaseClient, User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AppProfile {
  avatar_url: string | null;
  country_code: string;
  display_name: string;
  email: string;
  id: string;
}

function normalizeCountryCode(value: unknown): string {
  if (typeof value === "string" && value.trim().length === 2) {
    return value.trim().toUpperCase();
  }

  return "US";
}

function deriveDisplayName(user: User): string {
  const metadataDisplayName =
    typeof user.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name.trim()
      : "";

  if (metadataDisplayName.length > 0) {
    return metadataDisplayName.slice(0, 80);
  }

  if (user.email) {
    return user.email.split("@")[0].slice(0, 80);
  }

  return "Movie fan";
}

function profilePayloadFromUser(user: User) {
  if (!user.email) {
    throw new Error("Authenticated user is missing an email address.");
  }

  return {
    country_code: normalizeCountryCode(user.user_metadata?.country_code),
    display_name: deriveDisplayName(user),
    email: user.email,
    id: user.id
  };
}

function normalizeProfileRow(row: {
  avatar_url: string | null;
  country_code: string;
  display_name: string;
  email: string;
  id: string;
}): AppProfile {
  return {
    avatar_url: row.avatar_url,
    country_code: normalizeCountryCode(row.country_code),
    display_name: row.display_name,
    email: row.email,
    id: row.id
  };
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user ?? null;
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function ensureProfileForUser(
  user: User,
  existingClient?: SupabaseClient
): Promise<AppProfile> {
  const supabase = existingClient ?? (await createClient());
  const { data: existingProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, email, avatar_url, country_code")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(`Could not load profile for ${user.id}: ${profileError.message}`);
  }

  if (existingProfile) {
    if (user.email && existingProfile.email !== user.email) {
      const { data: updatedProfile, error: updateError } = await supabase
        .from("profiles")
        .update({ email: user.email })
        .eq("id", user.id)
        .select("id, display_name, email, avatar_url, country_code")
        .single();

      if (updateError) {
        throw new Error(`Could not sync profile for ${user.id}: ${updateError.message}`);
      }

      return normalizeProfileRow(updatedProfile);
    }

    return normalizeProfileRow(existingProfile);
  }

  const { data, error } = await supabase
    .from("profiles")
    .insert(profilePayloadFromUser(user))
    .select("id, display_name, email, avatar_url, country_code")
    .single();

  if (error) {
    throw new Error(`Could not ensure profile for ${user.id}: ${error.message}`);
  }

  return normalizeProfileRow(data);
}
