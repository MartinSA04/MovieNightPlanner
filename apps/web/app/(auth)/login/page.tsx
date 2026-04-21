import { Panel, SectionHeading, buttonVariants, inputClassName } from "@movie-night/ui";
import { Film, Sparkles, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { signInAction, signUpAction } from "./actions";
import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/server/auth";

interface LoginPageProps {
  searchParams?: Promise<{
    error?: string;
    message?: string;
    next?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  const params = (await searchParams) ?? {};

  return (
    <AppShell
      menu={[
        { href: "/", label: "Home" },
        { href: "/login", label: "Login", active: true }
      ]}
      subtitle="Sign in or create an account to start planning with your group."
      title="Welcome back."
    >
      <Panel className="overflow-hidden p-0">
        <section className="grid gap-0 lg:grid-cols-2">
          <div className="space-y-5 p-5 sm:p-6">
            <div className="rounded-xl border border-border bg-secondary px-5 py-5">
              <div className="inline-flex rounded-lg bg-primary p-3 text-primary-foreground">
                <Film className="h-5 w-5" />
              </div>
              <div className="mt-5 space-y-2">
                <SectionHeading>Sign in</SectionHeading>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  Existing account
                </h2>
                <p className="text-sm text-muted-foreground">
                  Rejoin your groups, current votes, and movie picks.
                </p>
              </div>
            </div>
            <form action={signInAction} className="space-y-4">
              {params.next && <input name="next" type="hidden" value={params.next} />}
              <label className="block space-y-2 text-sm text-foreground">
                <span>Email</span>
                <input
                  required
                  className={inputClassName}
                  name="email"
                  type="email"
                />
              </label>
              <label className="block space-y-2 text-sm text-foreground">
                <span>Password</span>
                <input
                  required
                  className={inputClassName}
                  name="password"
                  type="password"
                />
              </label>
              <button className={buttonVariants()}>
                Continue
              </button>
            </form>
          </div>

          <div className="border-t border-border bg-secondary/50 p-5 sm:p-6 lg:border-l lg:border-t-0">
            <div className="space-y-5">
              <div className="space-y-2">
                <SectionHeading>Create account</SectionHeading>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  New account
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-card px-4 py-4">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Users className="h-4 w-4" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-foreground">Create a group</p>
                  <p className="mt-1 text-sm text-muted-foreground">Start planning in a shared space.</p>
                </div>
                <div className="rounded-xl border border-border bg-card px-4 py-4">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-foreground">Vote together</p>
                  <p className="mt-1 text-sm text-muted-foreground">Rank your top three without extra clutter.</p>
                </div>
              </div>
              <form action={signUpAction} className="space-y-4">
                {params.next && <input name="next" type="hidden" value={params.next} />}
                <label className="block space-y-2 text-sm text-foreground">
                  <span>Display name</span>
                  <input
                    required
                    className={inputClassName}
                    name="displayName"
                    type="text"
                  />
                </label>
                <label className="block space-y-2 text-sm text-foreground">
                  <span>Email</span>
                  <input
                    required
                    className={inputClassName}
                    name="email"
                    type="email"
                  />
                </label>
                <label className="block space-y-2 text-sm text-foreground">
                  <span>Password</span>
                  <input
                    required
                    className={inputClassName}
                    minLength={6}
                    name="password"
                    type="password"
                  />
                </label>
                <button className={buttonVariants()}>
                  Create
                </button>
              </form>
            </div>
          </div>
        </section>
      </Panel>
    </AppShell>
  );
}
