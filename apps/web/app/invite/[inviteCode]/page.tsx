import Link from "next/link";
import { Panel, Pill, SectionHeading } from "@movie-night/ui";
import { notFound } from "next/navigation";
import { joinGroupByInviteAction } from "@/app/actions/group-invite-actions";
import { AppShell } from "@/components/app-shell";
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

  return (
    <AppShell
      actions={
        <Link
          className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
          href={data.isAuthenticated ? "/dashboard" : "/login"}
        >
          {data.isAuthenticated ? "Dashboard" : "Login"}
        </Link>
      }
      menu={[
        { href: "/", label: "Home" },
        {
          href: data.isAuthenticated ? "/dashboard" : "/login",
          label: data.isAuthenticated ? "Dashboard" : "Login"
        }
      ]}
      subtitle={`${data.memberCount} members · ${data.group.countryCode}`}
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
            <div className="grid gap-3 text-sm text-slate-700">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <span className="font-medium text-slate-950">Invite code:</span>{" "}
                {data.group.inviteCode}
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <span className="font-medium text-slate-950">Region:</span> {data.group.countryCode}
              </div>
            </div>
          </div>
        </Panel>

        <Panel tone="muted" className="space-y-5">
          <div className="space-y-2">
            <SectionHeading>Action</SectionHeading>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Accept invite</h2>
          </div>

          {data.currentUserMembershipRole ? (
            <Link
              className="inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              href={`/groups/${data.group.id}`}
            >
              Open group
            </Link>
          ) : data.isAuthenticated ? (
            <form action={joinGroupByInviteAction}>
              <input name="inviteCode" type="hidden" value={data.group.inviteCode} />
              <button className="inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                Join {data.group.name}
              </button>
            </form>
          ) : (
            <div className="flex flex-wrap gap-3">
              <Link
                className="inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                href={`/login?next=${encodeURIComponent(nextPath)}`}
              >
                Sign in
              </Link>
              <Link
                className="inline-flex rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
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
