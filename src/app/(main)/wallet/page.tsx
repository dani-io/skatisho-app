"use client";

import { useEffect, useState } from "react";
import { Wallet, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

export default function WalletPage() {
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setBalance(data.user?.walletBalance || 0));
  }, []);

  return (
    <div className="px-4 pt-6">
      <h1 className="text-lg font-bold mb-6">کیف پول من</h1>

      {/* Balance Card */}
      <div className="bg-gradient-to-l from-primary to-primary-dark rounded-[var(--radius-card)] p-6 mb-4">
        <p className="text-sm text-on-surface/70">موجودی</p>
        <p className="text-2xl font-bold text-on-surface mt-1">
          {formatPrice(balance)}
        </p>
      </div>

      <Button size="full" className="mb-8">
        <Plus className="w-4 h-4 ml-2" />
        شارژ کیف پول
      </Button>

      {/* Transactions */}
      <h2 className="text-base font-bold mb-4">تراکنش‌ها</h2>
      <div className="flex flex-col items-center justify-center py-12 text-on-surface-muted">
        <Wallet className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm">تراکنشی ندارید</p>
      </div>
    </div>
  );
}
