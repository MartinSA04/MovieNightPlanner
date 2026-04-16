import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureProfileForUser, requireCurrentUser, type AppProfile } from "@/server/auth";
import {
  isTmdbConfigured,
  listMovieWatchProviders,
  type TmdbWatchProviderCatalogItem
} from "@/server/tmdb/client";

export interface SettingsServiceOption {
  displayPriority: number | null;
  id: string;
  logoPath: string | null;
  name: string;
  tmdbProviderId: number;
}

export interface UserSettingsData {
  profile: AppProfile;
  selectedServiceIds: string[];
  services: SettingsServiceOption[];
  tmdbConfigured: boolean;
}

function normalizeSettingsService(
  row: {
    id: string;
    logo_path: string | null;
    name: string;
    tmdb_provider_id: number;
  },
  displayPriority: number | null = null
): SettingsServiceOption {
  return {
    displayPriority,
    id: row.id,
    logoPath: row.logo_path,
    name: row.name,
    tmdbProviderId: row.tmdb_provider_id
  };
}

function sortSettingsServices(services: SettingsServiceOption[]) {
  return [...services].sort((left, right) => {
    const leftPriority = left.displayPriority ?? Number.MAX_SAFE_INTEGER;
    const rightPriority = right.displayPriority ?? Number.MAX_SAFE_INTEGER;

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    return left.name.localeCompare(right.name);
  });
}

async function loadStoredStreamingServices() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("streaming_services")
    .select("id, tmdb_provider_id, name, logo_path")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Could not load streaming services: ${error.message}`);
  }

  return (data ?? []).map((row) => normalizeSettingsService(row));
}

function mapSyncedServices(
  rows: Array<{
    id: string;
    logo_path: string | null;
    name: string;
    tmdb_provider_id: number;
  }>,
  providers: TmdbWatchProviderCatalogItem[]
) {
  const priorityByProviderId = new Map(
    providers.map((provider) => [provider.providerId, provider.displayPriority])
  );

  return sortSettingsServices(
    rows.map((row) =>
      normalizeSettingsService(row, priorityByProviderId.get(row.tmdb_provider_id) ?? null)
    )
  );
}

export async function loadAvailableStreamingServices(
  countryCode: string
): Promise<SettingsServiceOption[]> {
  if (!isTmdbConfigured()) {
    return loadStoredStreamingServices();
  }

  try {
    const providers = await listMovieWatchProviders(countryCode);

    if (providers.length === 0) {
      return [];
    }

    const admin = createAdminClient();
    const { error: upsertError } = await admin.from("streaming_services").upsert(
      providers.map((provider) => ({
        logo_path: provider.logoPath,
        name: provider.providerName,
        tmdb_provider_id: provider.providerId
      })),
      {
        onConflict: "tmdb_provider_id"
      }
    );

    if (upsertError) {
      throw new Error(`Could not sync TMDb watch providers: ${upsertError.message}`);
    }

    const providerIds = providers.map((provider) => provider.providerId);
    const { data, error } = await admin
      .from("streaming_services")
      .select("id, tmdb_provider_id, name, logo_path")
      .in("tmdb_provider_id", providerIds);

    if (error) {
      throw new Error(`Could not load synced watch providers: ${error.message}`);
    }

    return mapSyncedServices(data ?? [], providers);
  } catch (error) {
    console.error("Could not refresh streaming services from TMDb", {
      countryCode,
      error: error instanceof Error ? error.message : String(error)
    });

    return loadStoredStreamingServices();
  }
}

export async function loadUserSettingsData(): Promise<UserSettingsData> {
  const user = await requireCurrentUser();
  const supabase = await createSupabaseClient();
  const profile = await ensureProfileForUser(user, supabase);

  const [{ data: subscriptionRows, error: subscriptionsError }, services] = await Promise.all([
    supabase.from("user_streaming_services").select("streaming_service_id").eq("user_id", user.id),
    loadAvailableStreamingServices(profile.country_code)
  ]);

  if (subscriptionsError) {
    throw new Error(`Could not load user subscriptions: ${subscriptionsError.message}`);
  }

  return {
    profile,
    selectedServiceIds: (subscriptionRows ?? []).map((row) => row.streaming_service_id),
    services,
    tmdbConfigured: isTmdbConfigured()
  };
}
