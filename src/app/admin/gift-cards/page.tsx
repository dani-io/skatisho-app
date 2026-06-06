"use client";

import { useEffect, useState } from "react";
import { Gift, Plus, Trash2, X, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice, toPersianDigits } from "@/lib/utils";

interface GiftCard {
  id: string;
  code: string;
  amount: number;
  scope: string;
  isUsed: boolean;
  usedBy: string | null;
  usedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

const SCOPE_LABELS: Record<string, string> = { ALL: "همه", SUBSCRIPTION: "اشتراک", SHOP: "فروشگاه" };

export default function AdminGiftCardsPage() {
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unused" | "used">("all");

  const [amount, setAmount] = useState("");
  const [scope, setScope] = useState("ALL");
  const [count, setCount] = useState("1");
  const [expiresAt, setExpiresAt] = useState("");

  useEffect(() => { loadCards(); }, []);

  function loadCards() {
    fetch("/api/admin/gift-cards")
      .then((r) => r.json())
      .then((d) => setCards(d.cards || []))
      .finally(() => setLoading(false));
  }

  async function handleCreate() {
    setSaving(true);
    try {
      await fetch("/api/admin/gift-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, scope, count, expiresAt }),
      });
      setShowForm(false);
      setAmount(""); setCount("1"); setExpiresAt("");
      loadCards();
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("حذف این کارت هدیه؟")) return;
    await fetch("/api/admin/gift-cards", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadCards();
  }

  function copyCode(code: string, id: string) {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const filtered = filter === "all" ? cards : filter === "used" ? cards.filter((c) => c.isUsed) : cards.filter((c) => !c.isUsed);
  const totalValue = cards.filter((c) => !c.isUsed).reduce((a, c) => a + c.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">کارت‌های هدیه</h1>
          <p className="text-xs text-on-surface-muted mt-1">
            {toPersianDigits(cards.filter((c) => !c.isUsed).length)} فعال — مجموع {formatPrice(totalValue)}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 ml-2" /> ساخت کارت
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-sm">ساخت کارت هدیه</h2>
            <button onClick={() => setShowForm(false)}><X className="w-5 h-5" /></button>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-on-surface-muted mb-1 block">مبلغ (تومان)</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                  placeholder="۵۰۰۰۰۰"
                  className="w-full border border-surface-container rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[11px] text-on-surface-muted mb-1 block">تعداد</label>
                <input type="number" value={count} onChange={(e) => setCount(e.target.value)}
                  min="1" max="50"
                  className="w-full border border-surface-container rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-on-surface-muted mb-1 block">قابل استفاده در</label>
              <div className="flex gap-2">
                {[{ id: "ALL", label: "همه" }, { id: "SUBSCRIPTION", label: "اشتراک" }, { id: "SHOP", label: "فروشگاه" }].map((s) => (
                  <button key={s.id} onClick={() => setScope(s.id)}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium border-2 ${scope === s.id ? "border-primary bg-primary/5" : "border-surface-container"}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[11px] text-on-surface-muted mb-1 block">تاریخ انقضا (اختیاری)</label>
              <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full border border-surface-container rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            </div>
            <Button size="full" onClick={handleCreate} disabled={!amount || saving}>
              {saving ? "ساخت..." : `ساخت ${count || "۱"} کارت هدیه`}
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {[
          { id: "all" as const, label: `همه (${toPersianDigits(cards.length)})` },
          { id: "unused" as const, label: `فعال (${toPersianDigits(cards.filter((c) => !c.isUsed).length)})` },
          { id: "used" as const, label: `استفاده شده (${toPersianDigits(cards.filter((c) => c.isUsed).length)})` },
        ].map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-full text-xs font-medium ${
              filter === f.id ? "bg-primary text-black" : "bg-white border border-surface-container text-on-surface-muted"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Cards List */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((card) => (
            <div key={card.id}
              className={`bg-white rounded-[var(--radius-card)] border p-4 ${card.isUsed ? "border-red-200 bg-red-50/30" : "border-surface-container"}`}>
              <div className="flex items-center justify-between mb-2">
                <button onClick={() => copyCode(card.code, card.id)}
                  className="flex items-center gap-1.5 text-sm font-bold" dir="ltr">
                  <Gift className={`w-4 h-4 ${card.isUsed ? "text-gray-400" : "text-primary"}`} />
                  {card.code}
                  {copiedId === card.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-on-surface-muted" />}
                </button>
                {!card.isUsed && (
                  <button onClick={() => handleDelete(card.id)} className="text-on-surface-muted hover:text-error">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">{formatPrice(card.amount)}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-surface-dim text-on-surface-muted px-2 py-0.5 rounded-full">
                    {SCOPE_LABELS[card.scope]}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    card.isUsed ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                  }`}>
                    {card.isUsed ? "مصرف شده" : "فعال"}
                  </span>
                </div>
              </div>
              {card.isUsed && card.usedAt && (
                <p className="text-[10px] text-on-surface-muted mt-2">
                  مصرف: {new Date(card.usedAt).toLocaleDateString("fa-IR")}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-on-surface-muted">
          <Gift className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-sm">کارت هدیه‌ای وجود ندارد</p>
        </div>
      )}
    </div>
  );
}
