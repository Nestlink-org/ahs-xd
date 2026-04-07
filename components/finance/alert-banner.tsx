"use client";

import { AlertTriangle, XCircle, X } from "lucide-react";
import { useState } from "react";
import type { Alert } from "@/actions/finance";

export function AlertBanner({ alerts }: { alerts: Alert[] }) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const visible = alerts.filter((a) => !dismissed.includes(a.type));
  if (!visible.length) return null;

  return (
    <div className="flex flex-col gap-2">
      {visible.map((alert) => {
        const isCritical = alert.severity === "critical";
        return (
          <div
            key={alert.type}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm ${
              isCritical
                ? "bg-destructive/10 border-destructive/30 text-destructive"
                : "bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400"
            }`}
          >
            {isCritical ? (
              <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            )}
            <p className="flex-1">{alert.message}</p>
            <button
              onClick={() => setDismissed((d) => [...d, alert.type])}
              className="shrink-0 opacity-60 hover:opacity-100 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
