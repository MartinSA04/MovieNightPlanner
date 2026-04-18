import { Panel, buttonVariants, cn, inputClassName } from "@movie-night/ui";
import { joinGroupByInviteAction } from "@/app/actions/group-invite-actions";

export default function JoinGroupPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <Panel className="overflow-hidden p-0">
        <div className="space-y-6 p-5 sm:p-6">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Join group
          </h1>
        </div>

        <div className="border-t border-slate-200 px-5 py-6 dark:border-slate-800 sm:px-6">
          <div className="mx-auto w-full max-w-xl rounded-[32px] bg-slate-50/80 p-4 dark:bg-slate-900/70 sm:p-5">
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

              <button className={buttonVariants()}>Join</button>
            </form>
          </div>
        </div>
      </Panel>
    </div>
  );
}
