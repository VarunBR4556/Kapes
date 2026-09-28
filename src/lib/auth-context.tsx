/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Role } from "@/lib/users-store";

export interface AuthProfile {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone: string | null;
  profilePic: string | null;
  held: boolean;
  blocked: boolean;
  warned: boolean;
}

interface AuthValue {
  session: Session | null;
  user: SupabaseUser | null;
  profile: AuthProfile | null;
  role: Role | null;
  loading: boolean;
  signUp: (input: {
    email: string;
    password: string;
    name: string;
    role: Exclude<Role, "admin">;
  }) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

const toAuthProfile = (row: Record<string, unknown>): AuthProfile => ({
  id: String(row.id),
  email: String(row.email ?? ""),
  name: String(row.name ?? ""),
  role: (row.role as Role) ?? "customer",
  phone: (row.phone as string | null) ?? null,
  profilePic: (row.profile_pic as string | null) ?? null,
  held: Boolean(row.held),
  blocked: Boolean(row.blocked),
  warned: Boolean(row.warned),
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, role, phone, profile_pic, held, blocked, warned")
      .eq("id", userId)
      .maybeSingle();
    if (error) {
      setProfile(null);
      return;
    }
    setProfile(data ? toAuthProfile(data as Record<string, unknown>) : null);
  }, []);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session?.user) await loadProfile(data.session.user.id);
      if (active) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (!next) {
        setProfile(null);
        setLoading(false);
        return;
      }
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "USER_UPDATED") {
        setLoading(true);
        void loadProfile(next.user.id).finally(() => setLoading(false));
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signUp = useCallback<AuthValue["signUp"]>(async ({ email, password, name, role }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role } },
    });
    if (error) return { error: error.message, needsConfirmation: false };
    return {
      error: null,
      needsConfirmation: !data.session,
    };
  }, []);

  const signIn = useCallback<AuthValue["signIn"]>(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user.id);
  }, [session, loadProfile]);

  const value = useMemo<AuthValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      role: profile?.role ?? null,
      loading,
      signUp,
      signIn,
      signOut,
      refreshProfile,
    }),
    [session, profile, loading, signUp, signIn, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
