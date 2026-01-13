import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Modal, Dimensions, Animated, ImageSourcePropType, ImageStyle, StyleProp, ImageBackground } from 'react-native';

const { width, height } = Dimensions.get('window');
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useGame } from '@/contexts/GameContext';
import { useTheme } from '@/contexts/ThemeContext';
import { StackedHero, HeroWithRarity } from '@/types/database';
import { Zap, Coins, Gift, X, Sparkles, Check, Layers, Flame } from 'lucide-react-native';
import { getHeroImageSource } from '@/lib/heroImages';

const backgroundImage = require('@/assets/home_bg.jpg');
const goldenDice = require('@/assets/golden_dice.png');

type FilterTab = 'all' | 'active' | 'inactive';

const SkeletonImage = ({ source, style, resizeMode = 'cover' }: { source: ImageSourcePropType; style: StyleProp<ImageStyle>; resizeMode?: 'cover' | 'contain' }) => {
  const [loaded, setLoaded] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const { theme } = useTheme();

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
    <View style={[style as any, { backgroundColor: theme.colors.surface, overflow: 'hidden' }]}>
      {!loaded && (
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.textMuted, opacity: pulseAnim }]}>
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
  const { theme, isDark } = useTheme();
  const { openMystery } = useLocalSearchParams<{ openMystery?: string }>();
  const [claiming, setClaiming] = useState(false);
  const [activating, setActivating] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState<string | null>(null);
  const [selectedStack, setSelectedStack] = useState<StackedHero | null>(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [showMysteryModal, setShowMysteryModal] = useState(false);
  const [purchasingMystery, setPurchasingMystery] = useState(false);
  const [revealedHero, setRevealedHero] = useState<HeroWithRarity | null>(null);

  useEffect(() => {
    if (openMystery === 'true') {
      setShowMysteryModal(true);
    }
  }, [openMystery]);

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
      <ImageBackground source={backgroundImage} style={{ flex: 1, width, height }} resizeMode="cover">
        <View style={{ flex: 1, backgroundColor: isDark ? 'rgba(10, 15, 30, 0.85)' : 'rgba(248, 250, 252, 0.70)' }}>
          <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={{ color: theme.colors.textSecondary, marginTop: 16, fontSize: 14 }}>Loading heroes...</Text>
          </SafeAreaView>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={backgroundImage} style={{ flex: 1, width, height }} resizeMode="cover">
      <View style={{ flex: 1, backgroundColor: isDark ? 'rgba(10, 15, 30, 0.85)' : 'rgba(248, 250, 252, 0.70)' }}>
        <SafeAreaView style={{ flex: 1 }}>
        {error && (
          <View style={{ marginHorizontal: 16, backgroundColor: theme.colors.errorLight, borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: `${theme.colors.error}50` }}>
            <Text style={{ color: theme.colors.error, fontSize: 14, textAlign: 'center' }}>{error}</Text>
          </View>
        )}

        <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 12 }} showsVerticalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
            <View style={{ flex: 1, backgroundColor: theme.colors.card, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.primary }}>
              <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(251, 191, 36, 0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
                <Layers color={theme.colors.primary} size={16} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.text }}>{totalHeroCount}</Text>
              <Text style={{ fontSize: 9, color: theme.colors.textSecondary }}>Total</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: theme.colors.card, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.success }}>
              <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: theme.colors.successLight, justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
                <Zap color={theme.colors.success} size={16} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.text }}>{activeHeroCount}</Text>
              <Text style={{ fontSize: 9, color: theme.colors.textSecondary }}>Active</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: theme.colors.card, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.purple }}>
              <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: theme.colors.purpleLight, justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
                <Flame color={theme.colors.purple} size={16} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.text }}>{totalPower}</Text>
              <Text style={{ fontSize: 9, color: theme.colors.textSecondary }}>Power</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: theme.colors.card, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.info }}>
              <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: theme.colors.infoLight, justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
                <Coins color={theme.colors.info} size={16} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.text }}>{totalEarningRate}</Text>
              <Text style={{ fontSize: 9, color: theme.colors.textSecondary }}>SC/hr</Text>
            </View>
          </View>

          {canClaimFreeHero && (
            <TouchableOpacity style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 14 }} onPress={handleClaimFreeHero} disabled={claiming}>
              <LinearGradient colors={theme.gradients.success} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <Gift color="#FFFFFF" size={28} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 }}>Claim Your Free Hero!</Text>
                    <Text style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.8)' }}>Start earning SuperCash now</Text>
                  </View>
                  <View style={{ backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 }}>
                    {claiming ? <ActivityIndicator color={theme.colors.success} /> : <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.success }}>CLAIM</Text>}
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
            {(['all', 'active', 'inactive'] as FilterTab[]).map((filter) => {
              const count = filter === 'all' ? stackedHeroes.length : filter === 'active' ? stackedHeroes.filter(s => s.isAnyActive).length : stackedHeroes.filter(s => !s.isAnyActive).length;
              const label = filter === 'all' ? 'All' : filter === 'active' ? 'Active' : 'Idle';
              return (
                <TouchableOpacity
                  key={filter}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    paddingHorizontal: 8,
                    backgroundColor: activeFilter === filter ? 'rgba(251, 191, 36, 0.15)' : theme.colors.card,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: activeFilter === filter ? theme.colors.primary : theme.colors.cardBorder,
                    alignItems: 'center',
                  }}
                  onPress={() => setActiveFilter(filter)}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: activeFilter === filter ? theme.colors.primary : theme.colors.textMuted }}>
                    {label} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
            <TouchableOpacity
              style={{ width: (width - 42) / 2, height: 220, borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: theme.colors.primary }}
              onPress={() => setShowMysteryModal(true)}
              activeOpacity={0.85}
            >
              <Image source={goldenDice} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} resizeMode="cover" />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} locations={[0.3, 1]} style={StyleSheet.absoluteFillObject} />
              <View style={{ flex: 1, justifyContent: 'space-between', padding: 12 }}>
                <View style={{ alignSelf: 'flex-end', backgroundColor: theme.colors.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#0F172A' }}>$4.99</Text>
                </View>
                <View style={{ flex: 1 }} />
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#FFFFFF', marginBottom: 8, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>Mystery Box</Text>
                  <View style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(251,191,36,0.3)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: theme.colors.primary }}>TAP TO OPEN</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>

            {filteredStacks.map(stack => (
              <TouchableOpacity
                key={stack.hero_id}
                style={{
                  width: (width - 42) / 2,
                  height: 220,
                  backgroundColor: theme.colors.card,
                  borderRadius: 16,
                  overflow: 'hidden',
                  borderWidth: 2,
                  borderColor: stack.isAnyRevealed ? (stack.isAnyActive ? stack.hero.hero_rarities.color_hex : theme.colors.cardBorder) : theme.colors.primary,
                  position: 'relative',
                }}
                onPress={() => setSelectedStack(stack)}
                activeOpacity={0.85}
              >
                <SkeletonImage source={getHeroImageSource(stack.hero.image_url)} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />
                <LinearGradient colors={theme.gradients.hero} locations={[0.1, 1]} style={StyleSheet.absoluteFillObject} />
                {stack.count > 1 && (
                  <View style={{ position: 'absolute', top: 8, left: 8, zIndex: 10, backgroundColor: theme.colors.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                    <Text style={{ fontSize: 12, fontWeight: '900', color: '#0F172A' }}>{stack.count}X</Text>
                  </View>
                )}
                {stack.isAnyActive && stack.isAnyRevealed && (
                  <View style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.colors.success, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 }}>
                    <Sparkles color="#FFFFFF" size={10} />
                    <Text style={{ fontSize: 9, fontWeight: '800', color: '#FFFFFF' }}>ACTIVE</Text>
                  </View>
                )}
                <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#FFFFFF', marginBottom: 8, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }} numberOfLines={1}>
                    {stack.isAnyRevealed ? stack.hero.name : '???'}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: stack.isAnyRevealed ? stack.hero.hero_rarities.color_hex + '25' : 'rgba(251, 191, 36, 0.2)' }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: stack.isAnyRevealed ? stack.hero.hero_rarities.color_hex : theme.colors.primary }}>
                        {stack.isAnyRevealed ? stack.hero.hero_rarities.name : '???'}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(251, 191, 36, 0.15)', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6 }}>
                      <Coins color={theme.colors.primary} size={14} />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.primary }}>
                        {stack.isAnyRevealed ? `${stack.hero.hero_rarities.supercash_per_hour}/hr` : '???'}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>

        <Modal visible={!!selectedStack} transparent animationType="fade" onRequestClose={() => setSelectedStack(null)}>
          {selectedStack && (
            <View style={{ flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
              <View style={{ backgroundColor: theme.colors.modalBackground, borderRadius: 20, padding: 20, width: '100%', maxWidth: 340, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.cardBorder }}>
                <TouchableOpacity style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, padding: 6 }} onPress={() => setSelectedStack(null)}>
                  <X color={theme.colors.textSecondary} size={24} />
                </TouchableOpacity>
                {selectedStack.count > 1 && (
                  <View style={{ backgroundColor: theme.colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 12 }}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#0F172A' }}>{selectedStack.count}X OWNED</Text>
                  </View>
                )}
                <SkeletonImage source={getHeroImageSource(selectedStack.hero.image_url)} style={{ width: 140, height: 140, borderRadius: 16, marginBottom: 16 }} />
                <Text style={{ fontSize: 20, fontWeight: '800', color: theme.colors.text, marginBottom: 10, textAlign: 'center' }}>{selectedStack.hero.name}</Text>
                <View style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, marginBottom: 12, backgroundColor: selectedStack.hero.hero_rarities.color_hex + '20' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: selectedStack.hero.hero_rarities.color_hex }}>
                    {selectedStack.hero.hero_rarities.name} (Tier {selectedStack.hero.hero_rarities.tier})
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 18, marginBottom: 16 }}>{selectedStack.hero.hero_rarities.description}</Text>
                <View style={{ flexDirection: 'row', gap: 24, marginBottom: 16 }}>
                  <View style={{ alignItems: 'center' }}>
                    <Coins color={theme.colors.primary} size={20} />
                    <Text style={{ fontSize: 20, fontWeight: '700', color: theme.colors.text, marginTop: 6 }}>
                      {selectedStack.count > 1 ? `${selectedStack.count}×${selectedStack.hero.hero_rarities.supercash_per_hour}` : selectedStack.hero.hero_rarities.supercash_per_hour}
                    </Text>
                    <Text style={{ fontSize: 10, color: theme.colors.textSecondary, marginTop: 2 }}>SC/hr</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Flame color={theme.colors.purple} size={20} />
                    <Text style={{ fontSize: 20, fontWeight: '700', color: theme.colors.text, marginTop: 6 }}>
                      {selectedStack.count * selectedStack.hero.hero_rarities.supercash_per_hour * 10}
                    </Text>
                    <Text style={{ fontSize: 10, color: theme.colors.textSecondary, marginTop: 2 }}>Power</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Layers color={theme.colors.info} size={20} />
                    <Text style={{ fontSize: 20, fontWeight: '700', color: theme.colors.text, marginTop: 6 }}>
                      {selectedStack.activeCount}/{selectedStack.count}
                    </Text>
                    <Text style={{ fontSize: 10, color: theme.colors.textSecondary, marginTop: 2 }}>Active</Text>
                  </View>
                </View>
                {selectedStack.isAnyActive ? (
                  <>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.colors.successLight, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, width: '100%', justifyContent: 'center' }}>
                      <Check color={theme.colors.success} size={20} />
                      <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.success }}>{selectedStack.activeCount} of {selectedStack.count} Active & Earning</Text>
                    </View>
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, marginTop: 8, backgroundColor: theme.colors.errorLight, borderRadius: 8, borderWidth: 1, borderColor: `${theme.colors.error}50`, width: '100%' }}
                      onPress={() => handleDeactivateStack(selectedStack.hero_id)}
                      disabled={deactivating === selectedStack.hero_id}
                    >
                      {deactivating === selectedStack.hero_id ? <ActivityIndicator color={theme.colors.error} size="small" /> : (
                        <>
                          <Zap color={theme.colors.error} size={16} />
                          <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.error }}>Deactivate All</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={{ width: '100%', borderRadius: 10, overflow: 'hidden' }}
                    onPress={() => handleActivateStack(selectedStack.hero_id)}
                    disabled={activating === selectedStack.hero_id}
                  >
                    <LinearGradient colors={theme.gradients.primary} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 }}>
                      {activating === selectedStack.hero_id ? <ActivityIndicator color="#0F172A" /> : (
                        <>
                          <Zap color="#0F172A" size={20} />
                          <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>ACTIVATE ALL ({selectedStack.count})</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </Modal>

        <Modal visible={showMysteryModal} transparent animationType="fade" onRequestClose={handleCloseMysteryModal}>
          <View style={{ flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <View style={{ backgroundColor: theme.colors.modalBackground, borderRadius: 20, padding: 24, width: '100%', maxWidth: 320, alignItems: 'center', borderWidth: 2, borderColor: `${theme.colors.primary}66` }}>
              <TouchableOpacity style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, padding: 6 }} onPress={handleCloseMysteryModal}>
                <X color={theme.colors.textSecondary} size={24} />
              </TouchableOpacity>
              {revealedHero ? (
                <>
                  <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(251, 191, 36, 0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                    <Sparkles color={theme.colors.primary} size={48} />
                  </View>
                  <Text style={{ fontSize: 24, fontWeight: '800', color: theme.colors.text, marginBottom: 16 }}>Hero Obtained!</Text>
                  <SkeletonImage source={getHeroImageSource(revealedHero.image_url)} style={{ width: 120, height: 120, borderRadius: 16, marginBottom: 12 }} />
                  <Text style={{ fontSize: 20, fontWeight: '800', color: theme.colors.text, marginBottom: 8 }}>{revealedHero.name}</Text>
                  <View style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, marginBottom: 12, backgroundColor: revealedHero.hero_rarities.color_hex + '20' }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: revealedHero.hero_rarities.color_hex }}>{revealedHero.hero_rarities.name}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, marginBottom: 20 }}>
                    <Coins color={theme.colors.primary} size={16} />
                    <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.primary }}>{revealedHero.hero_rarities.supercash_per_hour} SC/hr</Text>
                  </View>
                  <TouchableOpacity style={{ backgroundColor: theme.colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 }} onPress={handleCloseMysteryModal}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>Awesome!</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Image source={goldenDice} style={{ width: 140, height: 120, marginBottom: 16 }} resizeMode="contain" />
                  <Text style={{ fontSize: 24, fontWeight: '800', color: theme.colors.text, marginBottom: 8 }}>Mystery Box</Text>
                  <Text style={{ fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 20 }}>
                    Get a random hero! Duplicates stack and multiply your SC earnings!
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 24 }}>
                    <Text style={{ fontSize: 36, fontWeight: '900', color: theme.colors.primary }}>$4.99</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.textSecondary }}>USD</Text>
                  </View>
                  <TouchableOpacity style={{ width: '100%', borderRadius: 12, overflow: 'hidden' }} onPress={handlePurchaseMysteryBox} disabled={purchasingMystery}>
                    <LinearGradient colors={theme.gradients.primary} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 }}>
                      {purchasingMystery ? <ActivityIndicator color="#0F172A" /> : (
                        <>
                          <Gift color="#0F172A" size={20} />
                          <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>OPEN MYSTERY BOX</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>

        <Modal visible={showClaimModal} transparent animationType="fade" onRequestClose={() => setShowClaimModal(false)}>
          <View style={{ flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <View style={{ backgroundColor: theme.colors.modalBackground, borderRadius: 20, padding: 28, alignItems: 'center', maxWidth: 300, borderWidth: 1, borderColor: theme.colors.cardBorder }}>
              <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(251, 191, 36, 0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                <Sparkles color={theme.colors.primary} size={48} />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '800', color: theme.colors.text, marginBottom: 10 }}>Hero Claimed!</Text>
              <Text style={{ fontSize: 12, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 18, marginBottom: 20 }}>
                You received {starterHero?.name}! Tap Activate to start earning SuperCash.
              </Text>
              <TouchableOpacity style={{ backgroundColor: theme.colors.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10 }} onPress={() => setShowClaimModal(false)}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>Awesome!</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}
