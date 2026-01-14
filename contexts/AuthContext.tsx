import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/database';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  mfaChecking: boolean;
  mfaRequired: boolean;
  mfaVerified: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<boolean>;
  changePassword: (newPassword: string) => Promise<boolean>;
  checkMFAStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  mfaChecking: true,
  mfaRequired: false,
  mfaVerified: false,
  signOut: async () => {},
  refreshProfile: async () => {},
  updateProfile: async () => false,
  changePassword: async () => false,
  checkMFAStatus: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mfaChecking, setMfaChecking] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaVerified, setMfaVerified] = useState(false);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    setProfile(data);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const checkMFAStatus = async () => {
    setMfaChecking(true);
    try {
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      const verifiedFactors = factorsData?.totp?.filter((f: any) => f.status === 'verified') || [];
      const hasMFA = verifiedFactors.length > 0;
      setMfaRequired(hasMFA);
      if (hasMFA) {
        const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        const isAAL2 = aalData?.currentLevel === 'aal2';
        setMfaVerified(isAAL2);
      } else {
        setMfaVerified(true);
      }
    } catch (err) {
      console.error('MFA check error:', err);
      setMfaRequired(false);
      setMfaVerified(false);
    }
    setMfaChecking(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setMfaChecking(true);
        await fetchProfile(session.user.id);
        await checkMFAStatus();
      } else {
        setMfaRequired(false);
        setMfaVerified(false);
        setMfaChecking(false);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (session?.user) {
          setMfaChecking(true);
        }
        (async () => {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchProfile(session.user.id);
            await checkMFAStatus();
          } else {
            setProfile(null);
            setMfaRequired(false);
            setMfaVerified(false);
            setMfaChecking(false);
          }
          setLoading(false);
        })();
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<Profile>): Promise<boolean> => {
    if (!user) return false;
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);
    if (error) return false;
    await fetchProfile(user.id);
    return true;
  };

  const changePassword = async (newPassword: string): Promise<boolean> => {
    if (!user) return false;
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return !error;
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, mfaChecking, mfaRequired, mfaVerified, signOut, refreshProfile, updateProfile, changePassword, checkMFAStatus }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
