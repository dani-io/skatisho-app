"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Crown,
  BookOpen,
  PlayCircle,
  ShoppingBag,
  DollarSign,
} from "lucide-react";
import { formatPrice, toPersianDigits } from "@/lib/utils";

interface Stats {
  totalUsers: number;
  activeSubscriptions: number;
  totalCourses: number;
  totalLessons: number;
  totalProducts: number;
  totalRevenue: number;
}

interface RecentUser {
  id: string;
  name: string | null;
  phone: string;
  createdAt: string;
}

const STAT_CARDS = [
  { key: "totalUsers", label: "کاربران", icon: Users, color: "bg-blue-50 text-blue-600" },
  { key: "activeSubscriptions", label: "اشتراک فعال", icon: Crown, color: "bg-gold-50 text-gold-600" },
  { key: "totalCourses", label: "دوره‌ها", icon: BookOpen, color: "bg-green-50 text-green-600" },
  { key: "totalLessons", label: "دروس", icon: PlayCircle, color: "bg-purple-50 text-purple-600" },
  { key: "totalProducts", label: "محصولات", icon: ShoppingBag, color: "bg-red-50 text-red-600" },
  { key: "totalRevenue", label: "درآمد کل", icon: DollarSign, color: "bg-emerald-50 text-emerald-600", isCurrency: true },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats);
        setRecentUsers(data.recentUsers || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">داشبورد</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {STAT_CARDS.map((card) => {
          const value = stats?.[card.key as keyof Stats] ?? 0;
          return (
            <div
              key={card.key}
              className="bg-white rounded-[var(--radius-card)] border border-surface-container p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.color}`}>
                  <card.icon className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs text-on-surface-muted">{card.label}</span>
              </div>
              <p className="text-2xl font-bold">
                {card.isCurrency
                  ? formatPrice(value as number)
                  : toPersianDigits(value)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Recent Users */}
      <div className="bg-white rounded-[var(--radius-card)] border border-surface-container">
        <div className="p-4 border-b border-surface-container">
          <h2 className="font-bold text-sm">آخرین کاربران</h2>
        </div>
        <div className="divide-y divide-surface-container">
          {recentUsers.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium">
                  {user.name || "بدون نام"}
                </p>
                <p className="text-xs text-on-surface-muted" dir="ltr">
                  {user.phone}
                </p>
              </div>
              <span className="text-xs text-on-surface-muted">
                {new Date(user.createdAt).toLocaleDateString("fa-IR")}
              </span>
            </div>
          ))}
          {recentUsers.length === 0 && (
            <p className="p-4 text-sm text-on-surface-muted text-center">
              کاربری ثبت نشده
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
