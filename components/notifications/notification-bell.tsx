"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  Bell,
  X,
  CheckCheck,
  AlertTriangle,
  Info,
  XCircle,
} from "lucide-react";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/actions/notifications";
import { Badge } from "@/components/ui/badge";

type Notification = {
  _id: string;
  type: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  read: boolean;
  createdAt: string;
};

const SEVERITY_STYLES = {
  critical: {
    icon: XCircle,
    iconClass: "text-destructive",
    bg: "bg-destructive/10 border-destructive/20",
    dot: "bg-destructive",
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
    dot: "bg-yellow-400",
  },
  info: {
    icon: Info,
    iconClass: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    dot: "bg-blue-400",
  },
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPending, startTransition] = useTransition();
  const prevUnread = useRef(-1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // SSE — real-time updates from server
  useEffect(() => {
    const STORAGE_KEY = "notif_last_count";
    const es = new EventSource("/api/notifications/stream");

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);

        // Read last known count from sessionStorage (persists across navigation)
        const stored = parseInt(
          sessionStorage.getItem(STORAGE_KEY) ?? "-1",
          10,
        );

        if (stored === -1) {
          // First ever load in this browser session — play if unread exist
          if (data.unreadCount > 0) {
            audioRef.current?.play().catch(() => {});
          }
        } else if (data.unreadCount > stored) {
          // Genuinely new notifications arrived
          audioRef.current?.play().catch(() => {});
        }

        sessionStorage.setItem(STORAGE_KEY, String(data.unreadCount));
        prevUnread.current = data.unreadCount;
      } catch {}
    };

    es.onerror = () => {};

    return () => es.close();
  }, []);

  // Close panel on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleMarkRead(id: string) {
    startTransition(async () => {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
      );
      const newCount = Math.max(0, unreadCount - 1);
      setUnreadCount(newCount);
      sessionStorage.setItem("notif_last_count", String(newCount));
    });
  }

  function handleMarkAll() {
    startTransition(async () => {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      sessionStorage.setItem("notif_last_count", "0");
    });
  }

  return (
    <div className="relative" ref={panelRef}>
      <audio ref={audioRef} src="/notification.wav" preload="auto" />

      {/* Bell */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted/60 transition-colors cursor-pointer"
        aria-label="Notifications"
      >
        <Bell
          className={`h-4 w-4 ${unreadCount > 0 ? "text-foreground" : "text-muted-foreground"}`}
        />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive flex items-center justify-center">
            <span className="text-[9px] font-bold text-white leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute right-0 top-10 w-80 sm:w-96 z-50 rounded-2xl border border-border/60 bg-card shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">
                Notifications
              </p>
              {unreadCount > 0 && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 h-4 bg-destructive/15 text-destructive border-destructive/30"
                >
                  {unreadCount} new
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAll}
                  disabled={isPending}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors px-2 py-1 rounded-md hover:bg-muted/50"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted/60 cursor-pointer transition-colors text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Bell className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">All caught up</p>
              </div>
            ) : (
              notifications.map((n) => {
                const style = SEVERITY_STYLES[n.severity];
                const Icon = style.icon;
                return (
                  <div
                    key={n._id}
                    onClick={() => !n.read && handleMarkRead(n._id)}
                    className={`flex gap-3 px-4 py-3 border-b border-border/40 transition-colors cursor-pointer ${
                      n.read ? "opacity-50" : "hover:bg-muted/30"
                    }`}
                  >
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${style.bg}`}
                    >
                      <Icon className={`h-4 w-4 ${style.iconClass}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-foreground leading-tight">
                          {n.title}
                        </p>
                        {!n.read && (
                          <div
                            className={`h-2 w-2 rounded-full shrink-0 mt-1.5 ${style.dot}`}
                          />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground/50 mt-1">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-border/60 bg-muted/20">
              <p className="text-xs text-muted-foreground text-center">
                Showing last 24h · Click to mark as read
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
