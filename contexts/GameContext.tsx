import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { UserHeroWithDetails, Hero, HeroRarity } from '@/types/database';

interface GameContextType {
  userHeroes: UserHeroWithDetails[];
  allHeroes: (Hero & { hero_rarities: HeroRarity })[];
  rarities: HeroRarity[];
  pendingSupercash: number;
  loading: boolean;
  error: string | null;
  claimFreeHero: () => Promise<boolean>;
  activateHero: (userHeroId: string) => Promise<boolean>;
  revealHero: (userHeroId: string) => Promise<boolean>;
  collectSupercash: () => Promise<number>;
  refreshHeroes: () => Promise<void>;
  calculatePending: () => void;
  purchaseHero: (heroId: string, price: number) => Promise<{ success: boolean; error?: string }>;
}

const GameContext = createContext<GameContextType>({
  userHeroes: [],
  allHeroes: [],
  rarities: [],
  pendingSupercash: 0,
  loading: true,
  error: null,
  claimFreeHero: async () => false,
  activateHero: async () => false,
  revealHero: async () => false,
  collectSupercash: async () => 0,
  refreshHeroes: async () => {},
  calculatePending: () => {},
  purchaseHero: async () => ({ success: false }),
});

export function GameProvider({ children }: { children: ReactNode }) {
  const { user, profile, refreshProfile } = useAuth();
  const [userHeroes, setUserHeroes] = useState<UserHeroWithDetails[]>([]);
  const [allHeroes, setAllHeroes] = useState<(Hero & { hero_rarities: HeroRarity })[]>([]);
  const [rarities, setRarities] = useState<HeroRarity[]>([]);
  const [pendingSupercash, setPendingSupercash] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRarities = async () => {
    const { data } = await supabase
      .from('hero_rarities')
      .select('*')
      .order('tier', { ascending: true });

    if (data) setRarities(data);
  };

  const fetchAllHeroes = async () => {
    const { data } = await supabase
      .from('heroes')
      .select('*, hero_rarities(*)');

    if (data) setAllHeroes(data as (Hero & { hero_rarities: HeroRarity })[]);
  };

  const fetchUserHeroes = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_heroes')
      .select('*, heroes(*, hero_rarities(*))')
      .eq('user_id', user.id)
      .order('acquired_at', { ascending: false });

    if (data) setUserHeroes(data as UserHeroWithDetails[]);
  };

  const calculatePending = useCallback(() => {
    let total = 0;
    const now = new Date();

    userHeroes.forEach(uh => {
      if (uh.is_active) {
        const lastCollected = uh.last_collected_at
          ? new Date(uh.last_collected_at)
          : new Date(uh.activated_at!);
        const hoursElapsed = (now.getTime() - lastCollected.getTime()) / (1000 * 60 * 60);
        const earned = Math.floor(hoursElapsed * uh.heroes.hero_rarities.supercash_per_hour);
        total += earned;
      }
    });

    setPendingSupercash(total);
  }, [userHeroes]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchRarities();
      await fetchAllHeroes();
      if (user) {
        await fetchUserHeroes();
      }
      setLoading(false);
    };

    init();
  }, [user]);

  useEffect(() => {
    calculatePending();
    const interval = setInterval(calculatePending, 1000);
    return () => clearInterval(interval);
  }, [calculatePending]);

  const claimFreeHero = async (): Promise<boolean> => {
    if (!user || profile?.has_claimed_free_hero) return false;

    try {
      setError(null);
      const starterHero = allHeroes.find(h => h.is_starter);
      if (!starterHero) {
        setError('No starter hero available');
        return false;
      }

      const { error: insertError } = await supabase
        .from('user_heroes')
        .insert({
          user_id: user.id,
          hero_id: starterHero.id,
          is_active: false,
        });

      if (insertError) {
        setError(insertError.message);
        return false;
      }

      await supabase
        .from('profiles')
        .update({ has_claimed_free_hero: true })
        .eq('id', user.id);

      await fetchUserHeroes();
      await refreshProfile();
      return true;
    } catch (err) {
      setError('Failed to claim hero');
      return false;
    }
  };

  const activateHero = async (userHeroId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      setError(null);
      const now = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('user_heroes')
        .update({
          is_active: true,
          activated_at: now,
          last_collected_at: now,
        })
        .eq('id', userHeroId)
        .eq('user_id', user.id);

      if (updateError) {
        setError(updateError.message);
        return false;
      }

      await fetchUserHeroes();
      return true;
    } catch (err) {
      setError('Failed to activate hero');
      return false;
    }
  };

  const revealHero = async (userHeroId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      setError(null);

      const { error: updateError } = await supabase
        .from('user_heroes')
        .update({ is_revealed: true })
        .eq('id', userHeroId)
        .eq('user_id', user.id);

      if (updateError) {
        setError(updateError.message);
        return false;
      }

      await fetchUserHeroes();
      return true;
    } catch (err) {
      setError('Failed to reveal hero');
      return false;
    }
  };

  const collectSupercash = async (): Promise<number> => {
    if (!user) return 0;

    try {
      setError(null);
      const { data, error: rpcError } = await supabase
        .rpc('collect_supercash', { p_user_id: user.id });

      if (rpcError) {
        setError(rpcError.message);
        return 0;
      }

      await refreshProfile();
      await fetchUserHeroes();
      setPendingSupercash(0);
      return data ?? 0;
    } catch (err) {
      setError('Failed to collect SuperCash');
      return 0;
    }
  };

  const refreshHeroes = async () => {
    await fetchUserHeroes();
  };

  const purchaseHero = async (heroId: string, price: number): Promise<{ success: boolean; error?: string }> => {
    if (!user || !profile) return { success: false, error: 'User not found' };

    if (profile.supercash_balance < price) {
      return { success: false, error: 'Insufficient SuperCash balance' };
    }

    try {
      setError(null);

      const { error: insertError } = await supabase
        .from('user_heroes')
        .insert({
          user_id: user.id,
          hero_id: heroId,
          is_active: false,
          is_revealed: true,
        });

      if (insertError) {
        return { success: false, error: insertError.message };
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ supercash_balance: profile.supercash_balance - price })
        .eq('id', user.id);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      await refreshProfile();
      await fetchUserHeroes();
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Failed to purchase hero' };
    }
  };

  return (
    <GameContext.Provider value={{
      userHeroes,
      allHeroes,
      rarities,
      pendingSupercash,
      loading,
      error,
      claimFreeHero,
      activateHero,
      revealHero,
      collectSupercash,
      refreshHeroes,
      calculatePending,
      purchaseHero,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => useContext(GameContext);
