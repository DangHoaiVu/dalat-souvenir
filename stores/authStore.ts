import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { User } from "@/types";

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  isInitialized: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  setInitialized: (isInitialized: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoggedIn: false,
      isInitialized: false,
      login: (user) => set({ user, isLoggedIn: true, isInitialized: true }),
      logout: () => set({ user: null, isLoggedIn: false, isInitialized: true }),
      updateUser: (user) => set({ user }),
      setInitialized: (isInitialized) => set({ isInitialized }),
    }),
    { 
      name: "shopluuniem-auth",
      partialize: (state) => ({ 
        user: state.user, 
        isLoggedIn: state.isLoggedIn 
      }),
    },
  ),
);
