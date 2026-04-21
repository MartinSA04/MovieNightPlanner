import Link from "next/link";
import { Panel, SectionHeading, buttonVariants } from "@movie-night/ui";
import { Film, Users } from "lucide-react";
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
  const authenticatedHref = data.currentUserMembershipRole ? `/groups/${data.group.id}` : "/dashboard";
  const authenticatedLabel = data.currentUserMembershipRole ? "Group" : "App";

  return (
    <AppShell
      actions={
        <Link
          className={buttonVariants({ size: "sm", variant: "secondary" })}
          href={data.isAuthenticated ? authenticatedHref : "/login"}
        >
          {data.isAuthenticated ? `Open ${authenticatedLabel.toLowerCase()}` : "Login"}
        </Link>
      }
      menu={[
        { href: "/", label: "Home" },
        {
          href: data.isAuthenticated ? authenticatedHref : "/login",
          label: data.isAuthenticated ? authenticatedLabel : "Login"
        }
      ]}
      subtitle={`${data.memberCount} members · ${getRegionLabel(data.group.countryCode)}`}
      title={`Join ${data.group.name}`}
    >
      <Panel className="space-y-6">
        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-5">
            <div className="rounded-xl border border-border bg-secondary px-5 py-5">
              <div className="inline-flex rounded-lg bg-primary p-3 text-primary-foreground">
                <Film className="h-5 w-5" />
              </div>
              <div className="mt-5 space-y-2">
                <SectionHeading>Action</SectionHeading>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  Accept invite
                </h2>
                <p className="text-sm text-muted-foreground">
                  Join the shared movie night space and keep votes, picks, and availability together.
                </p>
              </div>
            </div>

            {data.currentUserMembershipRole ? (
              <Link
                className={buttonVariants()}
                href={`/groups/${data.group.id}`}
              >
                Open
              </Link>
            ) : data.isAuthenticated ? (
              <form action={joinGroupByInviteAction}>
                <input name="inviteCode" type="hidden" value={data.group.inviteCode} />
                <button className={buttonVariants()}>
                  Join
                </button>
              </form>
            ) : (
              <div className="flex flex-wrap gap-3">
                <Link
                  className={buttonVariants()}
                  href={`/login?next=${encodeURIComponent(nextPath)}`}
                >
                  Sign in
                </Link>
                <Link
                  className={buttonVariants({ variant: "secondary" })}
                  href={`/login?next=${encodeURIComponent(nextPath)}`}
                >
                  Create account
                </Link>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="space-y-5">
              <div className="space-y-2">
                <SectionHeading>Group</SectionHeading>
                <div className="rounded-xl border border-border bg-secondary px-4 py-4">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <Users className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm text-muted-foreground">Invite code</p>
                      <p className="mt-1 text-base font-semibold text-foreground">
                        {data.group.inviteCode}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {data.currentUserMembershipRole
                    ? `You already have access to this group as ${data.currentUserMembershipRole}.`
                    : `${data.memberCount} members / ${getRegionLabel(data.group.countryCode)}`}
                </p>
                <div className="rounded-xl border border-border bg-secondary px-4 py-4">
                  <p className="text-sm text-muted-foreground">Group</p>
                  <p className="mt-1 text-base font-semibold text-foreground">
                    {data.group.name}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Panel>
    </AppShell>
  );
}
