"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Gift, Loader2, Wallet } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatPrice, toPersianDigits } from "@/lib/utils";

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [giftCode, setGiftCode] = useState("");
  const [giftLoading, setGiftLoading] = useState(false);
  const [giftMsg, setGiftMsg] = useState<{ok: boolean; text: string} | null>(null);

  useEffect(() => {
    fetch("/api/wallet")
      .then((r) => r.json())
      .then((d) => { setBalance(d.balance || 0); setTransactions(d.transactions || []); })
      .finally(() => setLoading(false));
  }, []);

  async function redeemGift() {
    if (!giftCode.trim()) return;
    setGiftLoading(true); setGiftMsg(null);
    try {
      const res = await fetch("/api/gift-cards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: giftCode }),
      });
      const data = await res.json();
      if (data.success) {
        setGiftMsg({ ok: true, text: `${data.amount.toLocaleString()} تومان اضافه شد` });
        setGiftCode("");
        setBalance(data.newBalance);
        // Reload transactions
        fetch("/api/wallet").then((r) => r.json()).then((d) => setTransactions(d.transactions || []));
      } else {
        setGiftMsg({ ok: false, text: data.error });
      }
    } catch { setGiftMsg({ ok: false, text: "خطا" }); }
    finally { setGiftLoading(false); }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/profile"><ArrowRight className="w-5 h-5" /></Link>
        <h1 className="text-lg font-bold">کیف پول</h1>
      </div>

      {/* Balance */}
      <div className="bg-gradient-to-l from-primary to-primary-dark rounded-[var(--radius-card)] p-6 mb-6 text-center">
        <p className="text-sm text-on-surface/70">موجودی</p>
        <p className="text-3xl font-bold mt-1">{formatPrice(balance)}</p>
      </div>

      {/* Gift Card */}
      <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-4 mb-6">
        <p className="text-sm font-bold mb-2">شارژ با کارت هدیه</p>
        <div className="flex gap-2">
          <input type="text" placeholder="کد کارت هدیه" value={giftCode}
            onChange={(e) => { setGiftCode(e.target.value.toUpperCase()); setGiftMsg(null); }}
            dir="ltr"
            className="flex-1 border border-surface-container rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          <Button variant="secondary" onClick={redeemGift} disabled={giftLoading || !giftCode.trim()}>
            {giftLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Gift className="w-4 h-4 ml-1" />شارژ</>}
          </Button>
        </div>
        {giftMsg && <p className={`text-xs mt-2 ${giftMsg.ok ? "text-green-600" : "text-error"}`}>{giftMsg.text}</p>}
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-4">
        <h2 className="text-sm font-bold mb-3">تراکنش‌ها</h2>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-on-surface-muted">
            <Wallet className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p className="text-xs">تراکنشی وجود ندارد</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-surface-container last:border-0">
                <div>
                  <p className="text-sm">{tx.description}</p>
                  <p className="text-[10px] text-on-surface-muted">{new Date(tx.createdAt).toLocaleDateString("fa-IR")}</p>
                </div>
                <span className={`font-bold ${tx.amount > 0 ? "text-green-600" : "text-red-500"}`}>
                  {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
