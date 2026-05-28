import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../services/api";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (username, password) => {
        set({ isLoading: true });
        try {
          const response = await api.post("/auth/login", {
            username,
            password,
          });
          const { token, user } = response.data;
          set({
            token,
            user,
            isAuthenticated: true,
            isLoading: false,
          });
          localStorage.setItem("token", token);
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return {
            success: false,
            error: error.response?.data?.error || "Login failed",
          };
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        localStorage.removeItem("token");
        delete api.defaults.headers.common["Authorization"];
      },

      getToken: () => get().token,

      getUser: () => get().user,

      isAdmin: () => get().user?.role === "admin",

      isAccountant: () => ["admin", "accountant"].includes(get().user?.role),
    }),
    {
      name: "auth-storage",
      getStorage: () => localStorage,
    },
  ),
);
