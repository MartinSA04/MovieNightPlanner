import { buttonVariants, inputClassName } from "@movie-night/ui";
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
      title="Welcome back"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-7">
          <div className="mb-5 space-y-1">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Sign in</h2>
            <p className="text-sm text-muted-foreground">Continue where you left off.</p>
          </div>
          <form action={signInAction} className="space-y-4">
            {params.next && <input name="next" type="hidden" value={params.next} />}
            <label className="grid gap-2 text-sm font-medium text-foreground">
              <span>Email</span>
              <input required className={inputClassName} name="email" type="email" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
              <span>Password</span>
              <input required className={inputClassName} name="password" type="password" />
            </label>
            <button className={buttonVariants()} type="submit">
              Sign in
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-7">
          <div className="mb-5 space-y-1">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Create account
            </h2>
            <p className="text-sm text-muted-foreground">
              Get a calm space to pick a movie together.
            </p>
          </div>
          <form action={signUpAction} className="space-y-4">
            {params.next && <input name="next" type="hidden" value={params.next} />}
            <label className="grid gap-2 text-sm font-medium text-foreground">
              <span>Display name</span>
              <input required className={inputClassName} name="displayName" type="text" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
              <span>Email</span>
              <input required className={inputClassName} name="email" type="email" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
              <span>Password</span>
              <input
                required
                className={inputClassName}
                minLength={6}
                name="password"
                type="password"
              />
            </label>
            <button className={buttonVariants()} type="submit">
              Create account
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
