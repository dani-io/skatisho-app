"use client";
import { create } from "zustand";

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
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (productId: string, selectedOptions?: Record<string, string>) => void;
  updateQuantity: (productId: string, quantity: number, selectedOptions?: Record<string, string>) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

function optionsMatch(a?: Record<string, string>, b?: Record<string, string>) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  const keysA = Object.keys(a).sort();
  const keysB = Object.keys(b).sort();
  if (keysA.length !== keysB.length) return false;
  return keysA.every((k, i) => k === keysB[i] && a[k] === b[k]);
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  addItem: (item) => {
    set((state) => {
      const existing = state.items.find(
        (i) => i.productId === item.productId && optionsMatch(i.selectedOptions, item.selectedOptions)
      );
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === item.productId && optionsMatch(i.selectedOptions, item.selectedOptions)
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      return { items: [...state.items, { ...item, quantity: 1 }] };
    });
  },
  removeItem: (productId, selectedOptions) => {
    set((state) => ({
      items: state.items.filter(
        (i) => !(i.productId === productId && optionsMatch(i.selectedOptions, selectedOptions))
      ),
    }));
  },
  updateQuantity: (productId, quantity, selectedOptions) => {
    if (quantity <= 0) {
      get().removeItem(productId, selectedOptions);
      return;
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId && optionsMatch(i.selectedOptions, selectedOptions)
          ? { ...i, quantity }
          : i
      ),
    }));
  },
  clearCart: () => set({ items: [] }),
  totalItems: () => get().items.reduce((acc, i) => acc + i.quantity, 0),
  totalPrice: () => get().items.reduce((acc, i) => acc + i.price * i.quantity, 0),
}));
