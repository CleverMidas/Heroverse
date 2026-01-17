import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Modal, Dimensions, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useGame } from '@/contexts/GameContext';
import { useTheme } from '@/contexts/ThemeContext';
import { SkeletonImage } from '@/components/ui';
import { StackedHero, HeroWithRarity } from '@/types/database';
import { Zap, Coins, Gift, X, Sparkles, Check, Layers, Flame, Star, Crown } from 'lucide-react-native';
import { getHeroImageSource } from '@/lib/heroImages';

type MysteryPackage = { id: 'single' | 'triple' | 'mega'; count: number; price: string; label: string; bonus?: string; icon: any; colors: [string, string]; popular?: boolean };

const { width, height } = Dimensions.get('window');
const BG = require('@/assets/home_bg.jpg');
const DICE = require('@/assets/golden_dice.png');

type Filter = 'all' | 'active' | 'inactive';

export default function HeroesScreen() {
  const { profile } = useAuth();
  const { stackedHeroes, allHeroes, claimFreeHero, activateAllCopies, deactivateAllCopies, purchaseMysteryBox, loading, error } = useGame();
  const { theme, isDark } = useTheme();
  const { openMystery } = useLocalSearchParams<{ openMystery?: string }>();
  const [claiming, setClaiming] = useState(false);
  const [activating, setActivating] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState<string | null>(null);
  const [selected, setSelected] = useState<StackedHero | null>(null);
  const [showClaim, setShowClaim] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [showMystery, setShowMystery] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [revealedHeroes, setRevealedHeroes] = useState<HeroWithRarity[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<MysteryPackage['id']>('single');
  const [revealIndex, setRevealIndex] = useState(0);

  const packages: MysteryPackage[] = [
    { id: 'single', count: 1, price: '$7.99', label: '1x Hero', bonus: 'Cheaper!', icon: Gift, colors: ['#3B82F6', '#1D4ED8'] },
    { id: 'triple', count: 3, price: '$19.99', label: '3x Heroes', bonus: 'Save 17%', icon: Star, colors: ['#8B5CF6', '#6D28D9'], popular: true },
    { id: 'mega', count: 10, price: '$49.99', label: '10x Heroes', bonus: 'Best Value!', icon: Crown, colors: ['#F59E0B', '#D97706'] },
  ];

  useEffect(() => { if (openMystery === 'true') setShowMystery(true); }, [openMystery]);

  // Add real-time updates for power calculation
  const [powerRefresh, setPowerRefresh] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setPowerRefresh(p => p + 1), 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const starter = allHeroes.find(h => h.is_starter);
  const canClaim = !profile?.has_claimed_free_hero && starter;
  const total = stackedHeroes.reduce((s, h) => s + h.count, 0);
  const active = stackedHeroes.reduce((s, h) => s + h.activeCount, 0);
  
  // Calculate total power using current calculated values (accounting for real-time decrease)
  // This recalculates from instances to get most up-to-date values
  const calculateTotalPower = () => {
    let total = 0;
    stackedHeroes.forEach(stack => {
      stack.instances.forEach(inst => {
        total += calculateCurrentPower(inst);
      });
    });
    return total;
  };
  
  const power = calculateTotalPower();
  const earning = stackedHeroes.reduce((s, h) => s + h.totalEarningRate, 0);
  const filtered = stackedHeroes.filter(st => filter === 'all' ? true : filter === 'active' ? st.isAnyActive : !st.isAnyActive);

  const onClaim = async () => { setClaiming(true); if (await claimFreeHero()) setShowClaim(true); setClaiming(false); };
  const onActivate = async (id: string) => { setActivating(id); await activateAllCopies(id); setActivating(null); setSelected(null); };
  const onDeactivate = async (id: string) => { setDeactivating(id); await deactivateAllCopies(id); setDeactivating(null); setSelected(null); };
  const onPurchase = async (pkg: MysteryPackage) => {
    setPurchasing(true);
    const r = await purchaseMysteryBox(pkg.count);
    setPurchasing(false);
    if (r.success && r.heroes && r.heroes.length > 0) {
      setRevealedHeroes(r.heroes);
      setRevealIndex(0);
    }
  };
  const closeMystery = () => { setShowMystery(false); setRevealedHeroes([]); setRevealIndex(0); };
  const nextReveal = () => { if (revealIndex < revealedHeroes.length - 1) setRevealIndex(revealIndex + 1); else closeMystery(); };

  if (loading) return (
    <ImageBackground source={BG} style={s.bg} resizeMode="cover"><View style={[s.overlay, { backgroundColor: isDark ? 'rgba(10,15,30,0.85)' : 'rgba(248,250,252,0.70)' }]}><SafeAreaView style={s.loadCenter}><ActivityIndicator size="large" color={theme.colors.primary} /><Text style={[s.loadText, { color: theme.colors.textSecondary }]}>Loading heroes...</Text></SafeAreaView></View></ImageBackground>
  );

  return (
    <ImageBackground source={BG} style={s.bg} resizeMode="cover">
      <View style={[s.overlay, { backgroundColor: isDark ? 'rgba(10,15,30,0.85)' : 'rgba(248,250,252,0.70)' }]}>
        <SafeAreaView style={s.flex1}>
          {error && <View style={[s.errorBar, { backgroundColor: theme.colors.errorLight, borderColor: `${theme.colors.error}50` }]}><Text style={{ color: theme.colors.error, fontSize: 14, textAlign: 'center' }}>{error}</Text></View>}
          <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
            <View style={s.statsRow}>
              <StatBox icon={Layers} color={theme.colors.primary} value={total} label="Total" theme={theme} />
              <StatBox icon={Zap} color={theme.colors.success} value={active} label="Active" theme={theme} />
              <StatBox icon={Flame} color={theme.colors.purple} value={power} label="Power" theme={theme} />
              <StatBox icon={Coins} color={theme.colors.info} value={earning} label="SC/hr" theme={theme} />
            </View>
            {canClaim && (
              <TouchableOpacity style={s.claimBtn} onPress={onClaim} disabled={claiming}><LinearGradient colors={theme.gradients.success} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.claimGrad}><View style={s.claimIcon}><Gift color="#FFF" size={28} /></View><View style={s.flex1}><Text style={s.claimTitle}>Claim Your Free Hero!</Text><Text style={s.claimSub}>Start earning SuperCash now</Text></View><View style={s.claimAction}>{claiming ? <ActivityIndicator color={theme.colors.success} /> : <Text style={[s.claimActionText, { color: theme.colors.success }]}>CLAIM</Text>}</View></LinearGradient></TouchableOpacity>
            )}
            <View style={s.filterRow}>
              {(['all', 'active', 'inactive'] as Filter[]).map(f => {
                const cnt = f === 'all' ? stackedHeroes.length : f === 'active' ? stackedHeroes.filter(h => h.isAnyActive).length : stackedHeroes.filter(h => !h.isAnyActive).length;
                const lbl = f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Idle';
                return <TouchableOpacity key={f} style={[s.filterBtn, { backgroundColor: filter === f ? 'rgba(251,191,36,0.15)' : theme.colors.card, borderColor: filter === f ? theme.colors.primary : theme.colors.cardBorder }]} onPress={() => setFilter(f)}><Text style={[s.filterText, { color: filter === f ? theme.colors.primary : theme.colors.textMuted }]}>{lbl} ({cnt})</Text></TouchableOpacity>;
              })}
            </View>
            <View style={s.grid}>
              <TouchableOpacity style={[s.mysteryCard, { borderColor: theme.colors.primary }]} onPress={() => setShowMystery(true)} activeOpacity={0.85}>
                <Image source={DICE} style={s.mysteryImg} resizeMode="cover" /><LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} locations={[0.3, 1]} style={StyleSheet.absoluteFillObject} />
                <View style={s.mysteryContent}><View style={[s.priceTag, { backgroundColor: theme.colors.primary }]}><Text style={s.priceText}>$7.99</Text></View><View style={s.flex1} /><View><Text style={s.mysteryTitle}>Mystery Box</Text><View style={s.tapTag}><Text style={[s.tapText, { color: theme.colors.primary }]}>TAP TO OPEN</Text></View></View></View>
              </TouchableOpacity>
              {filtered.map(st => <HeroGridCard key={st.hero_id} stack={st} theme={theme} onPress={() => setSelected(st)} />)}
            </View>
            <View style={s.spacer} />
          </ScrollView>
          <HeroModal stack={selected} theme={theme} onClose={() => setSelected(null)} activating={activating} deactivating={deactivating} onActivate={onActivate} onDeactivate={onDeactivate} />
          <MysteryModal visible={showMystery} theme={theme} revealedHeroes={revealedHeroes} revealIndex={revealIndex} purchasing={purchasing} packages={packages} selectedPackage={selectedPackage} setSelectedPackage={setSelectedPackage} onPurchase={onPurchase} onNext={nextReveal} onClose={closeMystery} />
          <ClaimModal visible={showClaim} theme={theme} hero={starter} onClose={() => setShowClaim(false)} />
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const StatBox = ({ icon: Icon, color, value, label, theme }: any) => (
  <View style={[s.statBox, { backgroundColor: theme.colors.card, borderColor: color }]}><View style={[s.statIcon, { backgroundColor: `${color}20` }]}><Icon color={color} size={16} /></View><Text style={[s.statVal, { color: theme.colors.text }]}>{value}</Text><Text style={[s.statLbl, { color: theme.colors.textSecondary }]}>{label}</Text></View>
);

const calculateCurrentPower = (instance: any): number => {
  if (!instance.is_active || (instance.power_level || 100) === 0) return instance.power_level || 100;
  const now = new Date();
  const lastPowerUpdate = instance.last_power_update ? new Date(instance.last_power_update) : (instance.activated_at ? new Date(instance.activated_at) : now);
  const hoursElapsed = (now.getTime() - lastPowerUpdate.getTime()) / (1000 * 60 * 60);
  const powerDecrease = Math.floor(hoursElapsed);
  return Math.max(0, (instance.power_level || 100) - powerDecrease);
};

const HeroGridCard = ({ stack, theme, onPress }: any) => {
  const avgPower = stack.instances.reduce((sum: number, inst: any) => sum + calculateCurrentPower(inst), 0) / stack.count;
  const hasActiveWithPower = stack.instances.some((inst: any) => inst.is_active && calculateCurrentPower(inst) > 0);
  const isDepleted = stack.isAnyActive && !hasActiveWithPower;
  
  return (
    <TouchableOpacity style={[s.heroCard, { backgroundColor: theme.colors.card, borderColor: stack.isAnyRevealed ? (isDepleted ? '#EF4444' : stack.isAnyActive ? stack.hero.hero_rarities.color_hex : theme.colors.cardBorder) : theme.colors.primary }]} onPress={onPress} activeOpacity={0.85}>
      <SkeletonImage source={getHeroImageSource(stack.hero.image_url)} style={s.heroImg} /><LinearGradient colors={theme.gradients.hero} locations={[0.1, 1]} style={StyleSheet.absoluteFillObject} />
      {stack.count > 1 && <View style={[s.countBadge, { backgroundColor: theme.colors.primary }]}><Text style={s.countText}>{stack.count}X</Text></View>}
      {stack.isAnyActive && stack.isAnyRevealed && !isDepleted && <View style={[s.activeBadge, { backgroundColor: theme.colors.success }]}><Sparkles color="#FFF" size={10} /><Text style={s.activeText}>ACTIVE</Text></View>}
      {isDepleted && <View style={[s.powerBadge, { backgroundColor: '#EF4444' }]}><Flame color="#FFF" size={10} /><Text style={s.powerBadgeText}>POWER: 0</Text></View>}
      <View style={s.heroInfo}>
        <Text style={s.heroName} numberOfLines={1}>{stack.isAnyRevealed ? stack.hero.name : '???'}</Text>
        <View style={s.heroMeta}>
          <View style={[s.rarityTag, { backgroundColor: stack.isAnyRevealed ? stack.hero.hero_rarities.color_hex + '25' : 'rgba(251,191,36,0.2)' }]}><Text style={[s.rarityText, { color: stack.isAnyRevealed ? stack.hero.hero_rarities.color_hex : theme.colors.primary }]}>{stack.isAnyRevealed ? stack.hero.hero_rarities.name : '???'}</Text></View>
          <View style={s.heroMetaRight}>
            <View style={s.scTag}><Coins color={theme.colors.primary} size={14} /><Text style={[s.scText, { color: theme.colors.primary }]}>{stack.isAnyRevealed ? `${stack.hero.hero_rarities.supercash_per_hour}/hr` : '???'}</Text></View>
            <View style={[s.powerBar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}><View style={[s.powerBarFill, { width: `${Math.min(100, avgPower)}%`, backgroundColor: avgPower > 50 ? '#22C55E' : avgPower > 20 ? '#F59E0B' : '#EF4444' }]} /><Text style={[s.powerText, { color: '#FFF' }]}>{Math.round(avgPower)}</Text></View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const HeroModal = ({ stack, theme, onClose, activating, deactivating, onActivate, onDeactivate }: any) => {
  if (!stack) return null;
  
  // Add state to force re-render for real-time power updates
  const [refreshKey, setRefreshKey] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => setRefreshKey((k: number) => k + 1), 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);
  
  const activeInstances = stack.instances.filter((inst: any) => inst.is_active);
  const allPowers = stack.instances.map((inst: any) => calculateCurrentPower(inst));
  const activePowers = activeInstances.map((inst: any) => calculateCurrentPower(inst));
  
  // Calculate average power for active instances (for display)
  const avgPower = activeInstances.length > 0 
    ? activePowers.reduce((sum: number, p: number) => sum + p, 0) / activeInstances.length
    : 0;
  
  // Total power of all instances
  const totalPower = allPowers.reduce((sum: number, p: number) => sum + p, 0);
  
  // Minimum power among active instances
  const minPower = activeInstances.length > 0
    ? Math.min(...activePowers)
    : 100;
  
  const hasActiveWithPower = activePowers.some((p: number) => p > 0);
  const isDepleted = stack.isAnyActive && !hasActiveWithPower;
  
  return (
    <Modal visible={!!stack} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[s.modalBg, { backgroundColor: theme.colors.overlay }]}>
        <View style={[s.modalCard, { backgroundColor: theme.colors.modalBackground, borderColor: theme.colors.cardBorder }]}>
          <TouchableOpacity style={s.closeBtn} onPress={onClose}><X color={theme.colors.textSecondary} size={24} /></TouchableOpacity>
          {stack.count > 1 && <View style={[s.ownedBadge, { backgroundColor: theme.colors.primary }]}><Text style={s.ownedText}>{stack.count}X OWNED</Text></View>}
          <SkeletonImage source={getHeroImageSource(stack.hero.image_url)} style={s.modalImg} />
          <Text style={[s.modalName, { color: theme.colors.text }]}>{stack.hero.name}</Text>
          <View style={[s.tierTag, { backgroundColor: stack.hero.hero_rarities.color_hex + '20' }]}><Text style={[s.tierText, { color: stack.hero.hero_rarities.color_hex }]}>{stack.hero.hero_rarities.name} (Tier {stack.hero.hero_rarities.tier})</Text></View>
          <Text style={[s.desc, { color: theme.colors.textSecondary }]}>{stack.hero.hero_rarities.description}</Text>
          
          {stack.isAnyActive && (
            <View style={[s.powerSection, { backgroundColor: theme.colors.surfaceSecondary }]}>
              <View style={s.powerHeader}>
                <Flame color={isDepleted ? '#EF4444' : '#F59E0B'} size={18} />
                <Text style={[s.powerLabel, { color: theme.colors.text }]}>Power Level</Text>
                <Text style={[s.powerValue, { color: isDepleted ? '#EF4444' : avgPower > 50 ? '#22C55E' : '#F59E0B' }]}>{Math.round(avgPower)} / 100</Text>
              </View>
              <View style={[s.powerBarLarge, { backgroundColor: theme.colors.surfaceSecondary }]}>
                <View style={[s.powerBarFillLarge, { 
                  width: `${Math.min(100, avgPower)}%`, 
                  backgroundColor: isDepleted ? '#EF4444' : avgPower > 50 ? '#22C55E' : avgPower > 20 ? '#F59E0B' : '#EF4444' 
                }]} />
              </View>
              {isDepleted && <Text style={[s.powerWarning, { color: '#EF4444' }]}>⚠️ Power depleted! Hero cannot produce SuperCash. Deactivate to preserve power.</Text>}
              {activeInstances.length > 1 && <Text style={[s.powerSubtext, { color: theme.colors.textSecondary }]}>Min Power: {Math.round(minPower)} (decreasing 1/hr while active)</Text>}
            </View>
          )}
          
          <View style={s.modalStats}>
            <ModalStat icon={Coins} color={theme.colors.primary} value={hasActiveWithPower ? (stack.count > 1 ? `${stack.activeCount}×${stack.hero.hero_rarities.supercash_per_hour}` : stack.hero.hero_rarities.supercash_per_hour) : 0} label="SC/hr" theme={theme} />
            <ModalStat icon={Flame} color={theme.colors.purple} value={totalPower} label="Total Power" theme={theme} />
            <ModalStat icon={Layers} color={theme.colors.info} value={`${stack.activeCount}/${stack.count}`} label="Active" theme={theme} />
          </View>
          
          {stack.isAnyActive ? (
            <>
              {isDepleted ? (
                <View style={[s.depletedRow, { backgroundColor: '#EF4444' + '20' }]}>
                  <Flame color="#EF4444" size={20} />
                  <Text style={[s.depletedInfo, { color: '#EF4444' }]}>All active heroes have 0 power. Collect to preserve!</Text>
                </View>
              ) : (
                <View style={[s.activeRow, { backgroundColor: theme.colors.successLight }]}>
                  <Check color={theme.colors.success} size={20} />
                  <Text style={[s.activeInfo, { color: theme.colors.success }]}>{stack.activeCount} of {stack.count} Active & Earning</Text>
                </View>
              )}
              <TouchableOpacity style={[s.deactBtn, { backgroundColor: theme.colors.errorLight, borderColor: `${theme.colors.error}50` }]} onPress={() => onDeactivate(stack.hero_id)} disabled={deactivating === stack.hero_id}>
                {deactivating === stack.hero_id ? <ActivityIndicator color={theme.colors.error} size="small" /> : <><Zap color={theme.colors.error} size={16} /><Text style={[s.deactText, { color: theme.colors.error }]}>Deactivate All</Text></>}
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={s.actBtn} onPress={() => onActivate(stack.hero_id)} disabled={activating === stack.hero_id}>
              <LinearGradient colors={theme.gradients.primary} style={s.actGrad}>
                {activating === stack.hero_id ? <ActivityIndicator color="#0F172A" /> : <><Zap color="#0F172A" size={20} /><Text style={s.actText}>ACTIVATE ALL ({stack.count})</Text></>}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const ModalStat = ({ icon: Icon, color, value, label, theme }: any) => (
  <View style={s.mStat}><Icon color={color} size={20} /><Text style={[s.mStatVal, { color: theme.colors.text }]}>{value}</Text><Text style={[s.mStatLbl, { color: theme.colors.textSecondary }]}>{label}</Text></View>
);

const MysteryModal = ({ visible, theme, revealedHeroes, revealIndex, purchasing, packages, selectedPackage, setSelectedPackage, onPurchase, onNext, onClose }: any) => {
  const currentHero = revealedHeroes[revealIndex];
  const isRevealing = revealedHeroes.length > 0;
  const remaining = revealedHeroes.length - revealIndex - 1;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}><View style={[s.modalBg, { backgroundColor: theme.colors.overlay }]}><View style={[s.mysteryModal, { backgroundColor: theme.colors.modalBackground, borderColor: `${theme.colors.primary}66` }]}>
      <TouchableOpacity style={s.closeBtn} onPress={onClose}><X color={theme.colors.textSecondary} size={24} /></TouchableOpacity>
      {isRevealing && currentHero ? (
        <><View style={s.revealIcon}><Sparkles color={currentHero.hero_rarities.color_hex} size={48} /></View>
          <Text style={[s.revealTitle, { color: theme.colors.text }]}>Hero Obtained!</Text>
          {revealedHeroes.length > 1 && <View style={[s.revealCounter, { backgroundColor: theme.colors.primary }]}><Text style={s.revealCounterText}>{revealIndex + 1} / {revealedHeroes.length}</Text></View>}
          <SkeletonImage source={getHeroImageSource(currentHero.image_url)} style={s.revealImg} />
          <Text style={[s.revealName, { color: theme.colors.text }]}>{currentHero.name}</Text>
          <View style={[s.revealTag, { backgroundColor: currentHero.hero_rarities.color_hex + '20' }]}><Text style={[s.revealRarity, { color: currentHero.hero_rarities.color_hex }]}>{currentHero.hero_rarities.name}</Text></View>
          <View style={s.revealSc}><Coins color={theme.colors.primary} size={16} /><Text style={[s.revealScText, { color: theme.colors.primary }]}>{currentHero.hero_rarities.supercash_per_hour} SC/hr</Text></View>
          <TouchableOpacity style={[s.awesomeBtn, { backgroundColor: theme.colors.primary }]} onPress={onNext}><Text style={s.awesomeText}>{remaining > 0 ? `Next (${remaining} more)` : 'Awesome!'}</Text></TouchableOpacity>
        </>
      ) : (
        <><Image source={DICE} style={s.diceImg} resizeMode="contain" />
          <Text style={[s.mysteryTitleModal, { color: theme.colors.text }]}>Mystery Box</Text>
          <Text style={[s.mysteryDesc, { color: theme.colors.textSecondary }]}>Get random heroes! Duplicates stack and multiply your SC earnings!</Text>
          <View style={s.packagesContainer}>
            {packages.map((pkg: MysteryPackage) => (
              <TouchableOpacity key={pkg.id} style={[s.packageCard, selectedPackage === pkg.id && s.packageCardSelected, { backgroundColor: selectedPackage === pkg.id ? `${pkg.colors[0]}15` : theme.colors.surfaceSecondary, borderColor: selectedPackage === pkg.id ? pkg.colors[0] : theme.colors.cardBorder }]} onPress={() => setSelectedPackage(pkg.id)} activeOpacity={0.8}>
                {pkg.popular && <View style={[s.popularBadge, { backgroundColor: pkg.colors[0] }]}><Text style={s.popularText}>POPULAR</Text></View>}
                {pkg.bonus && <View style={[s.bonusBadge, { backgroundColor: `${pkg.colors[0]}20` }]}><Text style={[s.bonusText, { color: pkg.colors[0] }]}>{pkg.bonus}</Text></View>}
                <LinearGradient colors={pkg.colors} style={s.packageIcon}><pkg.icon color="#FFF" size={20} /></LinearGradient>
                <Text style={[s.packageLabel, { color: theme.colors.text }]}>{pkg.label}</Text>
                <Text style={[s.packagePrice, { color: pkg.colors[0] }]}>{pkg.price}</Text>
                {selectedPackage === pkg.id && <View style={[s.selectedCheck, { backgroundColor: pkg.colors[0] }]}><Check color="#FFF" size={12} /></View>}
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={s.openBtn} onPress={() => onPurchase(packages.find((p: MysteryPackage) => p.id === selectedPackage))} disabled={purchasing}>
            <LinearGradient colors={packages.find((p: MysteryPackage) => p.id === selectedPackage)?.colors || theme.gradients.primary} style={s.openGrad}>
              {purchasing ? <ActivityIndicator color="#FFF" /> : <><Gift color="#FFF" size={20} /><Text style={s.openText}>OPEN {packages.find((p: MysteryPackage) => p.id === selectedPackage)?.label.toUpperCase()}</Text></>}
            </LinearGradient>
          </TouchableOpacity>
        </>
      )}
    </View></View></Modal>
  );
};

const ClaimModal = ({ visible, theme, hero, onClose }: any) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}><View style={[s.modalBg, { backgroundColor: theme.colors.overlay }]}><View style={[s.claimModal, { backgroundColor: theme.colors.modalBackground, borderColor: theme.colors.cardBorder }]}><View style={s.claimModalIcon}><Sparkles color={theme.colors.primary} size={48} /></View><Text style={[s.claimModalTitle, { color: theme.colors.text }]}>Hero Claimed!</Text><Text style={[s.claimModalSub, { color: theme.colors.textSecondary }]}>You received {hero?.name}! Tap Activate to start earning SuperCash.</Text><TouchableOpacity style={[s.awesomeBtn, { backgroundColor: theme.colors.primary }]} onPress={onClose}><Text style={s.awesomeText}>Awesome!</Text></TouchableOpacity></View></View></Modal>
);

const s = StyleSheet.create({
  bg: { flex: 1, width, height },
  overlay: { flex: 1 },
  flex1: { flex: 1 },
  scroll: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  spacer: { height: 24 },
  loadCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadText: { marginTop: 16, fontSize: 14 },
  errorBar: { marginHorizontal: 16, borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statBox: { flex: 1, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1 },
  statIcon: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  statVal: { fontSize: 16, fontWeight: '700' },
  statLbl: { fontSize: 9 },
  claimBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 14 },
  claimGrad: { padding: 16, flexDirection: 'row', alignItems: 'center' },
  claimIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  claimTitle: { fontSize: 14, fontWeight: '700', color: '#FFF', marginBottom: 2 },
  claimSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  claimAction: { backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  claimActionText: { fontSize: 12, fontWeight: '700' },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  filterBtn: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  filterText: { fontSize: 12, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  mysteryCard: { width: (width - 42) / 2, height: 220, borderRadius: 16, overflow: 'hidden', borderWidth: 2 },
  mysteryImg: { width: '100%', height: '100%', position: 'absolute' },
  mysteryContent: { flex: 1, justifyContent: 'space-between', padding: 12 },
  priceTag: { alignSelf: 'flex-end', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  priceText: { fontSize: 11, fontWeight: '800', color: '#0F172A' },
  mysteryTitle: { fontSize: 15, fontWeight: '800', color: '#FFF', marginBottom: 8 },
  tapTag: { alignSelf: 'flex-start', backgroundColor: 'rgba(251,191,36,0.3)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  tapText: { fontSize: 10, fontWeight: '700' },
  heroCard: { width: (width - 42) / 2, height: 220, borderRadius: 16, overflow: 'hidden', borderWidth: 2, position: 'relative' },
  heroImg: { width: '100%', height: '100%', position: 'absolute' },
  countBadge: { position: 'absolute', top: 8, left: 8, zIndex: 10, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  countText: { fontSize: 12, fontWeight: '900', color: '#0F172A' },
  activeBadge: { position: 'absolute', top: 8, right: 8, zIndex: 10, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  activeText: { fontSize: 9, fontWeight: '800', color: '#FFF' },
  heroInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
  heroName: { fontSize: 15, fontWeight: '800', color: '#FFF', marginBottom: 8 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rarityTag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  rarityText: { fontSize: 11, fontWeight: '700' },
  scTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(251,191,36,0.15)', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6 },
  scText: { fontSize: 12, fontWeight: '700' },
  heroMetaRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  powerBadge: { position: 'absolute', top: 8, right: 8, zIndex: 10, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  powerBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFF' },
  powerBar: { height: 16, width: 60, borderRadius: 8, overflow: 'hidden', position: 'relative', justifyContent: 'center', alignItems: 'center' },
  powerBarFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 8 },
  powerText: { fontSize: 9, fontWeight: '800', zIndex: 1 },
  powerSection: { width: '100%', marginBottom: 16, padding: 12, borderRadius: 12 },
  powerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  powerLabel: { flex: 1, fontSize: 13, fontWeight: '600' },
  powerValue: { fontSize: 15, fontWeight: '700' },
  powerBarLarge: { height: 24, borderRadius: 12, overflow: 'hidden', marginBottom: 8 },
  powerBarFillLarge: { height: '100%', borderRadius: 12 },
  powerWarning: { fontSize: 11, fontWeight: '600', marginTop: 4, textAlign: 'center' },
  powerSubtext: { fontSize: 10, textAlign: 'center' },
  depletedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, width: '100%', justifyContent: 'center', marginBottom: 8 },
  depletedInfo: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  modalBg: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { borderRadius: 20, padding: 20, width: '100%', maxWidth: 340, alignItems: 'center', borderWidth: 1 },
  closeBtn: { position: 'absolute', top: 12, right: 12, zIndex: 10, padding: 6 },
  ownedBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 12 },
  ownedText: { fontSize: 12, fontWeight: '800', color: '#0F172A' },
  modalImg: { width: 140, height: 140, borderRadius: 16, marginBottom: 16 },
  modalName: { fontSize: 20, fontWeight: '800', marginBottom: 10, textAlign: 'center' },
  tierTag: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, marginBottom: 12 },
  tierText: { fontSize: 12, fontWeight: '700' },
  desc: { fontSize: 12, textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  modalStats: { flexDirection: 'row', gap: 24, marginBottom: 16 },
  mStat: { alignItems: 'center' },
  mStatVal: { fontSize: 20, fontWeight: '700', marginTop: 6 },
  mStatLbl: { fontSize: 10, marginTop: 2 },
  activeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, width: '100%', justifyContent: 'center' },
  activeInfo: { fontSize: 12, fontWeight: '600' },
  deactBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, marginTop: 8, borderRadius: 8, borderWidth: 1, width: '100%' },
  deactText: { fontSize: 12, fontWeight: '600' },
  actBtn: { width: '100%', borderRadius: 10, overflow: 'hidden' },
  actGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 },
  actText: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  mysteryModal: { borderRadius: 20, padding: 20, width: '100%', maxWidth: 360, alignItems: 'center', borderWidth: 2 },
  diceImg: { width: 140, height: 120, marginBottom: 16 },
  mysteryTitleModal: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  mysteryDesc: { fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 24 },
  priceNum: { fontSize: 36, fontWeight: '900' },
  priceUnit: { fontSize: 14, fontWeight: '600' },
  openBtn: { width: '100%', borderRadius: 12, overflow: 'hidden' },
  openGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  openText: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  revealIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(251,191,36,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  revealTitle: { fontSize: 24, fontWeight: '800', marginBottom: 16 },
  revealImg: { width: 120, height: 120, borderRadius: 16, marginBottom: 12 },
  revealName: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  revealTag: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, marginBottom: 12 },
  revealRarity: { fontSize: 12, fontWeight: '700' },
  revealSc: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, marginBottom: 20 },
  revealScText: { fontSize: 16, fontWeight: '700' },
  awesomeBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  awesomeText: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  revealCounter: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 12 },
  revealCounterText: { fontSize: 12, fontWeight: '700', color: '#0F172A' },
  packagesContainer: { flexDirection: 'row', gap: 10, marginBottom: 20, width: '100%' },
  packageCard: { flex: 1, borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 2, position: 'relative' },
  packageCardSelected: { borderWidth: 2 },
  popularBadge: { position: 'absolute', top: -10, left: '50%', marginLeft: -32, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, zIndex: 10 },
  popularText: { fontSize: 8, fontWeight: '800', color: '#FFF' },
  bonusBadge: { marginBottom: 6, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  bonusText: { fontSize: 9, fontWeight: '700' },
  packageIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  packageLabel: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  packagePrice: { fontSize: 16, fontWeight: '800' },
  selectedCheck: { position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  claimModal: { borderRadius: 20, padding: 28, alignItems: 'center', maxWidth: 300, borderWidth: 1 },
  claimModalIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(251,191,36,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  claimModalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 10 },
  claimModalSub: { fontSize: 12, textAlign: 'center', lineHeight: 18, marginBottom: 20 },
});
