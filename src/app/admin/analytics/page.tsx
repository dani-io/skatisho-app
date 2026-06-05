"use client";

import { useEffect, useState } from "react";
import {
  Users, TrendingUp, MapPin, Calendar, BarChart3, PieChart,
} from "lucide-react";
import { formatPrice, toPersianDigits } from "@/lib/utils";

interface Data {
  genderStats: { male: number; female: number; unknown: number };
  ageGroups: Record<string, number>;
  topCities: { city: string; count: number }[];
  monthlyRevenue: Record<string, number>;
  dailyRevenue: Record<string, number>;
  userGrowth: Record<string, number>;
  categoryStats: Record<string, { count: number; revenue: number }>;
  totalUsers: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  INLINE_SKATE: "اسکیت اینلاین", SPEED_SKATE: "اسکیت سرعت",
  PROTECTIVE_GEAR: "محافظ", WHEELS: "چرخ",
  BEARINGS: "بلبرینگ", ACCESSORIES: "لوازم جانبی",
};

function getMonthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  try {
    const d = new Date(y, m - 1, 15);
    return new Intl.DateTimeFormat("fa-IR", { month: "short" }).format(d);
  } catch { return key; }
}

function getDayLabel(key: string) {
  try {
    const d = new Date(key);
    return new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "numeric" }).format(d);
  } catch { return key; }
}

function Bar({ value, max, color = "bg-primary" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="h-full flex flex-col justify-end items-center">
      <div className={`w-full ${color} rounded-t-md transition-all`} style={{ height: `${Math.max(pct, 2)}%` }} />
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [revenueView, setRevenueView] = useState<"monthly" | "daily">("monthly");

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { genderStats, ageGroups, topCities, monthlyRevenue, dailyRevenue, userGrowth, categoryStats } = data;
  const genderTotal = genderStats.male + genderStats.female + genderStats.unknown;
  const revenueData = revenueView === "monthly" ? monthlyRevenue : dailyRevenue;
  const maxRevenue = Math.max(...Object.values(revenueData), 1);
  const maxUserGrowth = Math.max(...Object.values(userGrowth), 1);

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">گزارشات و آنالیتیکس</h1>

      {/* Gender Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-4">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-sm">توزیع جنسیتی</h2>
            <span className="text-[11px] text-on-surface-muted mr-auto">{toPersianDigits(genderTotal)} کاربر</span>
          </div>
          <div className="flex gap-3 mb-3">
            {[
              { label: "آقا", value: genderStats.male, color: "bg-blue-500" },
              { label: "خانم", value: genderStats.female, color: "bg-pink-500" },
              { label: "نامشخص", value: genderStats.unknown, color: "bg-gray-300" },
            ].map((g) => (
              <div key={g.label} className="flex-1 text-center">
                <p className="text-2xl font-bold">{toPersianDigits(g.value)}</p>
                <p className="text-[11px] text-on-surface-muted">{g.label}</p>
              </div>
            ))}
          </div>
          {/* Bar */}
          <div className="h-3 rounded-full overflow-hidden flex">
            {genderTotal > 0 && (
              <>
                <div className="bg-blue-500 h-full" style={{ width: `${(genderStats.male / genderTotal) * 100}%` }} />
                <div className="bg-pink-500 h-full" style={{ width: `${(genderStats.female / genderTotal) * 100}%` }} />
                <div className="bg-gray-300 h-full" style={{ width: `${(genderStats.unknown / genderTotal) * 100}%` }} />
              </>
            )}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-on-surface-muted">
            <span>آقا {genderTotal > 0 ? toPersianDigits(Math.round((genderStats.male / genderTotal) * 100)) : "۰"}٪</span>
            <span>خانم {genderTotal > 0 ? toPersianDigits(Math.round((genderStats.female / genderTotal) * 100)) : "۰"}٪</span>
          </div>
        </div>

        {/* Age Distribution */}
        <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-sm">بازه سنی</h2>
          </div>
          <div className="space-y-2">
            {Object.entries(ageGroups).map(([label, count]) => {
              const maxAge = Math.max(...Object.values(ageGroups), 1);
              return (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-[11px] text-on-surface-muted w-14 text-left">{label}</span>
                  <div className="flex-1 h-5 bg-surface-dim rounded-full overflow-hidden">
                    <div className="h-full bg-primary/70 rounded-full transition-all"
                      style={{ width: `${(count / maxAge) * 100}%` }} />
                  </div>
                  <span className="text-xs font-bold w-6 text-center">{toPersianDigits(count)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* City Distribution */}
      <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-4 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-primary" />
          <h2 className="font-bold text-sm">توزیع جغرافیایی</h2>
        </div>
        {topCities.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {topCities.map((c, i) => (
              <div key={c.city} className="text-center p-3 bg-surface-dim rounded-xl">
                <p className="text-lg font-bold">{toPersianDigits(c.count)}</p>
                <p className="text-[11px] text-on-surface-muted">{c.city}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-on-surface-muted text-center py-4">داده‌ای موجود نیست</p>
        )}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-sm">روند درآمد</h2>
          </div>
          <div className="flex gap-1">
            {[
              { id: "monthly" as const, label: "ماهانه" },
              { id: "daily" as const, label: "روزانه" },
            ].map((v) => (
              <button key={v.id} onClick={() => setRevenueView(v.id)}
                className={`px-3 py-1 rounded-lg text-[11px] font-medium ${
                  revenueView === v.id ? "bg-primary text-black" : "bg-surface-dim text-on-surface-muted"
                }`}>
                {v.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-end gap-1 h-36">
          {Object.entries(revenueData).map(([key, value]) => (
            <div key={key} className="flex-1 flex flex-col items-center h-full">
              <Bar value={value} max={maxRevenue} />
              <span className="text-[8px] text-on-surface-muted mt-1 whitespace-nowrap">
                {revenueView === "monthly" ? getMonthLabel(key) : getDayLabel(key)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 text-left">
          <span className="text-[10px] text-on-surface-muted">
            مجموع: {formatPrice(Object.values(revenueData).reduce((a, b) => a + b, 0))}
          </span>
        </div>
      </div>

      {/* User Growth */}
      <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-4 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-primary" />
          <h2 className="font-bold text-sm">رشد کاربران (ماهانه)</h2>
        </div>
        <div className="flex items-end gap-1 h-28">
          {Object.entries(userGrowth).map(([key, value]) => (
            <div key={key} className="flex-1 flex flex-col items-center h-full">
              <Bar value={value} max={maxUserGrowth} color="bg-blue-500" />
              <span className="text-[8px] text-on-surface-muted mt-1">{getMonthLabel(key)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sales by Category */}
      {Object.keys(categoryStats).length > 0 && (
        <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-4 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-sm">فروش بر اساس دسته‌بندی</h2>
          </div>
          <div className="space-y-3">
            {Object.entries(categoryStats)
              .sort((a, b) => b[1].revenue - a[1].revenue)
              .map(([cat, stats]) => {
                const maxCatRevenue = Math.max(...Object.values(categoryStats).map((s) => s.revenue), 1);
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{CATEGORY_LABELS[cat] || cat}</span>
                      <span className="text-xs text-on-surface-muted">
                        {toPersianDigits(stats.count)} عدد — {formatPrice(stats.revenue)}
                      </span>
                    </div>
                    <div className="h-2 bg-surface-dim rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full"
                        style={{ width: `${(stats.revenue / maxCatRevenue) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
