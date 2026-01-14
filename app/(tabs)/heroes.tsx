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
import { Zap, Coins, Gift, X, Sparkles, Check, Layers, Flame } from 'lucide-react-native';
import { getHeroImageSource } from '@/lib/heroImages';

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
  const [revealed, setRevealed] = useState<HeroWithRarity | null>(null);

  useEffect(() => { if (openMystery === 'true') setShowMystery(true); }, [openMystery]);

  const starter = allHeroes.find(h => h.is_starter);
  const canClaim = !profile?.has_claimed_free_hero && starter;
  const total = stackedHeroes.reduce((s, h) => s + h.count, 0);
  const active = stackedHeroes.reduce((s, h) => s + h.activeCount, 0);
  const power = stackedHeroes.reduce((s, h) => s + h.totalEarningRate * 10, 0);
  const earning = stackedHeroes.reduce((s, h) => s + h.totalEarningRate, 0);
  const filtered = stackedHeroes.filter(st => filter === 'all' ? true : filter === 'active' ? st.isAnyActive : !st.isAnyActive);

  const onClaim = async () => { setClaiming(true); if (await claimFreeHero()) setShowClaim(true); setClaiming(false); };
  const onActivate = async (id: string) => { setActivating(id); await activateAllCopies(id); setActivating(null); setSelected(null); };
  const onDeactivate = async (id: string) => { setDeactivating(id); await deactivateAllCopies(id); setDeactivating(null); setSelected(null); };
  const onPurchase = async () => { setPurchasing(true); const r = await purchaseMysteryBox(); setPurchasing(false); if (r.success && r.hero) setRevealed(r.hero); };
  const closeMystery = () => { setShowMystery(false); setRevealed(null); };

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
                <View style={s.mysteryContent}><View style={[s.priceTag, { backgroundColor: theme.colors.primary }]}><Text style={s.priceText}>$4.99</Text></View><View style={s.flex1} /><View><Text style={s.mysteryTitle}>Mystery Box</Text><View style={s.tapTag}><Text style={[s.tapText, { color: theme.colors.primary }]}>TAP TO OPEN</Text></View></View></View>
              </TouchableOpacity>
              {filtered.map(st => <HeroGridCard key={st.hero_id} stack={st} theme={theme} onPress={() => setSelected(st)} />)}
            </View>
            <View style={s.spacer} />
          </ScrollView>
          <HeroModal stack={selected} theme={theme} onClose={() => setSelected(null)} activating={activating} deactivating={deactivating} onActivate={onActivate} onDeactivate={onDeactivate} />
          <MysteryModal visible={showMystery} theme={theme} revealed={revealed} purchasing={purchasing} onPurchase={onPurchase} onClose={closeMystery} />
          <ClaimModal visible={showClaim} theme={theme} hero={starter} onClose={() => setShowClaim(false)} />
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const StatBox = ({ icon: Icon, color, value, label, theme }: any) => (
  <View style={[s.statBox, { backgroundColor: theme.colors.card, borderColor: color }]}><View style={[s.statIcon, { backgroundColor: `${color}20` }]}><Icon color={color} size={16} /></View><Text style={[s.statVal, { color: theme.colors.text }]}>{value}</Text><Text style={[s.statLbl, { color: theme.colors.textSecondary }]}>{label}</Text></View>
);

