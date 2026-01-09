import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { UserHeroWithDetails, Hero, HeroRarity, StackedHero, HeroWithRarity } from '@/types/database';

interface GameContextType {
  userHeroes: UserHeroWithDetails[];
  stackedHeroes: StackedHero[];
  allHeroes: HeroWithRarity[];
  rarities: HeroRarity[];
  pendingSupercash: number;
  loading: boolean;
  error: string | null;
  claimFreeHero: () => Promise<boolean>;
  activateHero: (userHeroId: string) => Promise<boolean>;
  deactivateHero: (userHeroId: string) => Promise<boolean>;
  activateAllCopies: (heroId: string) => Promise<boolean>;
  deactivateAllCopies: (heroId: string) => Promise<boolean>;
  revealHero: (userHeroId: string) => Promise<boolean>;
  collectSupercash: () => Promise<number>;
  refreshHeroes: () => Promise<void>;
  calculatePending: () => void;
  purchaseMysteryBox: () => Promise<{ success: boolean; hero?: HeroWithRarity; error?: string }>;
}

const GameContext = createContext<GameContextType>({
  userHeroes: [],
  stackedHeroes: [],
  allHeroes: [],
  rarities: [],
  pendingSupercash: 0,
  loading: true,
  error: null,
  claimFreeHero: async () => false,
  activateHero: async () => false,
  deactivateHero: async () => false,
  activateAllCopies: async () => false,
  deactivateAllCopies: async () => false,
  revealHero: async () => false,
  collectSupercash: async () => 0,
  refreshHeroes: async () => {},
  calculatePending: () => {},
  purchaseMysteryBox: async () => ({ success: false }),
});

