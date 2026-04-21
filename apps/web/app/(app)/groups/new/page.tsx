import { buttonVariants, inputClassName } from "@movie-night/ui";
import { createGroupAction } from "@/app/actions/group-actions";
import { RegionSelect } from "@/components/region-select";
import { getRegionLabel } from "@/lib/regions";
import { ensureProfileForUser, requireCurrentUser } from "@/server/auth";

export default async function NewGroupPage() {
  const user = await requireCurrentUser();
  const profile = await ensureProfileForUser(user);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Create group
        </h1>
        <p className="text-sm text-muted-foreground">
          {profile.display_name} · {getRegionLabel(profile.country_code)}
        </p>
      </header>

      <form
        action={createGroupAction}
        className="grid gap-5 rounded-2xl border border-border/60 bg-card p-6"
      >
        <label className="grid gap-2 text-sm font-medium text-foreground">
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

        <label className="grid gap-2 text-sm font-medium text-foreground">
          <span>Country</span>
          <RegionSelect
            className={inputClassName}
            defaultValue={profile.country_code}
            name="countryCode"
          />
        </label>

        <div className="flex justify-end">
          <button className={buttonVariants({ size: "sm" })} type="submit">
            Create group
          </button>
        </div>
      </form>
    </div>
  );
}
