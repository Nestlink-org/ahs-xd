import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/session";
import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Auth — read session cookie
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }
  const session = await decrypt(token);
  if (!session?.userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.userId;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial data immediately
      async function sendNotifications() {
        try {
          await connectDB();

          // Auto-delete notifications older than 24h
          await Notification.deleteMany({
            createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          });

          const notifications = await Notification.find({ userId })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

          const unreadCount = notifications.filter((n) => !n.read).length;

          const data = JSON.stringify({
            notifications: JSON.parse(JSON.stringify(notifications)),
            unreadCount,
          });

          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch {
          // Stream may have closed
        }
      }

      // Send immediately on connect
      await sendNotifications();

      // Poll DB every 3 seconds and push updates
      const interval = setInterval(sendNotifications, 3000);

      // Clean up when client disconnects
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
