"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface EventRealtimeSyncProps {
  eventId: string;
}

export function EventRealtimeSync({ eventId }: EventRealtimeSyncProps) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`event-sync-${eventId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "votes", filter: `event_id=eq.${eventId}` },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "movie_suggestions",
          filter: `event_id=eq.${eventId}`
        },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "movie_night_events",
          filter: `id=eq.${eventId}`
        },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments", filter: `event_id=eq.${eventId}` },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [eventId, router]);

  return null;
}
