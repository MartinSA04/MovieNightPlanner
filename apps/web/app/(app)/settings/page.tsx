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
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">
                Settings
              </h1>
              <p className="text-lg font-semibold text-slate-950 dark:text-white">
                {data.profile.display_name}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {data.profile.email} / {getRegionLabel(data.profile.country_code)}
              </p>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              {data.selectedServiceIds.length === 1
                ? "1 service saved"
                : `${data.selectedServiceIds.length} services saved`}
            </p>
          </div>
        </div>

        <div className="min-h-0 border-t border-slate-200 px-5 py-6 dark:border-slate-800 sm:px-6 md:flex md:flex-1 md:flex-col">
          <div className="min-h-0 rounded-[32px] bg-slate-50/80 p-4 dark:bg-slate-900/70 sm:p-5 md:flex md:flex-1 md:flex-col">
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
