import { create } from "zustand";

interface User {
  id: string;
  phone: string;
  name: string | null;
  avatar: string | null;
  skillLevel: string | null;
  referralCode: string;
  walletBalance: number;
  subscription: {
    endDate: string;
    isActive: boolean;
    plan: { title: string };
  } | null;
}

interface UserStore {
  user: User | null;
  loading: boolean;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  loading: true,

  fetchUser: async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        set({ user: data.user, loading: false });
      } else {
        set({ user: null, loading: false });
      }
    } catch {
      set({ user: null, loading: false });
    }
  },

  logout: async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    set({ user: null });
    window.location.href = "/login";
  },
}));
