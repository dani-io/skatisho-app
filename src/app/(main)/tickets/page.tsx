"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Plus,
  ArrowLeft,
  Send,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toPersianDigits } from "@/lib/utils";

interface Ticket {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  messages: { content: string; isAdmin: boolean; createdAt: string }[];
  _count: { messages: number };
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  OPEN: { label: "باز", color: "bg-blue-100 text-blue-700", icon: Clock },
  ANSWERED: { label: "پاسخ داده شده", color: "bg-green-100 text-green-700", icon: CheckCircle },
  CLOSED: { label: "بسته شده", color: "bg-gray-100 text-gray-600", icon: XCircle },
};

export default function TicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  function loadTickets() {
    fetch("/api/tickets")
      .then((r) => r.json())
      .then((data) => setTickets(data.tickets || []))
      .finally(() => setLoading(false));
  }

  async function handleSubmit() {
    if (!subject.trim() || !message.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });
      if (res.ok) {
        const data = await res.json();
        setShowForm(false);
        setSubject("");
        setMessage("");
        router.push(`/tickets/${data.ticket.id}`);
      }
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold">پشتیبانی</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 text-sm text-primary font-medium"
          >
            <Plus className="w-4 h-4" />
            تیکت جدید
          </button>
        )}
      </div>

      {/* New Ticket Form */}
      {showForm && (
        <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-4 mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-sm">تیکت جدید</h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-xs text-on-surface-muted"
            >
              انصراف
            </button>
          </div>
          <input
            type="text"
            placeholder="موضوع تیکت"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full border border-surface-container rounded-xl px-4 py-3 text-sm mb-3 focus:outline-none focus:border-primary"
          />
          <textarea
            placeholder="پیام خود را بنویسید..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full border border-surface-container rounded-xl px-4 py-3 text-sm mb-3 resize-none focus:outline-none focus:border-primary"
          />
          <Button
            size="full"
            disabled={!subject.trim() || !message.trim() || sending}
            onClick={handleSubmit}
          >
            {sending ? "در حال ارسال..." : (
              <>
                <Send className="w-4 h-4 ml-2" />
                ارسال تیکت
              </>
            )}
          </Button>
        </div>
      )}

      {/* Tickets List */}
      {tickets.length > 0 ? (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const statusInfo = STATUS_MAP[ticket.status] || STATUS_MAP.OPEN;
            const lastMsg = ticket.messages[0];
            return (
              <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
                <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-4 active:scale-[0.98] transition-transform">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-bold flex-1">{ticket.subject}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium mr-2 whitespace-nowrap ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  {lastMsg && (
                    <p className="text-xs text-on-surface-muted line-clamp-1 mb-2">
                      {lastMsg.isAdmin ? "پشتیبانی: " : "شما: "}
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
      ) : !showForm ? (
        <div className="flex flex-col items-center justify-center py-16 text-on-surface-muted">
          <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-sm mb-1">تیکتی ندارید</p>
          <p className="text-xs mb-6">سوال یا مشکلی دارید؟ تیکت بزنید</p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 ml-2" />
            ارسال تیکت جدید
          </Button>
        </div>
      ) : null}
    </div>
  );
}
