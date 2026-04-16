import Link from "next/link";
import { Panel, SectionHeading, buttonVariants } from "@movie-night/ui";
import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/server/auth";

export default async function HomePage() {
  const user = await getCurrentUser();

  const overview = user
    ? [
        {
          description: "Open a group from the sidebar and keep the active context visible.",
          title: "Groups"
        },
        {
          description: "Create new events from the Events view where they belong.",
          title: "Events"
        },
        {
          description: "Set country and streaming services from user settings.",
          title: "Settings"
        }
      ]
    : [
        {
          description: "Create a group or join one with a short invite code.",
          title: "Groups"
        },
        {
          description: "Collect suggestions, vote together, and settle on one movie.",
          title: "Events"
        },
        {
          description: "See which streaming services your group already has.",
          title: "Availability"
        }
      ];

  return (
    <AppShell
      subtitle="Plan movie nights without scattered links, duplicated actions, or hidden settings."
      title="Plan movie nights."
    >
      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Panel className="space-y-5">
          <SectionHeading>{user ? "Continue" : "Get Started"}</SectionHeading>
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
              {user ? "Pick up where you left off." : "A cleaner way to plan movie night."}
            </h2>
            <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
              {user
                ? "Open the app to jump back into your groups, events, and settings."
                : "Create an account, start a group, and keep suggestions, voting, and streaming availability in one place."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link className={buttonVariants()} href={user ? "/dashboard" : "/login"}>
              {user ? "Open app" : "Sign in"}
            </Link>
            {!user ? (
              <Link className={buttonVariants({ variant: "secondary" })} href="/login">
                Create account
              </Link>
            ) : null}
          </div>
        </Panel>

        <Panel tone="muted" className="space-y-4">
          <SectionHeading>{user ? "Inside The App" : "What You Can Do"}</SectionHeading>
          <div className="grid gap-3">
            {overview.map((item) => (
              <div
                key={item.title}
                className="rounded-[24px] bg-white px-4 py-4 dark:bg-slate-950"
              >
                <p className="text-base font-semibold text-slate-950 dark:text-white">{item.title}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.description}</p>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </AppShell>
  );
}
