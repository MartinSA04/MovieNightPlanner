import { Panel, buttonVariants, cn, inputClassName } from "@movie-night/ui";
import { joinGroupByInviteAction } from "@/app/actions/group-invite-actions";

export default function JoinGroupPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <Panel className="overflow-hidden p-0">
        <div className="space-y-6 p-5 sm:p-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground">Join group</h1>
            <p className="text-sm text-muted-foreground">
              Enter an invite code to step straight into an existing planning space.
            </p>
          </div>
        </div>

        <div className="border-t border-border px-5 py-6 sm:px-6">
          <div className="mx-auto w-full max-w-xl rounded-xl border border-border bg-secondary p-5">
            <form action={joinGroupByInviteAction} className="grid gap-4">
              <label className="space-y-2 text-sm font-medium text-foreground">
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
