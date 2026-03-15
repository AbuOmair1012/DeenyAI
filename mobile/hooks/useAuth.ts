import { create } from "zustand";
import { api, saveToken, clearToken } from "../services/api";
import * as SecureStore from "expo-secure-store";

interface AuthState {
  user: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) => Promise<void>;
  updateProfile: (data: {
    firstName?: string;
    lastName?: string;
    country?: string;
    madhab?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    try {
      const token = await SecureStore.getItemAsync("token");
      if (token) {
        const user = await api.getMe();
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      await clearToken();
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    const { token, user } = await api.login({ email, password });
    await saveToken(token);
    set({ user, isAuthenticated: true });
  },

  register: async (email, password, firstName, lastName) => {
    const { token, user } = await api.register({
      email,
      password,
      firstName,
      lastName,
    });
    await saveToken(token);
    set({ user, isAuthenticated: true });
  },

  updateProfile: async (data) => {
    const user = await api.updateProfile(data);
    set({ user });
  },

  logout: async () => {
    await clearToken();
    set({ user: null, isAuthenticated: false });
  },
}));
