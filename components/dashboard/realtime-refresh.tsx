"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Invisible component — mounts in dashboard layout.
 * Listens to the SSE notification stream and calls router.refresh()
 * whenever new data arrives, keeping all server components up to date
 * without a full page reload.
 */
export function RealtimeRefresh() {
  const router = useRouter();
  const lastCount = useRef<number>(-1);

  useEffect(() => {
    const es = new EventSource("/api/notifications/stream");

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const count: number = data.unreadCount ?? 0;

        // Only refresh when notification count changes (new activity happened)
        if (lastCount.current !== -1 && count !== lastCount.current) {
          router.refresh();
        }
        lastCount.current = count;
      } catch {}
    };

    return () => es.close();
  }, [router]);

  return null;
}
