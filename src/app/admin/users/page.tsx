"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, X, UserPlus, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toPersianDigits } from "@/lib/utils";

interface User {
  id: string;
  name: string | null;
  phone: string;
  skillLevel: string | null;
  createdAt: string;
  /** Last authenticated request, not last login. Null for users who predate presence tracking. */
  lastSeenAt: string | null;
  subscription: { isActive: boolean; plan: { title: string } } | null;
}

// Presence thresholds. Writes are throttled to one per ~2 minutes per user
// (lib/presence), so "online" has to be comfortably wider than that window or a
// single skipped write would flicker an active user to offline.
const ONLINE_MS = 5 * 60 * 1000;
const RECENT_MS = 30 * 60 * 1000;

/** How often the list refetches so the dots keep meaning something. */
const REFRESH_MS = 45 * 1000;

/** How often the anchored clock advances between refetches. */
const TICK_MS = 15 * 1000;

interface Presence {
  label: string;
  dot: string;
}

function presenceOf(lastSeenAt: string | null, nowMs: number): Presence {
  const offline: Presence = {
    label: "آفلاین",
    dot: "bg-transparent border border-gray-300",
  };
  if (!lastSeenAt) return offline;

  const age = nowMs - new Date(lastSeenAt).getTime();
  if (age < ONLINE_MS) return { label: "آنلاین", dot: "bg-green-500" };
  if (age < RECENT_MS) return { label: "به‌تازگی فعال", dot: "bg-amber-400" };
  return offline;
}

