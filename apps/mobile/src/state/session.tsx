import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type Result = { ok: true } | { ok: false; message: string };
type SessionState = {
  session: Session | null; loading: boolean; configured: boolean;
  signIn(email: string, password: string): Promise<Result>; signOut(): Promise<void>;
};
const SessionContext = createContext<SessionState | null>(null);
export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);
  const value = useMemo<SessionState>(() => ({
    session, loading, configured: Boolean(supabase),
    async signIn(email, password) {
      if (!supabase) return { ok: false, message: "Mobil Supabase yapılandırması eksik." };
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error ? { ok: false, message: "Giriş bilgileri doğrulanamadı." } : { ok: true };
    },
    async signOut() { await supabase?.auth.signOut(); },
  }), [loading, session]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("SessionProvider eksik.");
  return value;
}