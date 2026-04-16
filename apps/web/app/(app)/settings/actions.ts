"use server";

import { updateUserSettingsSchema } from "@movie-night/domain";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureProfileForUser, requireCurrentUser } from "@/server/auth";

function redirectToSettings(type: "error" | "notice", message: string): never {
  redirect(`/settings?${type}=${encodeURIComponent(message)}`);
}

export async function updateUserSettingsAction(formData: FormData) {
  const user = await requireCurrentUser();
  const supabase = await createClient();
  await ensureProfileForUser(user, supabase);

  const parsed = updateUserSettingsSchema.safeParse({
    countryCode: String(formData.get("countryCode") ?? "").toUpperCase(),
    providerIds: formData
      .getAll("providerIds")
      .map((value) => String(value))
      .filter((value) => value.length > 0)
  });

  if (!parsed.success) {
    redirectToSettings("error", "Choose a valid country and streaming services.");
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ country_code: parsed.data.countryCode })
    .eq("id", user.id);

  if (profileError) {
    redirectToSettings("error", profileError.message);
  }

  const { error: deleteError } = await supabase
    .from("user_streaming_services")
    .delete()
    .eq("user_id", user.id);

  if (deleteError) {
    redirectToSettings("error", deleteError.message);
  }

  if (parsed.data.providerIds.length > 0) {
    const { error: insertError } = await supabase.from("user_streaming_services").insert(
      parsed.data.providerIds.map((streamingServiceId) => ({
        streaming_service_id: streamingServiceId,
        user_id: user.id
      }))
    );

    if (insertError) {
      redirectToSettings("error", insertError.message);
    }
  }

  const { error: authError } = await supabase.auth.updateUser({
    data: {
      country_code: parsed.data.countryCode
    }
  });

  if (authError) {
    console.error("Could not sync auth metadata for user settings", {
      error: authError.message,
      userId: user.id
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  redirectToSettings("notice", "Settings saved.");
}
