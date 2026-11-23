import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { api } from '../services/api';
import type { LoginInput } from '../contracts';
import { tokenExpiresAt, type Session } from './session';
import { clearSession, getSession, saveSession, subscribeSession } from './sessionStore';

type Auth = { session: Session | null; login: (input: LoginInput) => Promise<void>; logout: () => void };
const AuthContext = createContext<Auth | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSyncExternalStore(subscribeSession, getSession, () => null);
  useEffect(() => {
    if (!session) return;
    const expires = tokenExpiresAt(session.token) ?? 0;
    const check = () => { if (expires <= Date.now()) clearSession(); };
    const timer = window.setTimeout(check, Math.min(Math.max(0, expires - Date.now()), 2147483647));
    document.addEventListener('visibilitychange', check);
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', check); };
  }, [session]);
  async function login(input: LoginInput) {
    const response = await api.post<Session>('/auth/login', input);
    saveSession(response.data);
  }
  return <AuthContext.Provider value={{ session, login, logout: clearSession }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('AuthProvider ausente');
  return auth;
}
