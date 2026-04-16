import Link from "next/link";
import { Panel, Pill, SectionHeading } from "@movie-night/ui";
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
          className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-400 dark:hover:text-white"
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
      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Panel className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <Pill tone="accent">{data.memberCount} members</Pill>
            <Pill tone={data.currentUserMembershipRole ? "neutral" : "muted"}>
              {data.currentUserMembershipRole ?? "Invite"}
            </Pill>
          </div>
          <div className="space-y-2">
            <SectionHeading>Group</SectionHeading>
            <div className="grid gap-3 text-sm text-slate-700 dark:text-slate-300">
              <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                <span className="font-medium text-slate-950 dark:text-white">Invite code:</span>{" "}
                {data.group.inviteCode}
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                <span className="font-medium text-slate-950 dark:text-white">Region:</span>{" "}
                {getRegionLabel(data.group.countryCode)}
              </div>
            </div>
          </div>
        </Panel>

        <Panel tone="muted" className="space-y-5">
          <div className="space-y-2">
            <SectionHeading>Action</SectionHeading>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Accept invite
            </h2>
          </div>

          {data.currentUserMembershipRole ? (
            <Link
              className="inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-amber-300 dark:text-slate-950 dark:hover:bg-amber-200"
              href={`/groups/${data.group.id}`}
            >
              Open group
            </Link>
          ) : data.isAuthenticated ? (
            <form action={joinGroupByInviteAction}>
              <input name="inviteCode" type="hidden" value={data.group.inviteCode} />
              <button className="inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-amber-300 dark:text-slate-950 dark:hover:bg-amber-200">
                Join {data.group.name}
              </button>
            </form>
          ) : (
            <div className="flex flex-wrap gap-3">
              <Link
                className="inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-amber-300 dark:text-slate-950 dark:hover:bg-amber-200"
                href={`/login?next=${encodeURIComponent(nextPath)}`}
              >
                Sign in
              </Link>
              <Link
                className="inline-flex rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-400 dark:hover:text-white"
                href={`/login?next=${encodeURIComponent(nextPath)}`}
              >
                Create account
              </Link>
            </div>
          )}
        </Panel>
      </section>
    </AppShell>
  );
}
