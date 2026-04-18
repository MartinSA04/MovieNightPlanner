"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buttonVariants, cn } from "@movie-night/ui";

interface RemoveSuggestionButtonProps {
  eventId: string;
  suggestionId: string;
}

interface RemoveSuggestionResponse {
  error?: string;
  status?: "removed";
}

export function RemoveSuggestionButton({
  eventId,
  suggestionId
}: RemoveSuggestionButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  async function handleRemove() {
    setIsRemoving(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}/suggestions/${suggestionId}`, {
        method: "DELETE"
      });
      const payload = (await response.json().catch(() => null)) as RemoveSuggestionResponse | null;

      if (!response.ok) {
        setError(payload?.error ?? "Could not remove movie.");
        return;
      }

      router.refresh();
    } catch {
      setError("Could not remove movie.");
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button
        className={cn(
          buttonVariants({ size: "sm", variant: "ghost" }),
          "border border-rose-200 bg-white text-rose-700 shadow-none hover:border-rose-300 hover:bg-rose-50 hover:text-rose-800 dark:border-rose-500/30 dark:bg-transparent dark:text-rose-300 dark:hover:border-rose-500/50 dark:hover:bg-rose-500/10 dark:hover:text-rose-200"
        )}
        disabled={isRemoving}
        onClick={() => void handleRemove()}
        type="button"
      >
        {isRemoving ? "Removing" : "Remove"}
      </button>

      {error ? (
        <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p>
      ) : null}
    </div>
  );
}
