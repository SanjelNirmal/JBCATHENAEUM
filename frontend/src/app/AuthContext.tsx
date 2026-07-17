import { createContext, useContext, type ReactNode } from "react";
import { useAuth, type AuthState } from "../lib/supabase/auth";

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={useAuth()}>{children}</AuthContext.Provider>
  );
}

export function useCurrentAuth() {
  const value = useContext(AuthContext);
  if (!value)
    throw new Error("useCurrentAuth must be used inside AuthProvider");
  return value;
}
