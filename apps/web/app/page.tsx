import Link from "next/link";
import { Panel, SectionHeading, buttonVariants } from "@movie-night/ui";
import { Calendar, Film, Sparkles, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/server/auth";

export default async function HomePage() {
  const user = await getCurrentUser();

  const overview = user
    ? [
        {
          icon: Users,
          description: "Open a group from the sidebar and keep the active context visible.",
          title: "Groups"
        },
        {
          icon: Calendar,
          description: "Create new movie nights from the Movie nights view where they belong.",
          title: "Movie nights"
        },
        {
          icon: Sparkles,
          description: "Set country and streaming services from user settings.",
          title: "Settings"
        }
      ]
    : [
        {
          icon: Users,
          description: "Create a group or join one with a short invite code.",
          title: "Groups"
        },
        {
          icon: Calendar,
          description: "Collect suggestions, vote together, and settle on one movie.",
          title: "Movie nights"
        },
        {
          icon: Film,
          description: "See which streaming services your group already has.",
          title: "Availability"
        }
      ];

  return (
    <AppShell
      subtitle="Suggestions, ranked votes, streaming availability, and invites in one focused place."
      title="Plan movie nights without the mess."
    >
      <Panel className="overflow-hidden p-0">
        <section className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-5 p-5 sm:p-6">
            <div className="rounded-xl border border-border bg-secondary px-5 py-5">
              <div className="inline-flex rounded-lg bg-primary p-3 text-primary-foreground">
                <Film className="h-5 w-5" />
              </div>
              <div className="mt-5 space-y-3">
                <SectionHeading>{user ? "Continue" : "Get Started"}</SectionHeading>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  {user ? "Pick up where you left off." : "A calmer way to run movie night."}
                </h2>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  {user
                    ? "Jump back into your groups, votes, and movie picks with the current state visible at a glance."
                    : "Create a group, collect picks, rank your top three, and keep the decision process in one clean flow."}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="max-w-2xl text-sm text-muted-foreground">
                {user
                  ? "Open the app to jump back into your groups, movie nights, and settings."
                  : "The app keeps suggestions, voting, and provider availability aligned to the same movie night instead of scattering them across pages."}
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
          </div>

          <div className="border-t border-border bg-secondary/50 p-5 sm:p-6 lg:border-l lg:border-t-0">
            <div className="space-y-4">
              <SectionHeading>{user ? "Inside The App" : "What You Can Do"}</SectionHeading>
              <div className="grid gap-3">
                {overview.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-xl border border-border bg-card px-4 py-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                        <item.icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-base font-semibold text-foreground">{item.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </Panel>
    </AppShell>
  );
}
