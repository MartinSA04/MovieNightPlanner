import Link from "next/link";
import { buttonVariants } from "@movie-night/ui";
import { Users } from "lucide-react";
import { notFound } from "next/navigation";
import { joinGroupByInviteAction } from "@/app/actions/group-invite-actions";
import { AppShell } from "@/components/app-shell";
import { getRegionLabel } from "@/lib/regions";
import { loadInvitePageData } from "@/server/groups";

interface InvitePageProps {
  params: Promise<{
    inviteCode: string;
  }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { inviteCode } = await params;
  const data = await loadInvitePageData(inviteCode);

  if (!data) {
    notFound();
  }

  const nextPath = `/invite/${data.group.inviteCode}`;
  const authenticatedHref = data.currentUserMembershipRole
    ? `/groups/${data.group.id}`
    : "/dashboard";
  const authenticatedLabel = data.currentUserMembershipRole ? "Group" : "App";

  return (
    <AppShell
      actions={
        <Link
          className={buttonVariants({ size: "sm", variant: "outline" })}
          href={data.isAuthenticated ? authenticatedHref : "/login"}
        >
          {data.isAuthenticated ? `Open ${authenticatedLabel.toLowerCase()}` : "Sign in"}
        </Link>
      }
      menu={[
        { href: "/", label: "Home" },
        {
          href: data.isAuthenticated ? authenticatedHref : "/login",
          label: data.isAuthenticated ? authenticatedLabel : "Sign in"
        }
      ]}
      subtitle={`${data.memberCount} members · ${getRegionLabel(data.group.countryCode)}`}
      title={`Join ${data.group.name}`}
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-7">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Accept invite
            </h2>
            <p className="text-sm text-muted-foreground">
              Join the shared movie night space and keep votes, picks, and availability
              together.
            </p>
          </div>

          <div className="mt-6">
            {data.currentUserMembershipRole ? (
              <Link className={buttonVariants()} href={`/groups/${data.group.id}`}>
                Open group
              </Link>
            ) : data.isAuthenticated ? (
              <form action={joinGroupByInviteAction}>
                <input name="inviteCode" type="hidden" value={data.group.inviteCode} />
                <button className={buttonVariants()} type="submit">
                  Join group
                </button>
              </form>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Link
                  className={buttonVariants()}
                  href={`/login?next=${encodeURIComponent(nextPath)}`}
                >
                  Sign in
                </Link>
                <Link
                  className={buttonVariants({ variant: "outline" })}
                  href={`/login?next=${encodeURIComponent(nextPath)}`}
                >
                  Create account
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-7">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-base font-semibold text-foreground">{data.group.name}</p>
              <p className="text-sm text-muted-foreground">
                {data.memberCount} members · {getRegionLabel(data.group.countryCode)}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 text-sm">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Invite code
              </p>
              <p className="mt-1 font-mono text-base font-semibold tracking-wider text-foreground">
                {data.group.inviteCode}
              </p>
            </div>
            {data.currentUserMembershipRole ? (
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Your role
                </p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {data.currentUserMembershipRole}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