const HeroGridCard = ({ stack, theme, onPress }: any) => (
  <TouchableOpacity style={[s.heroCard, { backgroundColor: theme.colors.card, borderColor: stack.isAnyRevealed ? (stack.isAnyActive ? stack.hero.hero_rarities.color_hex : theme.colors.cardBorder) : theme.colors.primary }]} onPress={onPress} activeOpacity={0.85}>
    <SkeletonImage source={getHeroImageSource(stack.hero.image_url)} style={s.heroImg} /><LinearGradient colors={theme.gradients.hero} locations={[0.1, 1]} style={StyleSheet.absoluteFillObject} />
    {stack.count > 1 && <View style={[s.countBadge, { backgroundColor: theme.colors.primary }]}><Text style={s.countText}>{stack.count}X</Text></View>}
    {stack.isAnyActive && stack.isAnyRevealed && <View style={[s.activeBadge, { backgroundColor: theme.colors.success }]}><Sparkles color="#FFF" size={10} /><Text style={s.activeText}>ACTIVE</Text></View>}
    <View style={s.heroInfo}><Text style={s.heroName} numberOfLines={1}>{stack.isAnyRevealed ? stack.hero.name : '???'}</Text><View style={s.heroMeta}><View style={[s.rarityTag, { backgroundColor: stack.isAnyRevealed ? stack.hero.hero_rarities.color_hex + '25' : 'rgba(251,191,36,0.2)' }]}><Text style={[s.rarityText, { color: stack.isAnyRevealed ? stack.hero.hero_rarities.color_hex : theme.colors.primary }]}>{stack.isAnyRevealed ? stack.hero.hero_rarities.name : '???'}</Text></View><View style={s.scTag}><Coins color={theme.colors.primary} size={14} /><Text style={[s.scText, { color: theme.colors.primary }]}>{stack.isAnyRevealed ? `${stack.hero.hero_rarities.supercash_per_hour}/hr` : '???'}</Text></View></View></View>
  </TouchableOpacity>
);

const HeroModal = ({ stack, theme, onClose, activating, deactivating, onActivate, onDeactivate }: any) => (
  <Modal visible={!!stack} transparent animationType="fade" onRequestClose={onClose}>{stack && (
    <View style={[s.modalBg, { backgroundColor: theme.colors.overlay }]}><View style={[s.modalCard, { backgroundColor: theme.colors.modalBackground, borderColor: theme.colors.cardBorder }]}>
      <TouchableOpacity style={s.closeBtn} onPress={onClose}><X color={theme.colors.textSecondary} size={24} /></TouchableOpacity>
      {stack.count > 1 && <View style={[s.ownedBadge, { backgroundColor: theme.colors.primary }]}><Text style={s.ownedText}>{stack.count}X OWNED</Text></View>}
      <SkeletonImage source={getHeroImageSource(stack.hero.image_url)} style={s.modalImg} />
      <Text style={[s.modalName, { color: theme.colors.text }]}>{stack.hero.name}</Text>
      <View style={[s.tierTag, { backgroundColor: stack.hero.hero_rarities.color_hex + '20' }]}><Text style={[s.tierText, { color: stack.hero.hero_rarities.color_hex }]}>{stack.hero.hero_rarities.name} (Tier {stack.hero.hero_rarities.tier})</Text></View>
      <Text style={[s.desc, { color: theme.colors.textSecondary }]}>{stack.hero.hero_rarities.description}</Text>
      <View style={s.modalStats}><ModalStat icon={Coins} color={theme.colors.primary} value={stack.count > 1 ? `${stack.count}×${stack.hero.hero_rarities.supercash_per_hour}` : stack.hero.hero_rarities.supercash_per_hour} label="SC/hr" theme={theme} /><ModalStat icon={Flame} color={theme.colors.purple} value={stack.count * stack.hero.hero_rarities.supercash_per_hour * 10} label="Power" theme={theme} /><ModalStat icon={Layers} color={theme.colors.info} value={`${stack.activeCount}/${stack.count}`} label="Active" theme={theme} /></View>
      {stack.isAnyActive ? (<><View style={[s.activeRow, { backgroundColor: theme.colors.successLight }]}><Check color={theme.colors.success} size={20} /><Text style={[s.activeInfo, { color: theme.colors.success }]}>{stack.activeCount} of {stack.count} Active & Earning</Text></View><TouchableOpacity style={[s.deactBtn, { backgroundColor: theme.colors.errorLight, borderColor: `${theme.colors.error}50` }]} onPress={() => onDeactivate(stack.hero_id)} disabled={deactivating === stack.hero_id}>{deactivating === stack.hero_id ? <ActivityIndicator color={theme.colors.error} size="small" /> : <><Zap color={theme.colors.error} size={16} /><Text style={[s.deactText, { color: theme.colors.error }]}>Deactivate All</Text></>}</TouchableOpacity></>) : (
        <TouchableOpacity style={s.actBtn} onPress={() => onActivate(stack.hero_id)} disabled={activating === stack.hero_id}><LinearGradient colors={theme.gradients.primary} style={s.actGrad}>{activating === stack.hero_id ? <ActivityIndicator color="#0F172A" /> : <><Zap color="#0F172A" size={20} /><Text style={s.actText}>ACTIVATE ALL ({stack.count})</Text></>}</LinearGradient></TouchableOpacity>
      )}
    </View></View>
  )}</Modal>
);

