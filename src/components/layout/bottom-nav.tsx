"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Wallet, MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "خانه", icon: Home },
  { href: "/wallet", label: "کیف پول", icon: Wallet },
  { href: "/tickets", label: "پشتیبانی", icon: MessageSquare },
  { href: "/profile", label: "پروفایل", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

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
                "flex flex-col items-center justify-center gap-1 w-full h-full transition-colors",
                isActive
                  ? "text-primary"
                  : "text-on-surface-muted"
              )}
            >
              {isActive ? (
                <div className="bg-primary rounded-full p-2.5 -mt-5 shadow-lg shadow-primary/30">
                  <tab.icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
              ) : (
                <tab.icon className="w-5 h-5" strokeWidth={1.5} />
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
