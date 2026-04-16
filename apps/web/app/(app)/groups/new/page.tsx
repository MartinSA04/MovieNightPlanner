import { Panel, Pill, buttonVariants, inputClassName } from "@movie-night/ui";
import { createGroupAction } from "@/app/actions/group-actions";
import { RegionSelect } from "@/components/region-select";
import { getRegionLabel } from "@/lib/regions";
import { ensureProfileForUser, requireCurrentUser } from "@/server/auth";

export default async function NewGroupPage() {
  const user = await requireCurrentUser();
  const profile = await ensureProfileForUser(user);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Panel className="space-y-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Create group
            </h1>
            <Pill tone="accent">{getRegionLabel(profile.country_code)}</Pill>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">{profile.display_name}</p>
        </div>
      </Panel>

      <Panel tone="muted" className="max-w-2xl">
        <form action={createGroupAction} className="grid gap-4">
          <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <span>Group name</span>
            <input
              required
              className={inputClassName}
              maxLength={80}
              name="name"
              placeholder="Friday Film Club"
              type="text"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <span>Country code</span>
            <RegionSelect
              className={inputClassName}
              defaultValue={profile.country_code}
              name="countryCode"
            />
          </label>

          <button className={buttonVariants()}>Create group</button>
        </form>
      </Panel>
    </div>
  );
}
