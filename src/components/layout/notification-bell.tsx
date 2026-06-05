"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import { toPersianDigits } from "@/lib/utils";

export function NotificationBell() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetch("/api/notifications?count=true")
      .then((r) => r.json())
      .then((data) => setUnread(data.unreadCount || 0))
      .catch(() => {});

    // Poll every 30 seconds
    const interval = setInterval(() => {
      fetch("/api/notifications?count=true")
        .then((r) => r.json())
        .then((data) => setUnread(data.unreadCount || 0))
        .catch(() => {});
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Link href="/notifications" className="relative">
      <div className="w-10 h-10 rounded-full bg-surface-dim flex items-center justify-center">
        <Bell className="w-5 h-5 text-on-surface-muted" />
      </div>
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
          {toPersianDigits(unread > 99 ? 99 : unread)}
        </span>
      )}
    </Link>
  );
}
