import Link from "next/link";
import { buttonVariants } from "@movie-night/ui";
import { Calendar, Film, Sparkles, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/server/auth";

export default async function HomePage() {
  const user = await getCurrentUser();

  const overview = user
    ? [
        {
          icon: Users,
          description: "Open a group and keep the active context visible.",
          title: "Groups"
        },
        {
          icon: Calendar,
          description: "Create new movie nights from the Movie nights view.",
          title: "Movie nights"
        },
        {
          icon: Sparkles,
          description: "Set your country and streaming services from settings.",
          title: "Settings"
        }
      ]
    : [
        {
          icon: Users,
          description: "Create a group or join with a short invite code.",
          title: "Groups"
        },
        {
          icon: Calendar,
          description: "Collect suggestions, vote, and settle on one movie.",
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
      subtitle="Suggestions, ranked votes, streaming availability, and invites — all in one calm place."
      title="Plan movie nights without the mess."
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-7">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Film className="h-5 w-5" />
          </div>
          <h2 className="mt-5 text-xl font-semibold tracking-tight text-foreground">
            {user ? "Pick up where you left off." : "A calmer way to run movie night."}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {user
              ? "Jump back into your groups, votes, and movie picks with the current state visible at a glance."
              : "Create a group, collect picks, rank your top three, and keep the decision in one clean flow."}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link className={buttonVariants()} href={user ? "/dashboard" : "/login"}>
              {user ? "Open app" : "Sign in"}
            </Link>
            {!user ? (
              <Link className={buttonVariants({ variant: "outline" })} href="/login">
                Create account
              </Link>
            ) : null}
          </div>
        </div>

        <div className="space-y-3">
          {overview.map((item) => (
            <div
              key={item.title}
              className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-5"
            >
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <item.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