function lastSeenLabel(lastSeenAt: string | null, nowMs: number): string {
  if (!lastSeenAt) return "هرگز";

  const diff = nowMs - new Date(lastSeenAt).getTime();
  // Negative means our clock offset drifted past the last write; "just now" is
  // the honest reading, and it beats rendering "۰ دقیقه پیش" or a negative.
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "هم‌اکنون";
  if (minutes < 60) return `${toPersianDigits(minutes)} دقیقه پیش`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${toPersianDigits(hours)} ساعت پیش`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "دیروز";
  if (days < 7) return `${toPersianDigits(days)} روز پیش`;

  return new Date(lastSeenAt).toLocaleDateString("fa-IR");
}

interface Plan {
  id: string;
  title: string;
  durationDays: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  // Form
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [planId, setPlanId] = useState("");
  const [duration, setDuration] = useState("30");

  // Bulk
  const [showBulk, setShowBulk] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkPlanId, setBulkPlanId] = useState("");
  const [bulkDuration, setBulkDuration] = useState("30");
  const [bulkProgress, setBulkProgress] = useState("");

  /**
   * "Now", on the SERVER's clock. Presence is a comparison against now, and this
   * device's clock is not a trustworthy half of it — a phone that is minutes off
   * would show everyone online, or nobody. Every response re-anchors this to
   * server time; the ticker below advances it in between so the labels stay
   * honest without the browser's clock ever being consulted.
   */
  const [nowMs, setNowMs] = useState<number | null>(null);

  const applyUsers = useCallback((data: { users?: User[]; now?: string }) => {
    setUsers(data.users || []);
    if (data.now) setNowMs(new Date(data.now).getTime());
  }, []);

  const loadData = useCallback(() => {
    Promise.all([
      fetch("/api/admin/users").then((r) => r.json()),
      fetch("/api/admin/subscriptions").then((r) => r.json()),
    ]).then(([userData, subData]) => {
      applyUsers(userData);
      // Extract unique plans from subscriptions or fetch separately
      const planSet = new Map();
      (subData.subscriptions || []).forEach((s: any) => {
        if (s.plan) planSet.set(s.plan.id || s.plan.title, s.plan);
      });
      setPlans(Array.from(planSet.values()));
    }).finally(() => setLoading(false));

    // Also fetch plans directly
    fetch("/api/admin/subscriptions?plans=1")
      .then((r) => r.json())
      .then((d) => { if (d.plans?.length) setPlans(d.plans); });
  }, [applyUsers]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Presence goes stale on its own, so the table has to come back for a fresh
  // reading — otherwise every dot is frozen at whenever the page was opened.
  // Deliberately separate from loadData: this must not raise the spinner or
  // refetch the plan list.
  useEffect(() => {
    let cancelled = false;
    const id = setInterval(() => {
      fetch("/api/admin/users")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!cancelled && data) applyUsers(data);
        })
        .catch(() => {
          // Transient — the next tick retries. A failed refresh must not blank
          // the table the admin is looking at.
        });
    }, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [applyUsers]);

  // Advances the anchored clock between refetches, so "۳ دقیقه پیش" becomes
  // "۴ دقیقه پیش" on its own and a user crossing the 5-minute line stops
  // reading as online. Adding a fixed step rather than reading the local clock
  // keeps server time the only time source on this page.
  useEffect(() => {
    const id = setInterval(() => {
      setNowMs((previous) => (previous === null ? previous : previous + TICK_MS));
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  async function handleCreate() {
    if (!phone.trim()) return;
    setSaving(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), name: name.trim(), planId: planId || null, duration }),
      });
      const data = await res.json();
      if (data.success) {
        setResult({ ok: true, text: `کاربر ${phone} ${planId ? "با اشتراک" : ""} اضافه شد` });
        setPhone("");
        setName("");
        loadData();
      } else {
        setResult({ ok: false, text: data.error });
      }
    } finally { setSaving(false); }
  }

  async function handleBulk() {
    const lines = bulkText.trim().split("\n").filter(Boolean);
    if (!lines.length) return;
    setSaving(true);
    setBulkProgress(`0 / ${lines.length}`);

    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i].split(/[,\t]+/).map((s) => s.trim());
      const ph = parts[0];
      const nm = parts[1] || "";

      await fetch("/api/admin/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: ph,
          name: nm,
          planId: bulkPlanId || null,
          duration: bulkDuration,
        }),
      });
      setBulkProgress(`${i + 1} / ${lines.length}`);
    }

    setBulkProgress(`✅ ${lines.length} کاربر اضافه شد`);
    setSaving(false);
    loadData();
  }

  // nowMs arrives with the first response; until then there is no server clock
  // to judge presence against, so the table waits rather than guessing.
  if (loading || nowMs === null) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  const onlineCount = users.filter(
    (u) => u.lastSeenAt && nowMs - new Date(u.lastSeenAt).getTime() < ONLINE_MS
  ).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">مدیریت کاربران</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setShowBulk(true); setShowForm(false); }}>
            افزودن دسته‌ای
          </Button>
          <Button onClick={() => { setShowForm(true); setShowBulk(false); }}>
            <Plus className="w-4 h-4 ml-2" /> کاربر جدید
          </Button>
        </div>
      </div>

      {/* Single User Form */}
      {showForm && (
        <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold flex items-center gap-2"><UserPlus className="w-4 h-4" /> افزودن کاربر</h2>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4" /></button>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-on-surface-muted mb-1 block">شماره موبایل *</label>
                <input dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09123456789"
                  className="w-full h-10 px-3 text-sm border border-surface-container rounded-lg focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label className="text-[11px] text-on-surface-muted mb-1 block">نام (اختیاری)</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="نام و نام خانوادگی"
                  className="w-full h-10 px-3 text-sm border border-surface-container rounded-lg focus:border-primary focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-on-surface-muted mb-1 block">پلن اشتراک (اختیاری)</label>
                <select value={planId} onChange={(e) => setPlanId(e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-surface-container rounded-lg">
                  <option value="">بدون اشتراک</option>
                  {plans.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-on-surface-muted mb-1 block">مدت (روز)</label>
                <select value={duration} onChange={(e) => setDuration(e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-surface-container rounded-lg">
                  <option value="7">۷ روز</option>
                  <option value="30">۱ ماه</option>
                  <option value="90">۳ ماه</option>
                  <option value="180">۶ ماه</option>
                  <option value="365">۱ سال</option>
                </select>
              </div>
            </div>
            {result && <p className={`text-xs ${result.ok ? "text-green-600" : "text-error"}`}>{result.text}</p>}
            <Button size="full" onClick={handleCreate} disabled={!phone.trim() || saving}>
              {saving ? "..." : "افزودن کاربر"}
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Import */}
      {showBulk && (
        <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold">افزودن دسته‌ای کاربران</h2>
            <button onClick={() => setShowBulk(false)}><X className="w-4 h-4" /></button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-on-surface-muted mb-1 block">
                هر خط: شماره,نام (نام اختیاری)
              </label>
              <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)}
                placeholder={"09121234567,علی احمدی\n09129876543,سارا محمدی\n09131112233"}
                rows={8} dir="ltr"
                className="w-full px-3 py-2 text-sm border border-surface-container rounded-lg focus:border-primary focus:outline-none resize-none font-mono" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-on-surface-muted mb-1 block">پلن اشتراک</label>
                <select value={bulkPlanId} onChange={(e) => setBulkPlanId(e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-surface-container rounded-lg">
                  <option value="">بدون اشتراک</option>
                  {plans.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-on-surface-muted mb-1 block">مدت</label>
                <select value={bulkDuration} onChange={(e) => setBulkDuration(e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-surface-container rounded-lg">
                  <option value="7">۷ روز</option>
                  <option value="30">۱ ماه</option>
                  <option value="90">۳ ماه</option>
                  <option value="180">۶ ماه</option>
                  <option value="365">۱ سال</option>
                </select>
              </div>
            </div>
            {bulkProgress && <p className="text-xs text-primary font-medium">{bulkProgress}</p>}
            <Button size="full" onClick={handleBulk} disabled={!bulkText.trim() || saving}>
              {saving ? "در حال افزودن..." : `افزودن ${bulkText.trim().split("\n").filter(Boolean).length} کاربر`}
            </Button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-[var(--radius-card)] border border-surface-container overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-dim">
            <tr>
              <th className="text-right p-3 font-medium">نام</th>
              <th className="text-right p-3 font-medium">شماره</th>
              <th className="text-right p-3 font-medium">سطح</th>
              <th className="text-right p-3 font-medium">اشتراک</th>
              <th className="text-right p-3 font-medium">آخرین بازدید</th>
              <th className="text-right p-3 font-medium">تاریخ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container">
            {users.map((u) => {
              const presence = presenceOf(u.lastSeenAt, nowMs);
              return (
              <tr key={u.id} className="hover:bg-surface-dim/50 cursor-pointer" onClick={() => window.location.href=`/admin/users/${u.id}`}>
                <td className="p-3">
                  <span className="flex items-center gap-2">
                    {/* Never colour alone: the state is also in the title, in
                        the accessible name, and in the آخرین بازدید column. */}
                    <span
                      role="img"
                      aria-label={presence.label}
                      title={presence.label}
                      className={`w-2 h-2 rounded-full shrink-0 ${presence.dot}`}
                    />
                    <span>{u.name || "—"}</span>
                  </span>
                </td>
                <td className="p-3" dir="ltr">{u.phone}</td>
                <td className="p-3">{u.skillLevel || "—"}</td>
                <td className="p-3">
                  {u.subscription?.isActive ? (
                    <span className="bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full">{u.subscription.plan.title}</span>
                  ) : (
                    <span className="text-on-surface-muted text-xs">ندارد</span>
                  )}
                </td>
                <td className="p-3 text-xs text-on-surface-muted">{lastSeenLabel(u.lastSeenAt, nowMs)}</td>
                <td className="p-3 text-xs text-on-surface-muted">{new Date(u.createdAt).toLocaleDateString("fa-IR")}</td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-on-surface-muted text-center mt-3">
        {toPersianDigits(users.length)} کاربر
        {" · "}
        {toPersianDigits(onlineCount)} آنلاین
      </p>
    </div>
  );
}
