import { Panel, buttonVariants, cn, inputClassName } from "@movie-night/ui";
import { joinGroupByInviteAction } from "@/app/actions/group-invite-actions";

export default function JoinGroupPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Panel className="space-y-6">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">
          Join group
        </h1>
      </Panel>

      <Panel tone="muted" className="max-w-xl">
        <form action={joinGroupByInviteAction} className="grid gap-4">
          <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <span>Invite code</span>
            <input
              required
              autoCapitalize="characters"
              className={cn(inputClassName, "uppercase tracking-[0.16em]")}
              inputMode="text"
              maxLength={12}
              name="inviteCode"
              placeholder="ABCD2345"
              type="text"
            />
          </label>

          <button className={buttonVariants()}>Join group</button>
        </form>
      </Panel>
    </div>
  );
}
