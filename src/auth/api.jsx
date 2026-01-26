import { clearAuth } from "./authStorage";
import { toast } from "sonner";
import { CustomToast } from "../components/CustomToast";

export async function apiRequest(path, { method = "GET", token, body } = {}) {
  const res = await fetch(path.startsWith("/api") ? path : `/api${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    if (res.status === 401 && token) {
      clearAuth();
      const message = "Session expired. Please login again.";
      toast.custom((t) => <CustomToast id={t} message={message} />);
      throw new Error(message);
    }
    const message = data?.error || text || `Request failed (${res.status})`;
    toast.custom((t) => <CustomToast id={t} message={message} />);
    throw new Error(message);
  }

  return data;
}
