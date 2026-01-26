import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "./api";
// Re-trigger HMR
import { clearAuth, readAuth, writeAuth } from "./authStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readAuth());

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => setSession(readAuth());
    window.addEventListener("unionhub_auth", sync);
    return () => window.removeEventListener("unionhub_auth", sync);
  }, []);

  const value = useMemo(() => {
    const token = session?.token || null;
    const user = session?.user || null;

    return {
      token,
      user,
      isAuthenticated: Boolean(token && user),
      updateSession(next) {
        writeAuth(next);
        setSession(next);
      },
      async login({ role, email, password }) {
        const data = await apiRequest(`/auth/${role}/login`, {
          method: "POST",
          body: { email, password },
        });
        const next = { token: data.token, user: data.user };
        writeAuth(next);
        setSession(next);
        return next;
      },
      logout() {
        clearAuth();
        setSession(null);
      },
    };
  }, [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
