"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { publicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

const signInSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6)
});

const signUpSchema = signInSchema.extend({
  displayName: z.string().trim().min(2).max(80)
});

function redirectToLogin(type: "error" | "message", message: string): never {
  redirect(`/login?${type}=${encodeURIComponent(message)}`);
}

function getSafeNextPath(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return "/dashboard";
  }

  const candidate = value.trim();

  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return "/dashboard";
  }

  return candidate;
}

export async function signInAction(formData: FormData) {
  const nextPath = getSafeNextPath(formData.get("next"));
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    redirectToLogin("error", "Enter a valid email and password.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    redirectToLogin("error", error.message);
  }

  redirect(nextPath);
}

export async function signUpAction(formData: FormData) {
  const nextPath = getSafeNextPath(formData.get("next"));
  const parsed = signUpSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    redirectToLogin("error", "Create an account with a display name, email, and password.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        display_name: parsed.data.displayName
      },
      emailRedirectTo: `${publicEnv.NEXT_PUBLIC_APP_URL}/auth/callback`
    }
  });

  if (error) {
    redirectToLogin("error", error.message);
  }

  if (data.session) {
    redirect(nextPath);
  }

  redirectToLogin("message", "Check your email to confirm your account, then sign in.");
}
