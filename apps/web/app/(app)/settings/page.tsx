import { Panel } from "@movie-night/ui";
import { UserSettingsForm } from "@/components/user-settings-form";
import { getRegionLabel } from "@/lib/regions";
import { loadUserSettingsData } from "@/server/settings";

export default async function SettingsPage() {
  const data = await loadUserSettingsData();

  return (
    <div className="mx-auto flex max-w-6xl flex-col md:h-[calc(100dvh-3rem)]">
      <Panel className="min-h-0 overflow-hidden p-0 md:flex md:min-h-0 md:flex-1 md:flex-col">
        <div className="space-y-6 p-5 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-semibold tracking-tight text-foreground">Settings</h1>
              <p className="text-lg font-semibold text-foreground">
                {data.profile.display_name}
              </p>
              <p className="text-sm text-muted-foreground">
                {data.profile.email} / {getRegionLabel(data.profile.country_code)}
              </p>
            </div>

            <p className="text-sm text-muted-foreground">
              {data.selectedServiceIds.length === 1
                ? "1 service saved"
                : `${data.selectedServiceIds.length} services saved`}
            </p>
          </div>
        </div>

        <div className="min-h-0 border-t border-border px-5 py-6 sm:px-6 md:flex md:flex-1 md:flex-col">
          <div className="min-h-0 rounded-xl border border-border bg-card p-5 md:flex md:flex-1 md:flex-col">
            <UserSettingsForm
              initialCountryCode={data.profile.country_code}
              initialSelectedServiceIds={data.selectedServiceIds}
              initialServices={data.services}
              tmdbConfigured={data.tmdbConfigured}
            />
          </div>
        </div>
      </Panel>
    </div>
  );
}
