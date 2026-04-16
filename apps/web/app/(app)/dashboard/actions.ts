"use server";

import { createGroupSchema, updateStreamingServicesSchema } from "@movie-night/domain";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureProfileForUser, requireCurrentUser } from "@/server/auth";
import { createGroupForOwner } from "@/server/groups";

function redirectToDashboard(type: "error" | "notice", message: string): never {
  redirect(`/dashboard?${type}=${encodeURIComponent(message)}`);
}

export async function createGroupAction(formData: FormData) {
  const user = await requireCurrentUser();
  await ensureProfileForUser(user);

  const parsed = createGroupSchema.safeParse({
    countryCode: String(formData.get("countryCode") ?? "").toUpperCase(),
    name: formData.get("name")
  });

  if (!parsed.success) {
    redirectToDashboard("error", "Create a group with a name and 2-letter country code.");
  }

  const group = await createGroupForOwner({
    countryCode: parsed.data.countryCode,
    name: parsed.data.name,
    ownerUserId: user.id
  });

  revalidatePath("/dashboard");
  redirect(`/groups/${group.id}`);
}

export async function updateStreamingServicesAction(formData: FormData) {
  const user = await requireCurrentUser();
  const supabase = await createClient();

  const parsed = updateStreamingServicesSchema.safeParse({
    providerIds: formData
      .getAll("providerIds")
      .map((value) => String(value))
      .filter((value) => value.length > 0)
  });

  if (!parsed.success) {
    redirectToDashboard("error", "Choose valid streaming services before saving.");
  }

  const { error: deleteError } = await supabase
    .from("user_streaming_services")
    .delete()
    .eq("user_id", user.id);

  if (deleteError) {
    redirectToDashboard("error", deleteError.message);
  }

  if (parsed.data.providerIds.length > 0) {
    const { error: insertError } = await supabase.from("user_streaming_services").insert(
      parsed.data.providerIds.map((streamingServiceId) => ({
        streaming_service_id: streamingServiceId,
        user_id: user.id
      }))
    );

    if (insertError) {
      redirectToDashboard("error", insertError.message);
    }
  }

  revalidatePath("/dashboard");
  redirectToDashboard("notice", "Streaming services saved.");
}
