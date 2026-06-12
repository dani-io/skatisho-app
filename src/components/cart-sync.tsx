"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cart";

export function CartSync() {
  const syncFromServer = useCartStore((s) => s.syncFromServer);

  useEffect(() => {
    syncFromServer();
  }, []);

  return null;
}
