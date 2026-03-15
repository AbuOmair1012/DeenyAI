const API_URL = "/api";

function getToken(): string | null {
  return localStorage.getItem("admin_token");
}

export function saveToken(token: string) {
  localStorage.setItem("admin_token", token);
}

export function clearToken() {
  localStorage.removeItem("admin_token");
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const adminApi = {
  // Auth
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  // Stats
  getStats: () => request<any>("/admin/stats"),

  // Users
  getUsers: () => request<any[]>("/admin/users"),

  // References
  getReferences: (params?: Record<string, string>) => {
    const qs = params
      ? "?" + new URLSearchParams(params).toString()
      : "";
    return request<any[]>(`/admin/references${qs}`);
  },
  getReference: (id: string) => request<any>(`/admin/references/${id}`),
  createReference: (data: any) =>
    request<any>("/admin/references", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateReference: (id: string, data: any) =>
    request<any>(`/admin/references/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteReference: (id: string) =>
    request<void>(`/admin/references/${id}`, { method: "DELETE" }),

  // Categories
  getCategories: () => request<any[]>("/admin/categories"),
  createCategory: (data: any) =>
    request<any>("/admin/categories", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateCategory: (id: string, data: any) =>
    request<any>(`/admin/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteCategory: (id: string) =>
    request<void>(`/admin/categories/${id}`, { method: "DELETE" }),
};
