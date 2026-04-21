import { buttonVariants, cn, inputClassName } from "@movie-night/ui";
import { joinGroupByInviteAction } from "@/app/actions/group-invite-actions";

export default function JoinGroupPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Join a group
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter an invite code to step into an existing planning space.
        </p>
      </header>

      <form
        action={joinGroupByInviteAction}
        className="grid gap-5 rounded-2xl border border-border/60 bg-card p-6"
      >
        <label className="grid gap-2 text-sm font-medium text-foreground">
          <span>Invite code</span>
          <input
            required
            autoCapitalize="characters"
            className={cn(inputClassName, "uppercase tracking-[0.18em]")}
            inputMode="text"
            maxLength={12}
            name="inviteCode"
            placeholder="ABCD2345"
            type="text"
          />
        </label>

        <div className="flex justify-end">
          <button className={buttonVariants({ size: "sm" })} type="submit">
            Join group
          </button>
        </div>
      </form>
    </div>
  );
}