const ModalStat = ({ icon: Icon, color, value, label, theme }: any) => (
  <View style={s.mStat}><Icon color={color} size={20} /><Text style={[s.mStatVal, { color: theme.colors.text }]}>{value}</Text><Text style={[s.mStatLbl, { color: theme.colors.textSecondary }]}>{label}</Text></View>
);

const MysteryModal = ({ visible, theme, revealed, purchasing, onPurchase, onClose }: any) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}><View style={[s.modalBg, { backgroundColor: theme.colors.overlay }]}><View style={[s.mysteryModal, { backgroundColor: theme.colors.modalBackground, borderColor: `${theme.colors.primary}66` }]}>
    <TouchableOpacity style={s.closeBtn} onPress={onClose}><X color={theme.colors.textSecondary} size={24} /></TouchableOpacity>
    {revealed ? (<><View style={s.revealIcon}><Sparkles color={theme.colors.primary} size={48} /></View><Text style={[s.revealTitle, { color: theme.colors.text }]}>Hero Obtained!</Text><SkeletonImage source={getHeroImageSource(revealed.image_url)} style={s.revealImg} /><Text style={[s.revealName, { color: theme.colors.text }]}>{revealed.name}</Text><View style={[s.revealTag, { backgroundColor: revealed.hero_rarities.color_hex + '20' }]}><Text style={[s.revealRarity, { color: revealed.hero_rarities.color_hex }]}>{revealed.hero_rarities.name}</Text></View><View style={s.revealSc}><Coins color={theme.colors.primary} size={16} /><Text style={[s.revealScText, { color: theme.colors.primary }]}>{revealed.hero_rarities.supercash_per_hour} SC/hr</Text></View><TouchableOpacity style={[s.awesomeBtn, { backgroundColor: theme.colors.primary }]} onPress={onClose}><Text style={s.awesomeText}>Awesome!</Text></TouchableOpacity></>) : (
      <><Image source={DICE} style={s.diceImg} resizeMode="contain" /><Text style={[s.mysteryTitleModal, { color: theme.colors.text }]}>Mystery Box</Text><Text style={[s.mysteryDesc, { color: theme.colors.textSecondary }]}>Get a random hero! Duplicates stack and multiply your SC earnings!</Text><View style={s.priceRow}><Text style={[s.priceNum, { color: theme.colors.primary }]}>$4.99</Text><Text style={[s.priceUnit, { color: theme.colors.textSecondary }]}>USD</Text></View><TouchableOpacity style={s.openBtn} onPress={onPurchase} disabled={purchasing}><LinearGradient colors={theme.gradients.primary} style={s.openGrad}>{purchasing ? <ActivityIndicator color="#0F172A" /> : <><Gift color="#0F172A" size={20} /><Text style={s.openText}>OPEN MYSTERY BOX</Text></>}</LinearGradient></TouchableOpacity></>
    )}
  </View></View></Modal>
);

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
  mysteryModal: { borderRadius: 20, padding: 24, width: '100%', maxWidth: 320, alignItems: 'center', borderWidth: 2 },
  diceImg: { width: 140, height: 120, marginBottom: 16 },
  mysteryTitleModal: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  mysteryDesc: { fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 24 },
  priceNum: { fontSize: 36, fontWeight: '900' },
  priceUnit: { fontSize: 14, fontWeight: '600' },
  openBtn: { width: '100%', borderRadius: 12, overflow: 'hidden' },
  openGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  openText: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
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
  claimModal: { borderRadius: 20, padding: 28, alignItems: 'center', maxWidth: 300, borderWidth: 1 },
  claimModalIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(251,191,36,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  claimModalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 10 },
  claimModalSub: { fontSize: 12, textAlign: 'center', lineHeight: 18, marginBottom: 20 },
});
