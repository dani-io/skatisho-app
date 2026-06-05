"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
} from "lucide-react";
import { toPersianDigits } from "@/lib/utils";

interface Ticket {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: { name: string | null; phone: string };
  messages: { content: string; isAdmin: boolean }[];
  _count: { messages: number };
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  OPEN: { label: "باز", color: "bg-blue-100 text-blue-700", icon: Clock },
  ANSWERED: { label: "پاسخ داده شده", color: "bg-green-100 text-green-700", icon: CheckCircle },
  CLOSED: { label: "بسته شده", color: "bg-gray-100 text-gray-600", icon: XCircle },
};

const FILTERS = [
  { id: "ALL", label: "همه" },
  { id: "OPEN", label: "باز" },
  { id: "ANSWERED", label: "پاسخ داده" },
  { id: "CLOSED", label: "بسته" },
];

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    fetch("/api/admin/tickets")
      .then((r) => r.json())
      .then((data) => setTickets(data.tickets || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "ALL" ? tickets : tickets.filter((t) => t.status === filter);

  const counts: Record<string, number> = { ALL: tickets.length };
  for (const t of tickets) {
    counts[t.status] = (counts[t.status] || 0) + 1;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">تیکت‌های پشتیبانی</h1>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f.id
                ? "bg-primary text-black"
                : "bg-white border border-surface-container text-on-surface-muted"
            }`}
          >
            {f.label} ({toPersianDigits(counts[f.id] || 0)})
          </button>
        ))}
      </div>

      {/* Tickets */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((ticket) => {
            const statusInfo = STATUS_MAP[ticket.status] || STATUS_MAP.OPEN;
            const lastMsg = ticket.messages[0];
            return (
              <Link key={ticket.id} href={`/admin/tickets/${ticket.id}`}>
                <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-4 hover:border-primary/30 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold truncate">{ticket.subject}</h3>
                      <p className="text-[11px] text-on-surface-muted mt-0.5">
                        {ticket.user.name || "بدون نام"} — <span dir="ltr">{ticket.user.phone}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mr-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      <ChevronLeft className="w-4 h-4 text-on-surface-muted" />
                    </div>
                  </div>
                  {lastMsg && (
                    <p className="text-xs text-on-surface-muted line-clamp-1 mb-2">
                      {lastMsg.isAdmin ? "شما: " : "کاربر: "}
                      {lastMsg.content}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-on-surface-muted">
                      {toPersianDigits(ticket._count.messages)} پیام
                    </span>
                    <span className="text-[11px] text-on-surface-muted">
                      {new Date(ticket.updatedAt).toLocaleDateString("fa-IR")}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-on-surface-muted">
          <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-sm">تیکتی وجود ندارد</p>
        </div>
      )}
    </div>
  );
}
