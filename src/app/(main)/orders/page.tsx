"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Package,
  Clock,
  CreditCard,
  Truck,
  CheckCircle,
  XCircle,
  ShoppingBag,
} from "lucide-react";
import { formatPrice, toPersianDigits } from "@/lib/utils";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: { title: string; thumbnail: string | null; brand: string | null };
}

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  address: string | null;
  createdAt: string;
  items: OrderItem[];
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  PENDING: { label: "در انتظار پرداخت", color: "bg-amber-100 text-amber-700", icon: Clock },
  PAID: { label: "پرداخت شده", color: "bg-blue-100 text-blue-700", icon: CreditCard },
  SHIPPED: { label: "ارسال شده", color: "bg-purple-100 text-purple-700", icon: Truck },
  DELIVERED: { label: "تحویل شده", color: "bg-green-100 text-green-700", icon: CheckCircle },
  CANCELLED: { label: "لغو شده", color: "bg-red-100 text-red-700", icon: XCircle },
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => setOrders(data.orders || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()}>
          <ArrowRight className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">سفارشات من</h1>
      </div>

      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusInfo = STATUS_MAP[order.status] || STATUS_MAP.PENDING;
            const StatusIcon = statusInfo.icon;
            return (
              <div key={order.id} className="bg-white rounded-[var(--radius-card)] border border-surface-container overflow-hidden">
                {/* Order Header */}
                <div className="flex items-center justify-between p-4 border-b border-surface-container">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-on-surface-muted" />
                    <span className="text-[11px] text-on-surface-muted" dir="ltr">
                      {order.id.slice(-8).toUpperCase()}
                    </span>
                  </div>
                  <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusInfo.label}
                  </span>
                </div>

                {/* Items */}
                <div className="p-4 space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-surface-dim flex items-center justify-center shrink-0 overflow-hidden">
                        {item.product.thumbnail ? (
                          <img src={item.product.thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingBag className="w-5 h-5 text-on-surface-muted/20" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{item.product.title}</p>
                        {item.product.brand && (
                          <p className="text-[10px] text-on-surface-muted">{item.product.brand}</p>
                        )}
                      </div>
                      <div className="text-left shrink-0">
                        <p className="text-xs font-bold">{formatPrice(item.price)}</p>
                        <p className="text-[10px] text-on-surface-muted">×{toPersianDigits(item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-3 bg-surface-dim">
                  <span className="text-[11px] text-on-surface-muted">
                    {new Date(order.createdAt).toLocaleDateString("fa-IR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  <span className="text-sm font-bold">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-on-surface-muted">
          <Package className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-sm">سفارشی ثبت نشده</p>
          <p className="text-xs mt-1">از فروشگاه خرید کنید!</p>
        </div>
      )}
    </div>
  );
}
