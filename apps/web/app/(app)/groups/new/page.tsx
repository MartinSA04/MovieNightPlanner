import { Panel, buttonVariants, inputClassName } from "@movie-night/ui";
import { createGroupAction } from "@/app/actions/group-actions";
import { RegionSelect } from "@/components/region-select";
import { getRegionLabel } from "@/lib/regions";
import { ensureProfileForUser, requireCurrentUser } from "@/server/auth";

export default async function NewGroupPage() {
  const user = await requireCurrentUser();
  const profile = await ensureProfileForUser(user);

  return (
    <div className="mx-auto max-w-4xl">
      <Panel className="overflow-hidden p-0">
        <div className="space-y-6 p-5 sm:p-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground">Create group</h1>
            <p className="text-sm text-muted-foreground">
              {profile.display_name} / {getRegionLabel(profile.country_code)}
            </p>
          </div>
        </div>

        <div className="border-t border-border px-5 py-6 sm:px-6">
          <div className="mx-auto w-full max-w-2xl rounded-xl border border-border bg-secondary p-5">
            <form action={createGroupAction} className="grid gap-4">
              <label className="space-y-2 text-sm font-medium text-foreground">
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

              <label className="space-y-2 text-sm font-medium text-foreground">
                <span>Country code</span>
                <RegionSelect
                  className={inputClassName}
                  defaultValue={profile.country_code}
                  name="countryCode"
                />
              </label>

              <button className={buttonVariants()}>Create</button>
            </form>
          </div>
        </div>
      </Panel>
    </div>
  );
}
