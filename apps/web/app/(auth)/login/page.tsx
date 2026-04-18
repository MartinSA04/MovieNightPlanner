import { Panel, SectionHeading } from "@movie-night/ui";
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
      subtitle="Sign in or create an account."
      title="Login"
    >
      <Panel className="overflow-hidden p-0">
        <section className="grid gap-0 lg:grid-cols-2">
          <div className="space-y-5 p-5 sm:p-6">
            <div className="space-y-2">
              <SectionHeading>Sign in</SectionHeading>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                Existing account
              </h2>
            </div>
            <form action={signInAction} className="space-y-4">
              {params.next && <input name="next" type="hidden" value={params.next} />}
              <label className="block space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <span>Email</span>
                <input
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-amber-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  name="email"
                  type="email"
                />
              </label>
              <label className="block space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <span>Password</span>
                <input
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-amber-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  name="password"
                  type="password"
                />
              </label>
              <button className="inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-amber-300 dark:text-slate-950 dark:hover:bg-amber-200">
                Sign in
              </button>
            </form>
          </div>

          <div className="border-t border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-900/70 sm:p-6 lg:border-l lg:border-t-0">
            <div className="space-y-5">
              <div className="space-y-2">
                <SectionHeading>Create account</SectionHeading>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  New account
                </h2>
              </div>
              <form action={signUpAction} className="space-y-4">
                {params.next && <input name="next" type="hidden" value={params.next} />}
                <label className="block space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  <span>Display name</span>
                  <input
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-amber-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    name="displayName"
                    type="text"
                  />
                </label>
                <label className="block space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  <span>Email</span>
                  <input
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-amber-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    name="email"
                    type="email"
                  />
                </label>
                <label className="block space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  <span>Password</span>
                  <input
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-amber-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    minLength={6}
                    name="password"
                    type="password"
                  />
                </label>
                <button className="inline-flex rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200">
                  Create account
                </button>
              </form>
            </div>
          </div>
        </section>
      </Panel>
    </AppShell>
  );
}