export function GameProvider({ children }: { children: ReactNode }) {
  const { user, profile, refreshProfile } = useAuth();
  const [userHeroes, setUserHeroes] = useState<UserHeroWithDetails[]>([]);
  const [allHeroes, setAllHeroes] = useState<HeroWithRarity[]>([]);
  const [rarities, setRarities] = useState<HeroRarity[]>([]);
  const [pendingSupercash, setPendingSupercash] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const stackedHeroes = useMemo((): StackedHero[] => {
    const heroMap = new Map<string, UserHeroWithDetails[]>();
    userHeroes.forEach(uh => {
      const existing = heroMap.get(uh.hero_id) || [];
      existing.push(uh);
      heroMap.set(uh.hero_id, existing);
    });
    const stacked: StackedHero[] = [];
    heroMap.forEach((instances, heroId) => {
      const hero = instances[0].heroes;
      const activeCount = instances.filter(i => i.is_active).length;
      const isAnyActive = activeCount > 0;
      const isAnyRevealed = instances.some(i => i.is_revealed);
      const primaryInstance = instances.find(i => i.is_revealed && i.is_active) || instances.find(i => i.is_revealed) || instances[0];
      stacked.push({ hero_id: heroId, hero, count: instances.length, instances, activeCount, totalEarningRate: activeCount * hero.hero_rarities.supercash_per_hour, isAnyActive, isAnyRevealed, primaryInstance });
    });
    return stacked.sort((a, b) => new Date(b.primaryInstance.acquired_at).getTime() - new Date(a.primaryInstance.acquired_at).getTime());
  }, [userHeroes]);

  const fetchRarities = async () => {
    const { data } = await supabase.from('hero_rarities').select('*').order('tier', { ascending: true });
    if (data) setRarities(data);
  };

  const fetchAllHeroes = async () => {
    const { data } = await supabase.from('heroes').select('*, hero_rarities(*)');
    if (data) setAllHeroes(data as HeroWithRarity[]);
  };

  const fetchUserHeroes = async () => {
    if (!user) return;
    const { data } = await supabase.from('user_heroes').select('*, heroes(*, hero_rarities(*))').eq('user_id', user.id).order('acquired_at', { ascending: false });
    if (data) setUserHeroes(data as UserHeroWithDetails[]);
  };

  const calculatePending = useCallback(() => {
    let total = 0;
    const now = new Date();
    userHeroes.forEach(uh => {
      if (uh.is_active) {
        const lastCollected = uh.last_collected_at ? new Date(uh.last_collected_at) : new Date(uh.activated_at!);
        const hoursElapsed = (now.getTime() - lastCollected.getTime()) / (1000 * 60 * 60);
        total += Math.floor(hoursElapsed * uh.heroes.hero_rarities.supercash_per_hour);
      }
    });
    setPendingSupercash(total);
  }, [userHeroes]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchRarities();
      await fetchAllHeroes();
      if (user) await fetchUserHeroes();
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
      if (!starterHero) { setError('No starter hero available'); return false; }
      const { error: insertError } = await supabase.from('user_heroes').insert({ user_id: user.id, hero_id: starterHero.id, is_active: false });
      if (insertError) { setError(insertError.message); return false; }
      await supabase.from('profiles').update({ has_claimed_free_hero: true }).eq('id', user.id);
      await fetchUserHeroes();
      await refreshProfile();
      return true;
    } catch { setError('Failed to claim hero'); return false; }
  };

  const activateHero = async (userHeroId: string): Promise<boolean> => {
    if (!user) return false;
    try {
      setError(null);
      const now = new Date().toISOString();
      const { error: updateError } = await supabase.from('user_heroes').update({ is_active: true, activated_at: now, last_collected_at: now }).eq('id', userHeroId).eq('user_id', user.id);
      if (updateError) { setError(updateError.message); return false; }
      await fetchUserHeroes();
      return true;
    } catch { setError('Failed to activate hero'); return false; }
  };

  const deactivateHero = async (userHeroId: string): Promise<boolean> => {
    if (!user) return false;
    try {
      setError(null);
      const { error: updateError } = await supabase.from('user_heroes').update({ is_active: false, activated_at: null }).eq('id', userHeroId).eq('user_id', user.id);
      if (updateError) { setError(updateError.message); return false; }
      await fetchUserHeroes();
      return true;
    } catch { setError('Failed to deactivate hero'); return false; }
  };

  const activateAllCopies = async (heroId: string): Promise<boolean> => {
    if (!user) return false;
    try {
      setError(null);
      const now = new Date().toISOString();
      const { error: updateError } = await supabase.from('user_heroes').update({ is_active: true, activated_at: now, last_collected_at: now }).eq('hero_id', heroId).eq('user_id', user.id);
      if (updateError) { setError(updateError.message); return false; }
      await fetchUserHeroes();
      return true;
    } catch { setError('Failed to activate heroes'); return false; }
  };

  const deactivateAllCopies = async (heroId: string): Promise<boolean> => {
    if (!user) return false;
    try {
      setError(null);
      const { error: updateError } = await supabase.from('user_heroes').update({ is_active: false, activated_at: null }).eq('hero_id', heroId).eq('user_id', user.id);
      if (updateError) { setError(updateError.message); return false; }
      await fetchUserHeroes();
      return true;
    } catch { setError('Failed to deactivate heroes'); return false; }
  };

  const revealHero = async (userHeroId: string): Promise<boolean> => {
    if (!user) return false;
    try {
      setError(null);
      const { error: updateError } = await supabase.from('user_heroes').update({ is_revealed: true }).eq('id', userHeroId).eq('user_id', user.id);
      if (updateError) { setError(updateError.message); return false; }
      await fetchUserHeroes();
      return true;
    } catch { setError('Failed to reveal hero'); return false; }
  };

  const collectSupercash = async (): Promise<number> => {
    if (!user) return 0;
    try {
      setError(null);
      const { data, error: rpcError } = await supabase.rpc('collect_supercash', { p_user_id: user.id });
      if (rpcError) { setError(rpcError.message); return 0; }
      await refreshProfile();
      await fetchUserHeroes();
      setPendingSupercash(0);
      return data ?? 0;
    } catch { setError('Failed to collect SuperCash'); return 0; }
  };

  const refreshHeroes = async () => { await fetchUserHeroes(); };

  const purchaseMysteryBox = async (): Promise<{ success: boolean; hero?: HeroWithRarity; error?: string }> => {
    if (!user || !profile) return { success: false, error: 'User not found' };
    try {
      setError(null);
      const availableHeroes = allHeroes.filter(h => !h.is_starter);
      if (availableHeroes.length === 0) return { success: false, error: 'No heroes available' };
      const getWeight = (tier: number): number => {
        switch (tier) { case 1: return 50; case 2: return 30; case 3: return 15; case 4: return 4; case 5: return 1; default: return 10; }
      };
      const weightedHeroes = availableHeroes.map(h => ({ hero: h, weight: getWeight(h.hero_rarities.tier) }));
      const totalWeight = weightedHeroes.reduce((sum, wh) => sum + wh.weight, 0);
      let random = Math.random() * totalWeight;
      let selectedHero = weightedHeroes[0].hero;
      for (const wh of weightedHeroes) { random -= wh.weight; if (random <= 0) { selectedHero = wh.hero; break; } }
      const { error: insertError } = await supabase.from('user_heroes').insert({ user_id: user.id, hero_id: selectedHero.id, is_active: false, is_revealed: true });
      if (insertError) return { success: false, error: insertError.message };
      await fetchUserHeroes();
      return { success: true, hero: selectedHero };
    } catch { return { success: false, error: 'Failed to purchase mystery box' }; }
  };

  return (
    <GameContext.Provider value={{ userHeroes, stackedHeroes, allHeroes, rarities, pendingSupercash, loading, error, claimFreeHero, activateHero, deactivateHero, activateAllCopies, deactivateAllCopies, revealHero, collectSupercash, refreshHeroes, calculatePending, purchaseMysteryBox }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => useContext(GameContext);
