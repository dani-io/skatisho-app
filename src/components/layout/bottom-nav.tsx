"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, GraduationCap, ShoppingBag, MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/profile", label: "پروفایل", icon: User },
  { href: "/tickets", label: "پشتیبانی", icon: MessageSquare, badge: true },
  { href: "/shop", label: "فروشگاه", icon: ShoppingBag },
  { href: "/courses", label: "آکادمی", icon: GraduationCap },
  { href: "/", label: "خانه", icon: Home },
];

export function BottomNav() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    function checkUnread() {
      fetch("/api/tickets")
        .then((r) => r.json())
        .then((data) => {
          const tickets = data.tickets || [];
          const count = tickets.filter((t: any) =>
            t.status === "ANSWERED" && t.hasUnread
          ).length;
          setUnreadCount(count);
        })
        .catch(() => {});
    }

    checkUnread();
    const interval = setInterval(checkUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-surface-container pb-safe">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full h-full transition-colors relative",
                isActive ? "text-primary" : "text-on-surface-muted"
              )}
            >
              {isActive ? (
                <div className="bg-primary rounded-full p-2.5 -mt-5 shadow-lg shadow-primary/30 relative">
                  <tab.icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                  {tab.badge && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? "۹+" : unreadCount}
                    </span>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <tab.icon className="w-5 h-5" strokeWidth={1.5} />
                  {tab.badge && unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 w-4 h-4 bg-error text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? "۹+" : unreadCount}
                    </span>
                  )}
                </div>
              )}
              <span className={cn("text-[10px]", isActive && "font-bold")}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
