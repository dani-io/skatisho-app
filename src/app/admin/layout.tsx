"use client";

import {
useEffect, useState } from "react";
import {
useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  MessageSquare,
  Tag,
  Gift,
  BarChart3,
  Package,
  LayoutDashboard,
  Users,
  BookOpen,
  ShoppingBag,
  Crown,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import {
  cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "داشبورد", icon: LayoutDashboard },
  { href: "/admin/users", label: "کاربران", icon: Users },
  { href: "/admin/courses", label: "دوره‌ها و ویدئوها", icon: BookOpen },
  { href: "/admin/subscriptions", label: "اشتراک‌ها", icon: Crown },
  { href: "/admin/products", label: "فروشگاه", icon: ShoppingBag },
  { href: "/admin/tickets", label: "تیکت‌ها", icon: MessageSquare },
  { href: "/admin/coupons", label: "کدهای تخفیف", icon: Tag },
  { href: "/admin/gift-cards", label: "کارت هدیه", icon: Gift },
  { href: "/admin/orders", label: "سفارشات", icon: Package },
  { href: "/admin/analytics", label: "گزارشات", icon: BarChart3 },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch("/api/admin/check")
      .then((r) => {
        if (!r.ok) {
          router.push("/");
          return;
        }
        setAuthorized(true);
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="flex h-screen bg-surface-dim" dir="rtl">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-l border-surface-container">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Sidebar - Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute right-0 top-0 bottom-0 w-64 bg-white shadow-xl">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 left-4"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent pathname={pathname} />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-surface-container h-14 flex items-center px-4 gap-3">
          <button
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-sm">پنل مدیریت اسکیتی‌شو</h1>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ pathname }: { pathname: string }) {
  return (
    <>
      <div className="p-4 border-b border-surface-container">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <img src="/icons/logo.svg" alt="" className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-sm">اسکیتی‌شو</p>
            <p className="text-[10px] text-on-surface-muted">پنل مدیریت</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-bold"
                  : "text-on-surface-muted hover:bg-surface-dim"
              )}
            >
              <item.icon className="w-4.5 h-4.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-surface-container">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-on-surface-muted hover:bg-surface-dim"
        >
          <LogOut className="w-4.5 h-4.5" />
          بازگشت به اپ
        </Link>
      </div>
    </>
  );
}
