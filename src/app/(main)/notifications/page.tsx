"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  MessageSquare,
  Package,
  Crown,
  Megaphone,
  CheckCheck,
  ArrowRight,
} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

const TYPE_ICONS: Record<string, { icon: typeof Bell; color: string }> = {
  GENERAL: { icon: Bell, color: "bg-gray-100 text-gray-600" },
  TICKET_REPLY: { icon: MessageSquare, color: "bg-blue-100 text-blue-600" },
  ORDER_UPDATE: { icon: Package, color: "bg-purple-100 text-purple-600" },
  SUBSCRIPTION: { icon: Crown, color: "bg-gold-100 text-gold-600" },
  SYSTEM: { icon: Megaphone, color: "bg-red-100 text-red-600" },
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => setNotifications(data.notifications || []))
      .finally(() => setLoading(false));
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  async function handleClick(notif: Notification) {
    if (!notif.isRead) {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notif.id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
    }
    if (notif.link) {
      router.push(notif.link);
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold">اعلان‌ها</h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1 text-xs text-primary font-medium"
          >
            <CheckCheck className="w-4 h-4" />
            خواندن همه
          </button>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const typeInfo = TYPE_ICONS[notif.type] || TYPE_ICONS.GENERAL;
            return (
              <button
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={`w-full text-right flex items-start gap-3 p-4 rounded-[var(--radius-card)] border transition-colors ${
                  notif.isRead
                    ? "bg-white border-surface-container"
                    : "bg-primary/5 border-primary/20"
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${typeInfo.color}`}>
                  <typeInfo.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold truncate">{notif.title}</p>
                    {!notif.isRead && (
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-on-surface-muted mt-1 line-clamp-2">
                    {notif.message}
                  </p>
                  <p className="text-[10px] text-on-surface-muted mt-2">
                    {new Date(notif.createdAt).toLocaleDateString("fa-IR", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {notif.link && (
                  <ArrowRight className="w-4 h-4 text-on-surface-muted shrink-0 mt-1 rotate-180" />
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-on-surface-muted">
          <Bell className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-sm">اعلانی ندارید</p>
        </div>
      )}
    </div>
  );
}
