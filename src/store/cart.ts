"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartItem {
  productId: string;
  title: string;
  price: number;
  thumbnail: string | null;
  brand: string | null;
  quantity: number;
  selectedOptions?: Record<string, string>;
}

interface CartStore {
  items: CartItem[];
  loaded: boolean;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (productId: string, selectedOptions?: Record<string, string>) => void;
  updateQuantity: (productId: string, quantity: number, selectedOptions?: Record<string, string>) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
  syncFromServer: () => Promise<void>;
}

function optionsMatch(a?: Record<string, string>, b?: Record<string, string>) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  const keysA = Object.keys(a).sort();
  const keysB = Object.keys(b).sort();
  if (keysA.length !== keysB.length) return false;
  return keysA.every((k, i) => k === keysB[i] && a[k] === b[k]);
}

function syncToServer(items: CartItem[]) {
  fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  }).catch(() => {});
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      loaded: false,

      addItem: (item) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === item.productId && optionsMatch(i.selectedOptions, item.selectedOptions)
          );
          let newItems;
          if (existing) {
            newItems = state.items.map((i) =>
              i.productId === item.productId && optionsMatch(i.selectedOptions, item.selectedOptions)
                ? { ...i, quantity: i.quantity + 1 }
                : i
            );
          } else {
            newItems = [...state.items, { ...item, quantity: 1 }];
          }
          syncToServer(newItems);
          return { items: newItems };
        });
      },

      removeItem: (productId, selectedOptions) => {
        set((state) => {
          const newItems = state.items.filter(
            (i) => !(i.productId === productId && optionsMatch(i.selectedOptions, selectedOptions))
          );
          syncToServer(newItems);
          return { items: newItems };
        });
      },

      updateQuantity: (productId, quantity, selectedOptions) => {
        if (quantity <= 0) {
          get().removeItem(productId, selectedOptions);
          return;
        }
        set((state) => {
          const newItems = state.items.map((i) =>
            i.productId === productId && optionsMatch(i.selectedOptions, selectedOptions)
              ? { ...i, quantity }
              : i
          );
          syncToServer(newItems);
          return { items: newItems };
        });
      },

      clearCart: () => {
        syncToServer([]);
        set({ items: [] });
      },

      totalItems: () => get().items.reduce((acc, i) => acc + i.quantity, 0),
      totalPrice: () => get().items.reduce((acc, i) => acc + i.price * i.quantity, 0),

      syncFromServer: async () => {
        try {
          const res = await fetch("/api/cart");
          const data = await res.json();
          if (data.cart && Array.isArray(data.cart) && data.cart.length > 0) {
            const local = get().items;
            if (local.length === 0) {
              set({ items: data.cart, loaded: true });
            } else {
              set({ loaded: true });
            }
          } else {
            set({ loaded: true });
          }
        } catch {
          set({ loaded: true });
        }
      },
    }),
    {
      name: "skatisho-cart",
    }
  )
);
