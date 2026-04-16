import { Panel, Pill } from "@movie-night/ui";
import { UserSettingsForm } from "@/components/user-settings-form";
import { getRegionLabel } from "@/lib/regions";
import { loadUserSettingsData } from "@/server/settings";

export default async function SettingsPage() {
  const data = await loadUserSettingsData();

  return (
    <div className="mx-auto max-w-6xl space-y-6 md:grid md:h-[calc(100vh-3rem)] md:grid-rows-[auto_minmax(0,1fr)] md:gap-6 md:space-y-0 md:overflow-hidden">
      <Panel className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">
                Settings
              </h1>
              <Pill tone="accent">{getRegionLabel(data.profile.country_code)}</Pill>
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold text-slate-950 dark:text-white">
                {data.profile.display_name}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{data.profile.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Pill tone="muted">
              {data.selectedServiceIds.length === 1
                ? "1 service saved"
                : `${data.selectedServiceIds.length} services saved`}
            </Pill>
          </div>
        </div>
      </Panel>

      <Panel className="min-h-0 overflow-hidden md:flex md:flex-col" tone="muted">
        <UserSettingsForm
          initialCountryCode={data.profile.country_code}
          initialSelectedServiceIds={data.selectedServiceIds}
          initialServices={data.services}
          tmdbConfigured={data.tmdbConfigured}
        />
      </Panel>
    </div>
  );
}
