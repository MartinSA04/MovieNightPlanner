import { AppearanceSetting } from "@/components/appearance-setting";
import { UserSettingsForm } from "@/components/user-settings-form";
import { getRegionLabel } from "@/lib/regions";
import { loadUserSettingsData } from "@/server/settings";

export default async function SettingsPage() {
  const data = await loadUserSettingsData();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            {data.profile.display_name} · {data.profile.email} ·{" "}
            {getRegionLabel(data.profile.country_code)}
          </p>
        </div>

        <p className="text-sm text-muted-foreground">
          {data.selectedServiceIds.length === 1
            ? "1 service saved"
            : `${data.selectedServiceIds.length} services saved`}
        </p>
      </header>

      <AppearanceSetting />

      <UserSettingsForm
        initialCountryCode={data.profile.country_code}
        initialSelectedServiceIds={data.selectedServiceIds}
        initialServices={data.services}
        tmdbConfigured={data.tmdbConfigured}
      />
    </div>
  );
}
