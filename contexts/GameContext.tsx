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
  purchaseMysteryBox: (count?: number) => Promise<{ success: boolean; heroes?: HeroWithRarity[]; error?: string }>;
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
  purchaseMysteryBox: async () => ({ success: false, heroes: [] }),
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
    const now = new Date();
    const heroMap = new Map<string, UserHeroWithDetails[]>();
    userHeroes.forEach(uh => {
      const existing = heroMap.get(uh.hero_id) || [];
      existing.push(uh);
      heroMap.set(uh.hero_id, existing);
    });
    const stacked: StackedHero[] = [];
    heroMap.forEach((instances, heroId) => {
      const hero = instances[0].heroes;
      const activeInstances = instances.filter(i => i.is_active);
      const activeCount = activeInstances.length;
      const isAnyActive = activeCount > 0;
      const isAnyRevealed = instances.some(i => i.is_revealed);
      const primaryInstance = instances.find(i => i.is_revealed && i.is_active) || instances.find(i => i.is_revealed) || instances[0];
      
      // Calculate current power levels (accounting for hourly decrease)
      let activeWithPowerCount = 0;
      let totalPowerSum = 0;
      let activePowerSum = 0;
      
      // Helper function to calculate current power for any instance
      const calculateCurrentPower = (instance: UserHeroWithDetails): number => {
        const basePower = instance.power_level ?? 100;
        
        // If inactive, return base power (no decrease)
        if (!instance.is_active) {
          return basePower;
        }
        
        // If active, calculate power decrease
        const lastPowerUpdate = instance.last_power_update 
          ? new Date(instance.last_power_update) 
          : (instance.activated_at ? new Date(instance.activated_at) : now);
        
        const hoursElapsed = (now.getTime() - lastPowerUpdate.getTime()) / (1000 * 60 * 60);
        const powerDecrease = Math.floor(hoursElapsed);
        const currentPower = Math.max(0, basePower - powerDecrease);
        
        return currentPower;
      };
      
      instances.forEach(instance => {
        const currentPower = calculateCurrentPower(instance);
        
        // Add to total power (all instances)
        totalPowerSum += currentPower;
        
        // Add to active power (only active instances)
        if (instance.is_active) {
          activePowerSum += currentPower;
          
          // Count only active instances with power > 0 for earning calculation
          if (currentPower > 0) {
            activeWithPowerCount++;
          }
        }
      });
      
      // Only count heroes with power > 0 for earning rate
      const totalEarningRate = activeWithPowerCount * hero.hero_rarities.supercash_per_hour;
      
      stacked.push({ 
        hero_id: heroId, 
        hero, 
        count: instances.length, 
        instances, 
        activeCount, 
        totalEarningRate,
        isAnyActive, 
        isAnyRevealed, 
        primaryInstance,
        totalPower: totalPowerSum,
        activePower: activePowerSum
      });
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
      if (uh.is_active && uh.power_level > 0) {
        // Calculate current power level (accounting for hourly decrease)
        const lastPowerUpdate = uh.last_power_update ? new Date(uh.last_power_update) : (uh.activated_at ? new Date(uh.activated_at) : now);
        const hoursElapsedForPower = (now.getTime() - lastPowerUpdate.getTime()) / (1000 * 60 * 60);
        const powerDecrease = Math.floor(hoursElapsedForPower);
        const currentPower = Math.max(0, (uh.power_level || 100) - powerDecrease);
        
        // Only calculate earnings if hero still has power
        if (currentPower > 0) {
          const lastCollected = uh.last_collected_at ? new Date(uh.last_collected_at) : new Date(uh.activated_at!);
          const hoursElapsed = (now.getTime() - lastCollected.getTime()) / (1000 * 60 * 60);
          total += Math.floor(hoursElapsed * uh.heroes.hero_rarities.supercash_per_hour);
        }
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

  // Update pending SuperCash and refresh heroes periodically to update power levels
  useEffect(() => {
    calculatePending();
    // Refresh heroes every minute to get updated power levels from database
    const pendingInterval = setInterval(calculatePending, 1000);
    const refreshInterval = setInterval(() => {
      if (user) {
        fetchUserHeroes();
      }
    }, 60000); // Refresh every minute
    
    return () => {
      clearInterval(pendingInterval);
      clearInterval(refreshInterval);
    };
  }, [calculatePending, user]);

  const claimFreeHero = async (): Promise<boolean> => {
    if (!user || profile?.has_claimed_free_hero) return false;
    try {
      setError(null);
      const starterHero = allHeroes.find(h => h.is_starter);
      if (!starterHero) { setError('No starter hero available'); return false; }
      const { error: insertError } = await supabase.from('user_heroes').insert({ 
        user_id: user.id, 
        hero_id: starterHero.id, 
        is_active: false, 
        is_revealed: true,
        power_level: 100 
      });
      if (insertError) { setError(insertError.message); return false; }
      const { error: updateError } = await supabase.from('profiles').update({ has_claimed_free_hero: true }).eq('id', user.id);
      if (updateError) { setError(updateError.message); return false; }
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
      const { error: updateError } = await supabase.from('user_heroes').update({ 
        is_active: true, 
        activated_at: now, 
        last_collected_at: now,
        last_power_update: now 
      }).eq('id', userHeroId).eq('user_id', user.id);
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
      const { error: updateError } = await supabase.from('user_heroes').update({ 
        is_active: true, 
        activated_at: now, 
        last_collected_at: now,
        last_power_update: now 
      }).eq('hero_id', heroId).eq('user_id', user.id);
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

  const purchaseMysteryBox = async (count: number = 1): Promise<{ success: boolean; heroes?: HeroWithRarity[]; error?: string }> => {
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
      const selectRandomHero = (): HeroWithRarity => {
        let random = Math.random() * totalWeight;
        for (const wh of weightedHeroes) { random -= wh.weight; if (random <= 0) return wh.hero; }
        return weightedHeroes[0].hero;
      };
      const selectedHeroes: HeroWithRarity[] = [];
      const inserts = [];
      for (let i = 0; i < count; i++) {
        const hero = selectRandomHero();
        selectedHeroes.push(hero);
        inserts.push({ 
          user_id: user.id, 
          hero_id: hero.id, 
          is_active: false, 
          is_revealed: true,
          power_level: 100 
        });
      }
      const { error: insertError } = await supabase.from('user_heroes').insert(inserts);
      if (insertError) return { success: false, error: insertError.message };
      await fetchUserHeroes();
      return { success: true, heroes: selectedHeroes };
    } catch { return { success: false, error: 'Failed to purchase mystery box' }; }
  };

  return (
    <GameContext.Provider value={{ userHeroes, stackedHeroes, allHeroes, rarities, pendingSupercash, loading, error, claimFreeHero, activateHero, deactivateHero, activateAllCopies, deactivateAllCopies, revealHero, collectSupercash, refreshHeroes, calculatePending, purchaseMysteryBox }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => useContext(GameContext);
