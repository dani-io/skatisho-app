"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Send,
  User,
  Headphones,
  Lock,
  Unlock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  content: string;
  isAdmin: boolean;
  createdAt: string;
}

interface Ticket {
  id: string;
  subject: string;
  status: string;
  user: { name: string | null; phone: string; avatar: string | null };
  messages: Message[];
  lesson?: { id: string; title: string; chapter: { title: string; course: { id: string; title: string } } } | null;
  lesson?: { id: string; title: string; chapter: { title: string; course: { id: string; title: string } } } | null;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  OPEN: { label: "باز", color: "bg-blue-100 text-blue-700" },
  ANSWERED: { label: "پاسخ داده شده", color: "bg-green-100 text-green-700" },
  CLOSED: { label: "بسته شده", color: "bg-gray-100 text-gray-600" },
};

export default function AdminTicketDetailPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = use(params);
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTicket();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages]);

  function loadTicket() {
    fetch(`/api/admin/tickets/${ticketId}`)
      .then((r) => r.json())
      .then((data) => setTicket(data.ticket))
      .finally(() => setLoading(false));
  }

  async function handleSend() {
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (res.ok) {
        setMessage("");
        loadTicket();
      }
    } finally {
      setSending(false);
    }
  }

  async function toggleStatus() {
    if (!ticket) return;
    const newStatus = ticket.status === "CLOSED" ? "OPEN" : "CLOSED";
    await fetch(`/api/admin/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    loadTicket();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!ticket) {
    return <p className="text-center text-on-surface-muted py-16">تیکت یافت نشد</p>;
  }

  const statusInfo = STATUS_MAP[ticket.status] || STATUS_MAP.OPEN;
  const isClosed = ticket.status === "CLOSED";

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-container bg-white">
        <button onClick={() => router.push("/admin/tickets")}>
          <ArrowRight className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold truncate">{ticket.subject}</h1>
          <p className="text-[11px] text-on-surface-muted">
            {ticket.user.name || "بدون نام"} — <span dir="ltr">{ticket.user.phone}</span>
            <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium mr-2 ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </p>
        </div>
        <button
          onClick={toggleStatus}
          className={`flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-lg font-medium ${
            isClosed
              ? "bg-blue-50 text-blue-600"
              : "bg-red-50 text-red-600"
          }`}
        >
          {isClosed ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
          {isClosed ? "بازکردن" : "بستن"}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-surface">
        {ticket.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.isAdmin ? "justify-end" : "justify-start"}`}
          >
            <div className="max-w-[80%]">
              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.isAdmin
                    ? "bg-primary text-black rounded-tl-md"
                    : "bg-white border border-surface-container rounded-tr-md"
                }`}
              >
                {msg.content}
              </div>
              <div className={`flex items-center gap-1 mt-1 ${msg.isAdmin ? "justify-end" : ""}`}>
                {!msg.isAdmin && <User className="w-3 h-3 text-on-surface-muted" />}
                <span className="text-[10px] text-on-surface-muted">
                  {new Date(msg.createdAt).toLocaleString("fa-IR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                {msg.isAdmin && <Headphones className="w-3 h-3 text-on-surface-muted" />}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply Input */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-surface-container bg-white">
        <textarea
          placeholder="پاسخ ادمین..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          rows={1}
          className="flex-1 border border-surface-container rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:border-primary"
        />
        <button
          onClick={handleSend}
          disabled={!message.trim() || sending}
          className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center disabled:opacity-40"
        >
          <Send className="w-4 h-4 text-black" />
        </button>
      </div>
    </div>
  );
}
