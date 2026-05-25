'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ApiUser } from '../types/api';

interface UserStore {
  user: ApiUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;

  setUser: (user: ApiUser, token: string) => void;
  clearUser: () => void;
  setToken: (token: string) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isAdmin: false,

      setUser: (user, token) =>
        set({
          user,
          accessToken: token,
          isAuthenticated: true,
          isAdmin: user.is_admin ?? false,
        }),

      clearUser: () =>
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isAdmin: false,
        }),

      setToken: (token) => set({ accessToken: token }),
    }),
    {
      name: 'pokenese-user',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
      }),
    }
  )
);
