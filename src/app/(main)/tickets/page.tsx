"use client";

import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function TicketsPage() {
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        const sub = data.user?.subscription;
        setHasSubscription(
          sub?.isActive && new Date(sub.endDate) > new Date()
        );
      });
  }, []);

  return (
    <div className="px-4 pt-6">
      <h1 className="text-lg font-bold mb-6">پشتیبانی</h1>

      {hasSubscription ? (
        <div>
          {/* TODO: Show tickets list */}
          <div className="flex flex-col items-center justify-center py-12 text-on-surface-muted">
            <MessageSquare className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm mb-4">تیکتی ندارید</p>
            <Button>ارسال تیکت جدید</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <MessageSquare className="w-12 h-12 mb-4 text-on-surface-muted/30" />
          <p className="text-sm text-on-surface-muted mb-2">
            برای استفاده از پشتیبانی، اشتراک فعال داشته باشید
          </p>
          <p className="text-xs text-on-surface-muted mb-6">
            از طریق اینستاگرام هم می‌توانید با ما در ارتباط باشید
          </p>
          <Link href="/subscription">
            <Button>خرید اشتراک</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
