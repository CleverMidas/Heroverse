import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Modal, ImageBackground, Dimensions, Animated, ImageSourcePropType, ImageStyle, StyleProp } from 'react-native';

const { width, height } = Dimensions.get('window');
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useGame } from '@/contexts/GameContext';
import { StackedHero, HeroWithRarity } from '@/types/database';
import { Zap, Coins, Gift, X, Sparkles, Check, Layers, Flame, Package } from 'lucide-react-native';
import { getHeroImageSource } from '@/lib/heroImages';

type FilterTab = 'all' | 'active' | 'inactive';

const SkeletonImage = ({ source, style, resizeMode = 'cover' }: { source: ImageSourcePropType; style: StyleProp<ImageStyle>; resizeMode?: 'cover' | 'contain' }) => {
  const [loaded, setLoaded] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.5, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    if (!loaded) pulse.start();
    return () => pulse.stop();
  }, [loaded, pulseAnim]);

  return (
    <View style={[style as any, { backgroundColor: '#1E293B', overflow: 'hidden' }]}>  
      {!loaded && (
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#475569', opacity: pulseAnim }]}>
          <LinearGradient colors={['transparent', 'rgba(255,255,255,0.1)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[StyleSheet.absoluteFill]} />
        </Animated.View>
      )}
      <Image source={source} style={[{ width: '100%', height: '100%' }, !loaded && { position: 'absolute', opacity: 0 }]} resizeMode={resizeMode} onLoad={() => setLoaded(true)} />
    </View>
  );
};

export default function HeroesScreen() {
  const { profile } = useAuth();
  const { stackedHeroes, allHeroes, claimFreeHero, activateAllCopies, deactivateAllCopies, purchaseMysteryBox, loading, error } = useGame();
  const [claiming, setClaiming] = useState(false);
  const [activating, setActivating] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState<string | null>(null);
  const [selectedStack, setSelectedStack] = useState<StackedHero | null>(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [showMysteryModal, setShowMysteryModal] = useState(false);
  const [purchasingMystery, setPurchasingMystery] = useState(false);
  const [revealedHero, setRevealedHero] = useState<HeroWithRarity | null>(null);

  const starterHero = allHeroes.find(h => h.is_starter);
  const canClaimFreeHero = !profile?.has_claimed_free_hero && starterHero;

  const totalHeroCount = stackedHeroes.reduce((sum, s) => sum + s.count, 0);
  const activeHeroCount = stackedHeroes.reduce((sum, s) => sum + s.activeCount, 0);
  const totalPower = stackedHeroes.reduce((sum, s) => sum + s.totalEarningRate * 10, 0);
  const totalEarningRate = stackedHeroes.reduce((sum, s) => sum + s.totalEarningRate, 0);

  const filteredStacks = stackedHeroes.filter(stack => {
    switch (activeFilter) {
      case 'active': return stack.isAnyActive;
      case 'inactive': return !stack.isAnyActive;
      default: return true;
    }
  });

  const handleClaimFreeHero = async () => {
    setClaiming(true);
    const success = await claimFreeHero();
    setClaiming(false);
    if (success) setShowClaimModal(true);
  };

  const handleActivateStack = async (heroId: string) => {
    setActivating(heroId);
    await activateAllCopies(heroId);
    setActivating(null);
    setSelectedStack(null);
  };

  const handleDeactivateStack = async (heroId: string) => {
    setDeactivating(heroId);
    await deactivateAllCopies(heroId);
    setDeactivating(null);
    setSelectedStack(null);
  };

  const handlePurchaseMysteryBox = async () => {
    setPurchasingMystery(true);
    const result = await purchaseMysteryBox();
    setPurchasingMystery(false);
    if (result.success && result.hero) {
      setRevealedHero(result.hero);
    }
  };

  const handleCloseMysteryModal = () => {
    setShowMysteryModal(false);
    setRevealedHero(null);
  };

  if (loading) {
    return (
      <ImageBackground source={require('@/assets/home_bg.jpg')} style={styles.container} resizeMode="cover">
        <View style={styles.overlay}>
          <SafeAreaView style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FBBF24" />
            <Text style={styles.loadingText}>Loading heroes...</Text>
          </SafeAreaView>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={require('@/assets/home_bg.jpg')} style={styles.container} resizeMode="cover">
      <View style={styles.overlay}>
      <SafeAreaView style={styles.safeArea}>
        {error && <View style={styles.errorContainer}><Text style={styles.errorText}>{error}</Text></View>}

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.statsRow}>
            <View style={styles.statCardMini}>
              <View style={[styles.statIconMini, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}><Layers color="#FBBF24" size={16} /></View>
              <Text style={styles.statValueMini}>{totalHeroCount}</Text>
              <Text style={styles.statLabelMini}>Total</Text>
            </View>
            <View style={styles.statCardMini}>
              <View style={[styles.statIconMini, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}><Zap color="#22C55E" size={16} /></View>
              <Text style={styles.statValueMini}>{activeHeroCount}</Text>
              <Text style={styles.statLabelMini}>Active</Text>
            </View>
            <View style={styles.statCardMini}>
              <View style={[styles.statIconMini, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}><Flame color="#8B5CF6" size={16} /></View>
              <Text style={styles.statValueMini}>{totalPower}</Text>
              <Text style={styles.statLabelMini}>Power</Text>
            </View>
            <View style={styles.statCardMini}>
              <View style={[styles.statIconMini, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}><Coins color="#3B82F6" size={16} /></View>
              <Text style={styles.statValueMini}>{totalEarningRate}</Text>
              <Text style={styles.statLabelMini}>SC/hr</Text>
            </View>
          </View>

          {canClaimFreeHero && (
            <TouchableOpacity style={styles.claimCard} onPress={handleClaimFreeHero} disabled={claiming}>
              <LinearGradient colors={['#22C55E', '#16A34A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.claimGradient}>
                <View style={styles.claimContent}>
                  <View style={styles.claimIconContainer}><Gift color="#FFFFFF" size={28} /></View>
                  <View style={styles.claimTextContainer}>
                    <Text style={styles.claimTitle}>Claim Your Free Hero!</Text>
                    <Text style={styles.claimDescription}>Start earning SuperCash now</Text>
                  </View>
                  <View style={styles.claimButton}>
                    {claiming ? <ActivityIndicator color="#22C55E" /> : <Text style={styles.claimButtonText}>CLAIM</Text>}
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          <View style={styles.filterTabs}>
            <TouchableOpacity style={[styles.filterTab, activeFilter === 'all' && styles.filterTabActive]} onPress={() => setActiveFilter('all')}>
              <Text style={[styles.filterTabText, activeFilter === 'all' && styles.filterTabTextActive]}>All ({stackedHeroes.length})</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.filterTab, activeFilter === 'active' && styles.filterTabActive]} onPress={() => setActiveFilter('active')}>
              <Text style={[styles.filterTabText, activeFilter === 'active' && styles.filterTabTextActive]}>Active ({stackedHeroes.filter(s => s.isAnyActive).length})</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.filterTab, activeFilter === 'inactive' && styles.filterTabActive]} onPress={() => setActiveFilter('inactive')}>
              <Text style={[styles.filterTabText, activeFilter === 'inactive' && styles.filterTabTextActive]}>Idle ({stackedHeroes.filter(s => !s.isAnyActive).length})</Text>
            </TouchableOpacity>
          </View>

            <View style={styles.heroesGrid}>
            <TouchableOpacity style={styles.mysteryCard} onPress={() => setShowMysteryModal(true)} activeOpacity={0.85}>
              <ImageBackground source={require('@/assets/mysterybox_bg.jpg')} style={styles.mysteryCardBg} resizeMode="cover">
                <View style={styles.mysteryCardOverlay}>
                  <View style={styles.mysteryCardPriceBadge}><Text style={styles.mysteryCardPriceText}>$4.99</Text></View>
                  <View style={styles.mysteryCardBottom}>
                    <Text style={styles.mysteryCardTitle}>Mystery Box</Text>
                    <View style={styles.mysteryCardRarity}><Text style={styles.mysteryCardRarityText}>TAP TO OPEN</Text></View>
                    </View>
                    </View>
              </ImageBackground>
            </TouchableOpacity>
            {filteredStacks.map(stack => (
                <TouchableOpacity key={stack.hero_id} style={[styles.heroCard, { borderColor: stack.isAnyRevealed ? stack.isAnyActive ? stack.hero.hero_rarities.color_hex : 'rgba(100, 116, 139, 0.3)' : '#FBBF24' }]} onPress={() => setSelectedStack(stack)}>
                  {stack.count > 1 && <View style={styles.countBadge}><Text style={styles.countBadgeText}>{stack.count}X</Text></View>}
                  {stack.isAnyActive && stack.isAnyRevealed && <View style={styles.activeBadge}><Sparkles color="#FFFFFF" size={10} /><Text style={styles.activeBadgeText}>ACTIVE</Text></View>}
                  <SkeletonImage source={getHeroImageSource(stack.hero.image_url)} style={styles.heroImage} />
                  <View style={styles.heroInfo}>
                    <Text style={styles.heroName} numberOfLines={1}>{stack.isAnyRevealed ? stack.hero.name : '???'}</Text>
                    <View style={[styles.rarityBadge, { backgroundColor: stack.isAnyRevealed ? stack.hero.hero_rarities.color_hex + '20' : 'rgba(251, 191, 36, 0.2)' }]}>
                      <Text style={[styles.rarityText, { color: stack.isAnyRevealed ? stack.hero.hero_rarities.color_hex : '#FBBF24' }]}>{stack.isAnyRevealed ? stack.hero.hero_rarities.name : '???'}</Text>
                    </View>
                    <View style={styles.heroStats}>
                      <Coins color="#FBBF24" size={12} />
                      <Text style={styles.heroStatsText}>{stack.isAnyRevealed ? stack.count > 1 ? `${stack.count}×${stack.hero.hero_rarities.supercash_per_hour}/hr` : `${stack.hero.hero_rarities.supercash_per_hour}/hr` : '???'}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        <Modal visible={!!selectedStack} transparent animationType="fade" onRequestClose={() => setSelectedStack(null)}>
          {selectedStack && (
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedStack(null)}><X color="#94A3B8" size={24} /></TouchableOpacity>
                {selectedStack.count > 1 && <View style={styles.modalCountBadge}><Text style={styles.modalCountBadgeText}>{selectedStack.count}X OWNED</Text></View>}
                <SkeletonImage source={getHeroImageSource(selectedStack.hero.image_url)} style={styles.modalImage} />
                <Text style={styles.modalHeroName}>{selectedStack.hero.name}</Text>
                <View style={[styles.modalRarityBadge, { backgroundColor: selectedStack.hero.hero_rarities.color_hex + '20' }]}>
                  <Text style={[styles.modalRarityText, { color: selectedStack.hero.hero_rarities.color_hex }]}>{selectedStack.hero.hero_rarities.name} (Tier {selectedStack.hero.hero_rarities.tier})</Text>
                  </View>
                <Text style={styles.modalDescription}>{selectedStack.hero.hero_rarities.description}</Text>
                    <View style={styles.modalStats}>
                  <View style={styles.modalStatItem}><Coins color="#FBBF24" size={20} /><Text style={styles.modalStatValue}>{selectedStack.count > 1 ? `${selectedStack.count}×${selectedStack.hero.hero_rarities.supercash_per_hour}` : selectedStack.hero.hero_rarities.supercash_per_hour}</Text><Text style={styles.modalStatLabel}>SC/hr</Text></View>
                  <View style={styles.modalStatItem}><Flame color="#8B5CF6" size={20} /><Text style={styles.modalStatValue}>{selectedStack.count * selectedStack.hero.hero_rarities.supercash_per_hour * 10}</Text><Text style={styles.modalStatLabel}>Power</Text></View>
                  <View style={styles.modalStatItem}><Layers color="#3B82F6" size={20} /><Text style={styles.modalStatValue}>{selectedStack.activeCount}/{selectedStack.count}</Text><Text style={styles.modalStatLabel}>Active</Text></View>
                      </View>
                {selectedStack.isAnyActive ? (
                  <>
                    <View style={styles.activeStatus}><Check color="#22C55E" size={20} /><Text style={styles.activeStatusText}>{selectedStack.activeCount} of {selectedStack.count} Active & Earning</Text></View>
                    <TouchableOpacity style={styles.deactivateButton} onPress={() => handleDeactivateStack(selectedStack.hero_id)} disabled={deactivating === selectedStack.hero_id}>
                      {deactivating === selectedStack.hero_id ? <ActivityIndicator color="#EF4444" size="small" /> : <><Zap color="#EF4444" size={16} /><Text style={styles.deactivateButtonText}>Deactivate All</Text></>}
                        </TouchableOpacity>
                      </>
                    ) : (
                  <TouchableOpacity style={styles.activateButton} onPress={() => handleActivateStack(selectedStack.hero_id)} disabled={activating === selectedStack.hero_id}>
                    <LinearGradient colors={['#FBBF24', '#F59E0B']} style={styles.activateGradient}>
                      {activating === selectedStack.hero_id ? <ActivityIndicator color="#0F172A" /> : <><Zap color="#0F172A" size={20} /><Text style={styles.activateButtonText}>ACTIVATE ALL ({selectedStack.count})</Text></>}
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
              </View>
            </View>
          )}
        </Modal>

        <Modal visible={showMysteryModal} transparent animationType="fade" onRequestClose={handleCloseMysteryModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.mysteryModalContent}>
              <TouchableOpacity style={styles.modalClose} onPress={handleCloseMysteryModal}><X color="#94A3B8" size={24} /></TouchableOpacity>
              {revealedHero ? (
                <>
                  <View style={styles.revealIcon}><Sparkles color="#FBBF24" size={48} /></View>
                  <Text style={styles.revealTitle}>Hero Obtained!</Text>
                  <SkeletonImage source={getHeroImageSource(revealedHero.image_url)} style={styles.revealImage} />
                  <Text style={styles.revealHeroName}>{revealedHero.name}</Text>
                  <View style={[styles.modalRarityBadge, { backgroundColor: revealedHero.hero_rarities.color_hex + '20' }]}>
                    <Text style={[styles.modalRarityText, { color: revealedHero.hero_rarities.color_hex }]}>{revealedHero.hero_rarities.name}</Text>
                    </View>
                  <View style={styles.revealStats}><Coins color="#FBBF24" size={16} /><Text style={styles.revealStatsText}>{revealedHero.hero_rarities.supercash_per_hour} SC/hr</Text></View>
                  <TouchableOpacity style={styles.revealCloseButton} onPress={handleCloseMysteryModal}><Text style={styles.revealCloseButtonText}>Awesome!</Text></TouchableOpacity>
                  </>
                ) : (
                  <>
                  <Image source={require('@/assets/golden_dice.png')} style={styles.mysteryModalImage} resizeMode="contain" />
                  <Text style={styles.mysteryTitle}>Mystery Box</Text>
                  <Text style={styles.mysteryDesc}>Get a random hero! Duplicates stack and multiply your SC earnings!</Text>
                  <View style={styles.mysteryPriceContainer}><Text style={styles.mysteryPrice}>$4.99</Text><Text style={styles.mysteryPriceCurrency}>USD</Text></View>
                  <TouchableOpacity style={styles.purchaseButton} onPress={handlePurchaseMysteryBox} disabled={purchasingMystery}>
                    <LinearGradient colors={['#FBBF24', '#F59E0B']} style={styles.purchaseGradient}>
                      {purchasingMystery ? <ActivityIndicator color="#0F172A" /> : <><Package color="#0F172A" size={20} /><Text style={styles.purchaseButtonText}>OPEN MYSTERY BOX</Text></>}
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
        </Modal>

        <Modal visible={showClaimModal} transparent animationType="fade" onRequestClose={() => setShowClaimModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.claimSuccessModal}>
              <View style={styles.claimSuccessIcon}><Sparkles color="#FBBF24" size={48} /></View>
              <Text style={styles.claimSuccessTitle}>Hero Claimed!</Text>
              <Text style={styles.claimSuccessText}>You received {starterHero?.name}! Tap Activate to start earning SuperCash.</Text>
              <TouchableOpacity style={styles.claimSuccessButton} onPress={() => setShowClaimModal(false)}><Text style={styles.claimSuccessButtonText}>Awesome!</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width, height },
  overlay: { flex: 1, backgroundColor: 'rgba(10, 15, 30, 0.75)' },
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#94A3B8', marginTop: 16, fontSize: 14 },
  errorContainer: { marginHorizontal: 16, backgroundColor: 'rgba(239, 68, 68, 0.15)', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
  errorText: { color: '#EF4444', fontSize: 14, textAlign: 'center' },
  scrollView: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statCardMini: { flex: 1, backgroundColor: 'rgba(30, 41, 59, 0.6)', borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(100, 116, 139, 0.2)' },
  statIconMini: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  statValueMini: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  statLabelMini: { fontSize: 9, color: '#94A3B8' },
  claimCard: { borderRadius: 14, overflow: 'hidden', marginBottom: 14 },
  claimGradient: { padding: 16 },
  claimContent: { flexDirection: 'row', alignItems: 'center' },
  claimIconContainer: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  claimTextContainer: { flex: 1 },
  claimTitle: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 },
  claimDescription: { fontSize: 11, color: 'rgba(255, 255, 255, 0.8)' },
  claimButton: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  claimButtonText: { fontSize: 12, fontWeight: '700', color: '#22C55E' },
  filterTabs: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  filterTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10, paddingHorizontal: 8, backgroundColor: 'rgba(30, 41, 59, 0.6)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(100, 116, 139, 0.2)' },
  filterTabActive: { backgroundColor: 'rgba(251, 191, 36, 0.15)', borderColor: '#FBBF24' },
  filterTabText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  filterTabTextActive: { color: '#FBBF24' },
  emptyState: { backgroundColor: 'rgba(30, 41, 59, 0.5)', borderRadius: 16, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(100, 116, 139, 0.2)' },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(100, 116, 139, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 6 },
  emptyText: { fontSize: 12, color: '#94A3B8', textAlign: 'center', lineHeight: 18 },
  heroesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  heroCard: { width: (width - 42) / 2, height: 240, backgroundColor: 'rgba(30, 41, 59, 0.8)', borderRadius: 14, overflow: 'hidden', borderWidth: 2 },
  countBadge: { position: 'absolute', top: 6, left: 6, zIndex: 10, backgroundColor: '#FBBF24', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  countBadgeText: { fontSize: 10, fontWeight: '800', color: '#0F172A' },
  activeBadge: { position: 'absolute', top: 6, right: 6, zIndex: 10, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#22C55E', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  activeBadgeText: { fontSize: 8, fontWeight: '700', color: '#FFFFFF' },
  heroImage: { width: '100%', height: 160 },
  heroInfo: { padding: 10 },
  heroName: { fontSize: 12, fontWeight: '700', color: '#FFFFFF', marginBottom: 6 },
  rarityBadge: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 5, marginBottom: 6 },
  rarityText: { fontSize: 9, fontWeight: '700' },
  heroStats: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  heroStatsText: { fontSize: 11, fontWeight: '600', color: '#FBBF24' },
  mysteryCard: { width: (width - 42) / 2, height: 240, borderRadius: 14, overflow: 'hidden', borderWidth: 2, borderColor: '#FBBF24', backgroundColor: '#0F172A' },
  mysteryCardBg: { width: '100%', height: '100%' },
  mysteryCardOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', padding: 8 },
  mysteryCardPriceBadge: { alignSelf: 'flex-end', backgroundColor: '#FBBF24', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  mysteryCardPriceText: { fontSize: 11, fontWeight: '800', color: '#0F172A' },
  mysteryCardBottom: { backgroundColor: 'rgba(0, 0, 0, 0.75)', borderRadius: 10, padding: 10 },
  mysteryCardTitle: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  mysteryCardRarity: { alignSelf: 'flex-start', backgroundColor: 'rgba(251,191,36,0.3)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  mysteryCardRarityText: { fontSize: 10, fontWeight: '700', color: '#FBBF24' },
  bottomSpacer: { height: 24 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1E293B', borderRadius: 20, padding: 20, width: '100%', maxWidth: 340, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(100, 116, 139, 0.3)' },
  modalClose: { position: 'absolute', top: 12, right: 12, zIndex: 10, padding: 6 },
  modalCountBadge: { backgroundColor: '#FBBF24', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 12 },
  modalCountBadgeText: { fontSize: 12, fontWeight: '800', color: '#0F172A' },
  modalImage: { width: 140, height: 140, borderRadius: 16, marginBottom: 16 },
  modalHeroName: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginBottom: 10, textAlign: 'center' },
  modalRarityBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, marginBottom: 12 },
  modalRarityText: { fontSize: 12, fontWeight: '700' },
  modalDescription: { fontSize: 12, color: '#94A3B8', textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  modalStats: { flexDirection: 'row', gap: 24, marginBottom: 16 },
  modalStatItem: { alignItems: 'center' },
  modalStatValue: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginTop: 6 },
  modalStatLabel: { fontSize: 10, color: '#94A3B8', marginTop: 2 },
  activeStatus: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(34, 197, 94, 0.15)', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, width: '100%', justifyContent: 'center' },
  activeStatusText: { fontSize: 12, fontWeight: '600', color: '#22C55E' },
  activateButton: { width: '100%', borderRadius: 10, overflow: 'hidden' },
  activateGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 },
  activateButtonText: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  deactivateButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, marginTop: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', width: '100%' },
  deactivateButtonText: { fontSize: 12, fontWeight: '600', color: '#EF4444' },
  mysteryModalContent: { backgroundColor: '#0F172A', borderRadius: 20, padding: 24, width: '100%', maxWidth: 320, alignItems: 'center', borderWidth: 2, borderColor: 'rgba(251, 191, 36, 0.4)' },
  mysteryModalImage: { width: 180, height: 140, marginBottom: 16 },
  mysteryTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
  mysteryDesc: { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  mysteryPriceContainer: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 24 },
  mysteryPrice: { fontSize: 36, fontWeight: '900', color: '#FBBF24' },
  mysteryPriceCurrency: { fontSize: 14, fontWeight: '600', color: '#94A3B8' },
  purchaseButton: { width: '100%', borderRadius: 12, overflow: 'hidden' },
  purchaseGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  purchaseButtonText: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  revealIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(251, 191, 36, 0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  revealTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginBottom: 16 },
  revealImage: { width: 120, height: 120, borderRadius: 16, marginBottom: 12 },
  revealHeroName: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
  revealStats: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, marginBottom: 20 },
  revealStatsText: { fontSize: 16, fontWeight: '700', color: '#FBBF24' },
  revealCloseButton: { backgroundColor: '#FBBF24', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  revealCloseButtonText: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  claimSuccessModal: { backgroundColor: '#1E293B', borderRadius: 20, padding: 28, alignItems: 'center', maxWidth: 300, borderWidth: 1, borderColor: 'rgba(100, 116, 139, 0.3)' },
  claimSuccessIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(251, 191, 36, 0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  claimSuccessTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginBottom: 10 },
  claimSuccessText: { fontSize: 12, color: '#94A3B8', textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  claimSuccessButton: { backgroundColor: '#FBBF24', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10 },
  claimSuccessButtonText: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
});
