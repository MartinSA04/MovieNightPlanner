"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonVariants, cn } from "@movie-night/ui";

interface DeleteGroupButtonProps {
  groupId: string;
}

interface DeleteGroupResponse {
  error?: string;
  status?: "deleted";
}

export function DeleteGroupButton({ groupId }: DeleteGroupButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      "Delete this group and all of its movie nights? This cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    setError(null);
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: "DELETE"
      });
      const payload = (await response.json().catch(() => null)) as DeleteGroupResponse | null;

      if (!response.ok) {
        setError(payload?.error ?? "Could not delete group.");
        return;
      }

      router.push("/dashboard?notice=Group%20deleted.");
      router.refresh();
    } catch {
      setError("Could not delete group.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button
        className={cn(
          buttonVariants({ size: "sm", variant: "secondary" }),
          "border border-destructive/40 bg-transparent text-destructive hover:border-destructive/60 hover:bg-destructive/10 hover:text-destructive"
        )}
        disabled={isDeleting}
        onClick={() => void handleDelete()}
        type="button"
      >
        {isDeleting ? "Deleting" : "Delete"}
      </button>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
