"use client";

import { useEffect, useState } from "react";
import {
  Package, Clock, CreditCard, Truck, CheckCircle, XCircle,
  ChevronDown, Send, ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice, toPersianDigits } from "@/lib/utils";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: { title: string; thumbnail: string | null };
}

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  trackingCode: string | null;
  address: string | null;
  phone: string | null;
  createdAt: string;
  user: { name: string | null; phone: string };
  items: OrderItem[];
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  PENDING: { label: "در انتظار", icon: Clock, color: "bg-amber-100 text-amber-700" },
  PAID: { label: "پرداخت شده", icon: CreditCard, color: "bg-blue-100 text-blue-700" },
  SHIPPED: { label: "ارسال شده", icon: Truck, color: "bg-purple-100 text-purple-700" },
  DELIVERED: { label: "تحویل شده", icon: CheckCircle, color: "bg-green-100 text-green-700" },
  CANCELLED: { label: "لغو شده", icon: XCircle, color: "bg-red-100 text-red-700" },
};

const STATUS_FLOW = ["PENDING", "PAID", "SHIPPED", "DELIVERED"];
const FILTERS = [
  { id: "ALL", label: "همه" },
  { id: "PAID", label: "پرداخت شده" },
  { id: "SHIPPED", label: "ارسال شده" },
  { id: "DELIVERED", label: "تحویل شده" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => { loadOrders(); }, []);

  function loadOrders() {
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((data) => setOrders(data.orders || []))
      .finally(() => setLoading(false));
  }

  async function updateOrder(orderId: string, status: string, trackingCode?: string) {
    setUpdating(orderId);
    try {
      await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, trackingCode }),
      });
      loadOrders();
    } finally { setUpdating(null); }
  }

  const filtered = filter === "ALL" ? orders : orders.filter((o) => o.status === filter);
  const counts: Record<string, number> = { ALL: orders.length };
  orders.forEach((o) => { counts[o.status] = (counts[o.status] || 0) + 1; });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">مدیریت سفارشات</h1>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f.id ? "bg-primary text-black" : "bg-white border border-surface-container text-on-surface-muted"
            }`}>
            {f.label} ({toPersianDigits(counts[f.id] || 0)})
          </button>
        ))}
      </div>

      {/* Orders */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((order) => {
            const statusInfo = STATUS_MAP[order.status] || STATUS_MAP.PENDING;
            const StatusIcon = statusInfo.icon;
            const isExpanded = expandedId === order.id;
            const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1];
            const trackingInput = trackingInputs[order.id] || order.trackingCode || "";

            return (
              <div key={order.id} className="bg-white rounded-[var(--radius-card)] border border-surface-container overflow-hidden">
                {/* Header - clickable */}
                <button onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  className="w-full flex items-center justify-between p-4 text-right">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${statusInfo.color}`}>
                      <StatusIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{order.user.name || "بدون نام"}</p>
                      <p className="text-[11px] text-on-surface-muted" dir="ltr">{order.user.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-left">
                      <p className="text-sm font-bold">{formatPrice(order.totalAmount)}</p>
                      <p className="text-[10px] text-on-surface-muted">
                        {new Date(order.createdAt).toLocaleDateString("fa-IR")}
                      </p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-on-surface-muted transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t border-surface-container">
                    {/* Items */}
                    <div className="p-4 space-y-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-surface-dim flex items-center justify-center shrink-0 overflow-hidden">
                            {item.product.thumbnail ? (
                              <img src={item.product.thumbnail} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <ShoppingBag className="w-4 h-4 text-on-surface-muted/20" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium">{item.product.title}</p>
                          </div>
                          <span className="text-xs text-on-surface-muted">×{toPersianDigits(item.quantity)}</span>
                          <span className="text-xs font-bold">{formatPrice(item.price)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Address */}
                    {order.address && (
                      <div className="px-4 pb-3 text-[11px] text-on-surface-muted">
                        📍 {order.address}
                      </div>
                    )}

                    {/* Tracking Code */}
                    <div className="px-4 pb-3">
                      <label className="text-[11px] text-on-surface-muted mb-1 block">کد رهگیری مرسوله</label>
                      <div className="flex gap-2">
                        <input type="text" value={trackingInput}
                          onChange={(e) => setTrackingInputs((p) => ({ ...p, [order.id]: e.target.value }))}
                          placeholder="کد رهگیری پستی" dir="ltr"
                          className="flex-1 border border-surface-container rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                        {trackingInput !== (order.trackingCode || "") && (
                          <Button variant="secondary"
                            onClick={() => updateOrder(order.id, order.status, trackingInput)}
                            disabled={updating === order.id}>
                            ذخیره
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Status Actions */}
                    <div className="flex gap-2 px-4 pb-4">
                      {nextStatus && (
                        <Button size="full"
                          onClick={() => updateOrder(order.id, nextStatus, nextStatus === "SHIPPED" ? trackingInput : undefined)}
                          disabled={updating === order.id}>
                          {updating === order.id ? "..." : (
                            <>
                              <Send className="w-4 h-4 ml-2" />
                              تغییر به «{STATUS_MAP[nextStatus]?.label}»
                            </>
                          )}
                        </Button>
                      )}
                      {order.status !== "CANCELLED" && order.status !== "DELIVERED" && (
                        <Button variant="secondary"
                          onClick={() => updateOrder(order.id, "CANCELLED")}
                          disabled={updating === order.id}>
                          لغو
                        </Button>
                      )}
                    </div>

                    {/* Status Timeline */}
                    <div className="px-4 pb-4">
                      <div className="flex items-center justify-between">
                        {STATUS_FLOW.map((s, i) => {
                          const done = STATUS_FLOW.indexOf(order.status) >= i;
                          const info = STATUS_MAP[s];
                          return (
                            <div key={s} className="flex flex-col items-center gap-1">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                                done ? "bg-primary text-black" : "bg-surface-dim text-on-surface-muted"
                              }`}>
                                {done ? <CheckCircle className="w-3 h-3" /> : toPersianDigits(i + 1)}
                              </div>
                              <span className="text-[9px] text-on-surface-muted">{info.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-on-surface-muted">
          <Package className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-sm">سفارشی وجود ندارد</p>
        </div>
      )}
    </div>
  );
}
