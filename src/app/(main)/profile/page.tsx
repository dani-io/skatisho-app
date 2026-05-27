"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Receipt,
  Heart,
  Crown,
  Share2,
  Headphones,
  Info,
  HelpCircle,
  ChevronLeft,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { toPersianDigits } from "@/lib/utils";

interface UserData {
  id: string;
  phone: string;
  name: string | null;
  referralCode: string;
}

const menuItems = [
  { label: "خرید اشتراک", icon: Crown, href: "/subscription" },
  { label: "فروشگاه اسکیت", icon: Receipt, href: "/shop" },
  { label: "معرفی به دوستان", icon: Share2, href: "/referral" },
  { label: "تماس با ما", icon: Headphones, href: "/contact" },
  { label: "درباره ما", icon: Info, href: "/about" },
  { label: "سوالات متداول", icon: HelpCircle, href: "/faq" },
];

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setUser(data.user));
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="px-4">
      {/* Avatar & Name */}
      <div className="flex flex-col items-center pt-8 pb-6">
        <div className="w-20 h-20 rounded-full bg-surface-dim flex items-center justify-center mb-3">
          <User className="w-8 h-8 text-on-surface-muted" />
        </div>
        <h2 className="font-bold text-lg">
          {user?.name || "کاربر اسکیتی‌شو"}
        </h2>
        {user?.phone && (
          <p className="text-sm text-on-surface-muted mt-0.5" dir="ltr">
            {toPersianDigits(user.phone)}
          </p>
        )}
      </div>

      {/* Menu */}
      <div className="space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center justify-between py-4 px-2 hover:bg-surface-dim rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            <ChevronLeft className="w-4 h-4 text-on-surface-muted" />
          </Link>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 w-full py-4 px-2 mt-4 text-error hover:bg-error/5 rounded-xl transition-colors"
      >
        <LogOut className="w-5 h-5" />
        <span className="text-sm font-medium">خروج از حساب</span>
      </button>
    </div>
  );
}
