"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ShieldCheck, X, Phone, Crown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ADMIN_SECTIONS } from "@/lib/permissions";

interface AdminUser {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role?: "ADMIN" | "SUPER_ADMIN";
  permissions?: string[];
  createdAt?: string;
  lastLoginAt?: string | null;
}

export default function AdminAdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [legacy, setLegacy] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [newPerms, setNewPerms] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Pending checkbox state per admin id, populated the moment a box is ticked.
  // Absent means "no unsaved edits for this row".
  const [draft, setDraft] = useState<Record<string, string[]>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    setLoading(true);
    fetch("/api/admin/admins")
      .then((r) => r.json())
      .then((d) => {
        setAdmins(d.admins || []);
        setLegacy(d.legacyPhoneAdmins || []);
        // Server state is now authoritative again; drop any stale drafts.
        setDraft({});
      })
      .finally(() => setLoading(false));
  }

  /** What the checkboxes should show: the unsaved draft if there is one. */
  function permsOf(a: AdminUser): string[] {
    return draft[a.id] ?? a.permissions ?? [];
  }

  function togglePerm(a: AdminUser, key: string) {
    const current = permsOf(a);
    const next = current.includes(key)
      ? current.filter((k) => k !== key)
      : [...current, key];
    setDraft((d) => ({ ...d, [a.id]: next }));
    setSavedId(null);
  }

  function isDirty(a: AdminUser): boolean {
    const d = draft[a.id];
    if (!d) return false;
    const saved = a.permissions ?? [];
    return d.length !== saved.length || d.some((k) => !saved.includes(k));
  }

  async function savePerms(a: AdminUser) {
    setSavingId(a.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/admins/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: permsOf(a) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "خطا در ذخیره دسترسی‌ها");
        return;
      }
      // Fold the saved result back into the list and clear this row's draft.
      setAdmins((list) =>
        list.map((x) =>
          x.id === a.id ? { ...x, permissions: data.admin.permissions } : x
        )
      );
      setDraft((d) => {
        const { [a.id]: _removed, ...rest } = d;
        return rest;
      });
      setSavedId(a.id);
    } catch {
      setError("خطا در ذخیره دسترسی‌ها");
    } finally {
      setSavingId(null);
    }
  }

  function toggleNewPerm(key: string) {
    setNewPerms((p) =>
      p.includes(key) ? p.filter((k) => k !== key) : [...p, key]
    );
  }

  async function addAdmin() {
    if (!email.trim()) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, permissions: newPerms }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setError(data.error || "خطا در افزودن ادمین");
      return;
    }
    setEmail("");
    setName("");
    setNewPerms([]);
    setShowForm(false);
    loadData();
  }

  async function removeAdmin(admin: AdminUser) {
    const label = admin.email || admin.name || "این کاربر";
    if (!confirm(`دسترسی ادمین ${label} حذف شود؟`)) return;

    const res = await fetch("/api/admin/admins", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: admin.id }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "خطا در حذف ادمین");
      return;
    }
    setError(null);
    loadData();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg">مدیران</h2>
          <p className="text-xs text-on-surface-muted mt-1">
            هر ایمیلی که اینجا اضافه شود می‌تواند با Google وارد پنل شود.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          افزودن ادمین
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700"
        >
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm">افزودن ادمین جدید</h3>
            <button onClick={() => setShowForm(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">
              ایمیل Google
            </label>
            <input
              dir="ltr"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full rounded-xl border border-surface-container px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">
              نام (اختیاری)
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-surface-container px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">
              دسترسی اولیه (اختیاری)
            </label>
            <p className="text-[11px] text-on-surface-muted mb-2 leading-relaxed">
              اگر چیزی انتخاب نکنید، این ادمین تا زمان تعیین دسترسی هیچ بخشی را
              نمی‌بیند.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {ADMIN_SECTIONS.map((s) => {
                const on = newPerms.includes(s.key);
                return (
                  <label
                    key={s.key}
                    className={`flex items-center gap-2 rounded-xl border-2 px-2.5 py-2 text-xs cursor-pointer transition-colors ${
                      on
                        ? "border-primary bg-primary/5 font-medium"
                        : "border-surface-container text-on-surface-muted"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggleNewPerm(s.key)}
                      className="w-4 h-4 shrink-0 accent-primary"
                    />
                    <span className="truncate">{s.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <Button onClick={addAdmin} disabled={saving} className="w-full">
            {saving ? "در حال ذخیره..." : "افزودن"}
          </Button>
        </div>
      )}

      <div className="bg-white rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-surface-container flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-sm">ادمین‌ها ({admins.length})</h3>
        </div>

        {admins.length === 0 ? (
          <p className="px-5 py-8 text-center text-xs text-on-surface-muted">
            هنوز ادمینی با نقش ADMIN ثبت نشده است.
          </p>
        ) : (
          <ul className="divide-y divide-surface-container">
            {admins.map((a) => {
              const isSuper = a.role === "SUPER_ADMIN";
              const perms = permsOf(a);
              return (
                <li key={a.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate flex items-center gap-2">
                        {a.name || "بدون نام"}
                        {isSuper && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                            <Crown className="w-3 h-3" />
                            سوپر ادمین
                          </span>
                        )}
                      </p>
                      <p
                        dir="ltr"
                        className="text-xs text-on-surface-muted truncate text-right"
                      >
                        {a.email || "—"}
                      </p>
                      {a.phone && (
                        <p
                          dir="ltr"
                          className="text-[11px] text-on-surface-muted flex items-center gap-1 justify-end mt-0.5"
                        >
                          <Phone className="w-3 h-3" />
                          {a.phone}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeAdmin(a)}
                      className="text-red-600 hover:bg-red-50 rounded-lg p-2 shrink-0"
                      aria-label="حذف دسترسی ادمین"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {isSuper ? (
                    <p className="mt-3 rounded-xl bg-surface-dim px-3 py-2 text-[11px] text-on-surface-muted leading-relaxed">
                      سوپر ادمین به همهٔ بخش‌ها دسترسی دارد و تنظیم دسترسی برای
                      او معنایی ندارد.
                    </p>
                  ) : (
                    <div className="mt-3">
                      <p className="text-[11px] font-medium text-on-surface-muted mb-2">
                        دسترسی به بخش‌ها
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {ADMIN_SECTIONS.map((s) => {
                          const on = perms.includes(s.key);
                          return (
                            <label
                              key={s.key}
                              className={`flex items-center gap-2 rounded-xl border-2 px-2.5 py-2 text-xs cursor-pointer transition-colors ${
                                on
                                  ? "border-primary bg-primary/5 font-medium"
                                  : "border-surface-container text-on-surface-muted"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={on}
                                onChange={() => togglePerm(a, s.key)}
                                className="w-4 h-4 shrink-0 accent-primary"
                              />
                              <span className="truncate">{s.label}</span>
                            </label>
                          );
                        })}
                      </div>

                      <div className="mt-3 flex items-center gap-3">
                        <Button
                          onClick={() => savePerms(a)}
                          disabled={!isDirty(a) || savingId === a.id}
                          className="text-xs px-4 py-2"
                        >
                          {savingId === a.id ? "در حال ذخیره..." : "ذخیره دسترسی‌ها"}
                        </Button>
                        {savedId === a.id && !isDirty(a) && (
                          <span className="flex items-center gap-1 text-[11px] text-green-600">
                            <Check className="w-3.5 h-3.5" />
                            ذخیره شد
                          </span>
                        )}
                        {perms.length === 0 && !isDirty(a) && (
                          <span className="text-[11px] text-on-surface-muted">
                            هیچ دسترسی‌ای ندارد
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {legacy.length > 0 && (
        <div className="bg-white rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-surface-container">
            <h3 className="font-bold text-sm">دسترسی موقت با شماره تلفن</h3>
            <p className="text-[11px] text-on-surface-muted mt-1 leading-relaxed">
              این کاربران هنوز نقش ADMIN ندارند و دسترسی‌شان از فهرست قدیمی
              شماره‌ها می‌آید. برای مدیریت از اینجا، ایمیلشان را به بالا اضافه
              کنید.
            </p>
          </div>
          <ul className="divide-y divide-surface-container">
            {legacy.map((u) => (
              <li key={u.id} className="px-5 py-3 flex items-center gap-3">
                <span className="text-sm">{u.name || "بدون نام"}</span>
                <span dir="ltr" className="text-xs text-on-surface-muted">
                  {u.phone}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
