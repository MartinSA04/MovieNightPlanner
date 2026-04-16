"use client";

import { Suspense, useEffect, useState } from "react";
import { CircleAlert, CircleCheckBig, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@movie-night/ui";

const FEEDBACK_QUERY_KEYS = ["error", "notice", "message"] as const;
const TOAST_DURATION_MS = 4000;

interface FeedbackToastState {
  id: string;
  kind: "error" | "notice";
  message: string;
}

function FeedbackToastInner() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [toast, setToast] = useState<FeedbackToastState | null>(null);
  const search = searchParams.toString();

  useEffect(() => {
    const error = searchParams.get("error");
    const notice = searchParams.get("notice") ?? searchParams.get("message");

    if (!error && !notice) {
      return;
    }

    const nextToast = error
      ? {
          id: `${pathname}:error:${error}`,
          kind: "error" as const,
          message: error
        }
      : {
          id: `${pathname}:notice:${notice}`,
          kind: "notice" as const,
          message: notice ?? ""
        };

    setToast(nextToast);

    const nextParams = new URLSearchParams(search);

    for (const key of FEEDBACK_QUERY_KEYS) {
      nextParams.delete(key);
    }

    const nextUrl = nextParams.toString().length > 0 ? `${pathname}?${nextParams.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [pathname, router, search, searchParams]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, TOAST_DURATION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [toast]);

  if (!toast) {
    return null;
  }

  const isError = toast.kind === "error";
  const Icon = isError ? CircleAlert : CircleCheckBig;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4 sm:justify-end sm:px-6 lg:px-8">
      <div
        className={cn(
          "pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur",
          isError
            ? "border-rose-200 bg-rose-50/95 text-rose-900 dark:border-rose-500/20 dark:bg-rose-500/15 dark:text-rose-200"
            : "border-emerald-200 bg-emerald-50/95 text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-200"
        )}
        role={isError ? "alert" : "status"}
      >
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <p className="min-w-0 flex-1 text-sm font-medium">{toast.message}</p>
        <button
          aria-label="Dismiss notification"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-current/70 transition hover:bg-black/5 hover:text-current dark:hover:bg-white/10"
          onClick={() => setToast(null)}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function FeedbackToast() {
  return (
    <Suspense fallback={null}>
      <FeedbackToastInner />
    </Suspense>
  );
}
