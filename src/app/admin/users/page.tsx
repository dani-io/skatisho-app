"use client";

import { useEffect, useState } from "react";
import { Plus, X, UserPlus, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toPersianDigits } from "@/lib/utils";

interface User {
  id: string;
  name: string | null;
  phone: string;
  skillLevel: string | null;
  createdAt: string;
  subscription: { isActive: boolean; plan: { title: string } } | null;
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

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    Promise.all([
      fetch("/api/admin/users").then((r) => r.json()),
      fetch("/api/admin/subscriptions").then((r) => r.json()),
    ]).then(([userData, subData]) => {
      setUsers(userData.users || []);
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
  }

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

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

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
              <th className="text-right p-3 font-medium">تاریخ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-surface-dim/50">
                <td className="p-3">{u.name || "—"}</td>
                <td className="p-3" dir="ltr">{u.phone}</td>
                <td className="p-3">{u.skillLevel || "—"}</td>
                <td className="p-3">
                  {u.subscription?.isActive ? (
                    <span className="bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full">{u.subscription.plan.title}</span>
                  ) : (
                    <span className="text-on-surface-muted text-xs">ندارد</span>
                  )}
                </td>
                <td className="p-3 text-xs text-on-surface-muted">{new Date(u.createdAt).toLocaleDateString("fa-IR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-on-surface-muted text-center mt-3">{toPersianDigits(users.length)} کاربر</p>
    </div>
  );
}
