import * as SecureStore from "expo-secure-store";

const API_URL = "http://10.190.58.80:3005/api"; // Your local network IP
// const API_URL = "https://deenyai-production.up.railway.app/api"; 

async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync("token");
}

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync("token", token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync("token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// Auth
export const api = {
  register: (data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => request<{ token: string; user: any }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  }),

  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMe: () => request<any>("/auth/me"),

  updateProfile: (data: {
    firstName?: string;
    lastName?: string;
    country?: string;
    madhab?: string;
  }) => request<any>("/auth/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  }),

  // Chat
  createSession: (title?: string) =>
    request<any>("/chat/sessions", {
      method: "POST",
      body: JSON.stringify({ title }),
    }),

  getSessions: () => request<any[]>("/chat/sessions"),

  getSession: (id: string) => request<any>(`/chat/sessions/${id}`),

  deleteSession: (id: string) =>
    request<void>(`/chat/sessions/${id}`, { method: "DELETE" }),

  // Send message returns SSE stream - handled separately
  sendMessageUrl: (sessionId: string) =>
    `${API_URL}/chat/sessions/${sessionId}/messages`,
};
