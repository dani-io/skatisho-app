"use client";

import {
useEffect, useState } from "react";
import {
useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Image,
  MessageSquare,
  Tag,
  Gift,
  BarChart3,
  Package,
  LayoutDashboard,
  Users,
  UserCog,
  BookOpen,
  ShoppingBag,
  Crown,
  LogOut,
  Menu,
  X,
  ArrowRight,
  HelpCircle,
  Truck,
  Globe,
  ShieldCheck,
} from "lucide-react";
import {
  cn } from "@/lib/utils";

/**
 * `perm` is the permission key the section's API routes are gated on, so the
 * sidebar and the server agree on what a section IS. `superAdminOnly` marks the
 * one section that is not delegable through the permissions array.
 *
 * Filtering here is COSMETIC. It stops an admin from being shown doors they
 * cannot open; it is not what keeps them out. Every route behind these links
 * runs its own requirePermission/requireSuperAdmin check server-side, which is
 * what actually holds when someone types the URL directly.
 */
const NAV_ITEMS = [
  { href: "/admin", label: "داشبورد", icon: LayoutDashboard, perm: "dashboard" },
  { href: "/admin/users", label: "کاربران", icon: Users, perm: "users" },
  { href: "/admin/courses", label: "دوره‌ها و ویدئوها", icon: BookOpen, perm: "courses" },
  { href: "/admin/coaches", label: "مربیان", icon: UserCog, perm: "coaches" },
  { href: "/admin/subscriptions", label: "اشتراک‌ها", icon: Crown, perm: "subscriptions" },
  { href: "/admin/products", label: "فروشگاه", icon: ShoppingBag, perm: "products" },
  { href: "/admin/tickets", label: "تیکت‌ها", icon: MessageSquare, perm: "tickets" },
  { href: "/admin/coupons", label: "کدهای تخفیف", icon: Tag, perm: "coupons" },
  { href: "/admin/banners", label: "بنرها", icon: Image, perm: "banners" },
  { href: "/admin/gift-cards", label: "کارت هدیه", icon: Gift, perm: "gift-cards" },
  { href: "/admin/faq", label: "سوالات متداول", icon: HelpCircle, perm: "faq" },
  { href: "/admin/shipping", label: "روش‌های ارسال", icon: Truck, perm: "shipping" },
  { href: "/admin/social", label: "شبکه‌های اجتماعی", icon: Globe, perm: "social" },
  { href: "/admin/orders", label: "سفارشات", icon: Package, perm: "orders" },
  { href: "/admin/analytics", label: "گزارشات", icon: BarChart3, perm: "reports" },
  {
    href: "/admin/admins",
    label: "مدیران",
    icon: ShieldCheck,
    perm: "admins",
    superAdminOnly: true,
  },
];

interface AdminAccess {
  superAdmin: boolean;
  permissions: string[];
}

function visibleNavItems(access: AdminAccess | null) {
  if (!access) return [];
  // Super-admins (and, this phase, legacy phone admins, whom the API reports as
  // superAdmin) see everything.
  if (access.superAdmin) return NAV_ITEMS;
  return NAV_ITEMS.filter(
    (item) => !item.superAdminOnly && access.permissions.includes(item.perm)
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [access, setAccess] = useState<AdminAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // The sign-in screen lives under /admin but must render for a signed-out
  // visitor — running the guard here would bounce the very people who came to
  // log in. It gets no sidebar either; it is not part of the panel.
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) return;
    fetch("/api/admin/check")
      .then(async (r) => {
        if (!r.ok) {
          router.push("/");
          return;
        }
        const d = await r.json().catch(() => null);
        setAuthorized(true);
        setAccess({
          superAdmin: !!d?.superAdmin,
          permissions: Array.isArray(d?.permissions) ? d.permissions : [],
        });
      })
      .finally(() => setLoading(false));
  }, [router, isLoginPage]);

  if (isLoginPage) return <>{children}</>;

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
        <SidebarContent pathname={pathname} access={access} />
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
            <SidebarContent pathname={pathname} access={access} />
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

/**
 * Ends the session and leaves the panel.
 *
 * A full document navigation rather than router.push: logging out has to drop
 * every cached RSC payload the panel accumulated, or the next render can serve
 * admin data from the router cache to a browser that no longer has a session.
 */
function LogoutButton() {
  const [signingOut, setSigningOut] = useState(false);

  async function handleLogout() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      // Leave regardless: a failed request must not strand someone inside the
      // panel with a button that looks broken.
      window.location.href = "/admin/login";
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={signingOut}
      className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-error hover:bg-red-50 disabled:opacity-60"
    >
      <LogOut className="w-4.5 h-4.5" />
      {signingOut ? "در حال خروج..." : "خروج"}
    </button>
  );
}

function SidebarContent({
  pathname,
  access,
}: {
  pathname: string;
  access: AdminAccess | null;
}) {
  const items = visibleNavItems(access);
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
        {items.length === 0 && (
          <p className="px-3 py-2.5 text-xs text-on-surface-muted leading-relaxed">
            هنوز دسترسی به هیچ بخشی برای شما فعال نشده است. با مدیر ارشد تماس
            بگیرید.
          </p>
        )}
        {items.map((item) => {
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

      <div className="p-3 border-t border-surface-container space-y-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-on-surface-muted hover:bg-surface-dim"
        >
          <ArrowRight className="w-4.5 h-4.5" />
          بازگشت به اپ
        </Link>
        <LogoutButton />
      </div>
    </>
  );
}
