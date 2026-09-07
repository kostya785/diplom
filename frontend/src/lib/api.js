const API_URL = "http://localhost:3000";

export async function api(path, options = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  const data = await res.json();

  if (!res.ok) {
    return { error: true, message: data.message || "Ошибка запроса", status: res.status };
  }

  return data;
}

export async function getCurrentUser() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  const data = await api("/auth/me");
  if (data.error) {
    localStorage.removeItem("token");
    return null;
  }
  return data;
}

export function logout() {
  localStorage.removeItem("token");
  window.location.href = "/";
}
