"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Send, Headphones, User } from "lucide-react";

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
  messages: Message[];
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  OPEN: { label: "باز", color: "bg-blue-100 text-blue-700" },
  ANSWERED: { label: "پاسخ داده شده", color: "bg-green-100 text-green-700" },
  CLOSED: { label: "بسته شده", color: "bg-gray-100 text-gray-600" },
};

export default function TicketDetailPage({ params }: { params: Promise<{ ticketId: string }> }) {
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
    fetch(`/api/tickets/${ticketId}`)
      .then((r) => r.json())
      .then((data) => setTicket(data.ticket))
      .finally(() => setLoading(false));
  }

  async function handleSend() {
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/messages`, {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-sm text-on-surface-muted">تیکت یافت نشد</p>
      </div>
    );
  }

  const statusInfo = STATUS_MAP[ticket.status] || STATUS_MAP.OPEN;
  const isClosed = ticket.status === "CLOSED";

  return (
    <div className="flex flex-col h-[calc(100dvh-80px)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-container bg-white">
        <button onClick={() => router.push("/tickets")}>
          <ArrowRight className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold truncate">{ticket.subject}</h1>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {ticket.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.isAdmin ? "justify-start" : "justify-end"}`}
          >
            <div className={`max-w-[80%] ${msg.isAdmin ? "order-2" : ""}`}>
              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.isAdmin
                    ? "bg-white border border-surface-container rounded-tr-md"
                    : "bg-primary text-black rounded-tl-md"
                }`}
              >
                {msg.content}
              </div>
              <div className={`flex items-center gap-1 mt-1 ${msg.isAdmin ? "" : "justify-end"}`}>
                {msg.isAdmin && <Headphones className="w-3 h-3 text-on-surface-muted" />}
                <span className="text-[10px] text-on-surface-muted">
                  {new Date(msg.createdAt).toLocaleString("fa-IR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                {!msg.isAdmin && <User className="w-3 h-3 text-on-surface-muted" />}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {isClosed ? (
        <div className="px-4 py-3 text-center text-sm text-on-surface-muted border-t border-surface-container bg-gray-50">
          این تیکت بسته شده است
        </div>
      ) : (
        <div className="flex items-center gap-2 px-4 py-3 border-t border-surface-container bg-white">
          <input
            type="text"
            placeholder="پیام خود را بنویسید..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 border border-surface-container rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() || sending}
            className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center disabled:opacity-40"
          >
            <Send className="w-4 h-4 text-black" />
          </button>
        </div>
      )}
    </div>
  );
}
