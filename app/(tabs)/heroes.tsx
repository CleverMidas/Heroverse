import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
  ImageBackground,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useGame } from '@/contexts/GameContext';
import { UserHeroWithDetails } from '@/types/database';
import { Zap, Coins, Gift, X, Sparkles, Check, HelpCircle, Eye, Layers, Flame } from 'lucide-react-native';
import { getHeroImageSource } from '@/lib/heroImages';

type FilterTab = 'all' | 'active' | 'inactive';

export default function HeroesScreen() {
  const { profile } = useAuth();
  const { userHeroes, allHeroes, claimFreeHero, activateHero, deactivateHero, revealHero, loading, error } = useGame();
  const [claiming, setClaiming] = useState(false);
  const [activating, setActivating] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState<string | null>(null);
  const [revealing, setRevealing] = useState<string | null>(null);
  const [selectedHero, setSelectedHero] = useState<UserHeroWithDetails | null>(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const starterHero = allHeroes.find(h => h.is_starter);
  const canClaimFreeHero = !profile?.has_claimed_free_hero && starterHero;

  const activeHeroes = userHeroes.filter(h => h.is_active);
  const inactiveHeroes = userHeroes.filter(h => !h.is_active);
  const totalPower = activeHeroes.reduce((sum, h) => sum + h.heroes.hero_rarities.supercash_per_hour * 10, 0);
  const totalEarningRate = activeHeroes.reduce((sum, h) => sum + h.heroes.hero_rarities.supercash_per_hour, 0);

  const filteredHeroes = userHeroes.filter(hero => {
    switch (activeFilter) {
      case 'active': return hero.is_active;
      case 'inactive': return !hero.is_active;
      default: return true;
    }
  });

  const handleClaimFreeHero = async () => {
    setClaiming(true);
    const success = await claimFreeHero();
    setClaiming(false);
    if (success) {
      setShowClaimModal(true);
    }
  };

  const handleActivateHero = async (userHeroId: string) => {
    setActivating(userHeroId);
    await activateHero(userHeroId);
    setActivating(null);
    setSelectedHero(null);
  };

  const handleDeactivateHero = async (userHeroId: string) => {
    setDeactivating(userHeroId);
    await deactivateHero(userHeroId);
    setDeactivating(null);
    setSelectedHero(null);
  };

  const handleRevealHero = async (userHeroId: string) => {
    setRevealing(userHeroId);
    const success = await revealHero(userHeroId);
    setRevealing(null);
    if (success && selectedHero) {
      const updated = userHeroes.find(h => h.id === userHeroId);
      if (updated) setSelectedHero(updated);
    }
  };

  const formatTimeActive = (activatedAt: string): string => {
    const activated = new Date(activatedAt);
    const now = new Date();
    const hours = Math.floor((now.getTime() - activated.getTime()) / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h`;
  };

  if (loading) {
    return (
      <ImageBackground 
        source={require('@/assets/home_bg.jpg')} 
        style={styles.container}
        resizeMode="cover"
      >
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
    <ImageBackground 
      source={require('@/assets/home_bg.jpg')} 
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
      <SafeAreaView style={styles.safeArea}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Collection Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCardMini}>
              <View style={[styles.statIconMini, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
                <Layers color="#FBBF24" size={16} />
              </View>
              <Text style={styles.statValueMini}>{userHeroes.length}</Text>
              <Text style={styles.statLabelMini}>Total</Text>
            </View>
            <View style={styles.statCardMini}>
              <View style={[styles.statIconMini, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
                <Zap color="#22C55E" size={16} />
              </View>
              <Text style={styles.statValueMini}>{activeHeroes.length}</Text>
              <Text style={styles.statLabelMini}>Active</Text>
            </View>
            <View style={styles.statCardMini}>
              <View style={[styles.statIconMini, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                <Flame color="#8B5CF6" size={16} />
              </View>
              <Text style={styles.statValueMini}>{totalPower}</Text>
              <Text style={styles.statLabelMini}>Power</Text>
            </View>
            <View style={styles.statCardMini}>
              <View style={[styles.statIconMini, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                <Coins color="#3B82F6" size={16} />
              </View>
              <Text style={styles.statValueMini}>{totalEarningRate}</Text>
              <Text style={styles.statLabelMini}>SC/hr</Text>
            </View>
          </View>

          {canClaimFreeHero && (
            <TouchableOpacity
              style={styles.claimCard}
              onPress={handleClaimFreeHero}
              disabled={claiming}
            >
              <LinearGradient
                colors={['#22C55E', '#16A34A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.claimGradient}
              >
                <View style={styles.claimContent}>
                  <View style={styles.claimIconContainer}>
                    <Gift color="#FFFFFF" size={28} />
                  </View>
                  <View style={styles.claimTextContainer}>
                    <Text style={styles.claimTitle}>Claim Your Free Hero!</Text>
                    <Text style={styles.claimDescription}>
                      Start earning SuperCash now
                    </Text>
                  </View>
                  <View style={styles.claimButton}>
                    {claiming ? (
                      <ActivityIndicator color="#22C55E" />
                    ) : (
                      <Text style={styles.claimButtonText}>CLAIM</Text>
                    )}
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Filter Tabs */}
          <View style={styles.filterTabs}>
            <TouchableOpacity 
              style={[styles.filterTab, activeFilter === 'all' && styles.filterTabActive]}
              onPress={() => setActiveFilter('all')}
            >
              <Text style={[styles.filterTabText, activeFilter === 'all' && styles.filterTabTextActive]}>
                All ({userHeroes.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterTab, activeFilter === 'active' && styles.filterTabActive]}
              onPress={() => setActiveFilter('active')}
            >
              <Text style={[styles.filterTabText, activeFilter === 'active' && styles.filterTabTextActive]}>
                Active ({activeHeroes.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterTab, activeFilter === 'inactive' && styles.filterTabActive]}
              onPress={() => setActiveFilter('inactive')}
            >
              <Text style={[styles.filterTabText, activeFilter === 'inactive' && styles.filterTabTextActive]}>
                Idle ({inactiveHeroes.length})
              </Text>
            </TouchableOpacity>
          </View>

          {filteredHeroes.length === 0 && !canClaimFreeHero ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Zap color="#64748B" size={40} />
              </View>
              <Text style={styles.emptyTitle}>No Heroes Found</Text>
              <Text style={styles.emptyText}>
                Claim your free hero to start earning SuperCash!
              </Text>
            </View>
          ) : (
            <View style={styles.heroesGrid}>
              {filteredHeroes.map(userHero => (
                <TouchableOpacity
                  key={userHero.id}
                  style={[
                    styles.heroCard,
                    {
                      borderColor: userHero.is_revealed
                        ? userHero.is_active
                          ? userHero.heroes.hero_rarities.color_hex
                          : 'rgba(100, 116, 139, 0.3)'
                        : '#FBBF24',
                    },
                  ]}
                  onPress={() => setSelectedHero(userHero)}
                >
                  {userHero.is_active && userHero.is_revealed && (
                    <View style={styles.activeBadge}>
                      <Sparkles color="#FFFFFF" size={10} />
                      <Text style={styles.activeBadgeText}>ACTIVE</Text>
                    </View>
                  )}
                  {!userHero.is_revealed && (
                    <View style={styles.mysteryBadge}>
                      <HelpCircle color="#FBBF24" size={10} />
                      <Text style={styles.mysteryBadgeText}>MYSTERY</Text>
                    </View>
                  )}
                  {userHero.is_revealed ? (
                    <Image
                      source={getHeroImageSource(userHero.heroes.image_url)}
                      style={styles.heroImage}
                    />
                  ) : (
                    <View style={styles.mysteryImageContainer}>
                      <HelpCircle color="#FBBF24" size={36} />
                      <Text style={styles.mysteryImageText}>Tap to Reveal</Text>
                    </View>
                  )}
                  <View style={styles.heroInfo}>
                    <Text style={styles.heroName} numberOfLines={1}>
                      {userHero.is_revealed ? userHero.heroes.name : '???'}
                    </Text>
                    <View
                      style={[
                        styles.rarityBadge,
                        { backgroundColor: userHero.is_revealed
                            ? userHero.heroes.hero_rarities.color_hex + '20'
                            : 'rgba(251, 191, 36, 0.2)' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.rarityText,
                          { color: userHero.is_revealed
                              ? userHero.heroes.hero_rarities.color_hex
                              : '#FBBF24' },
                        ]}
                      >
                        {userHero.is_revealed ? userHero.heroes.hero_rarities.name : '???'}
                      </Text>
                    </View>
                    <View style={styles.heroStats}>
                      <Coins color="#FBBF24" size={12} />
                      <Text style={styles.heroStatsText}>
                        {userHero.is_revealed ? `${userHero.heroes.hero_rarities.supercash_per_hour}/hr` : '???'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Hero Detail Modal */}
        <Modal
          visible={!!selectedHero}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedHero(null)}
        >
          {selectedHero && (
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <TouchableOpacity
                  style={styles.modalClose}
                  onPress={() => setSelectedHero(null)}
                >
                  <X color="#94A3B8" size={24} />
                </TouchableOpacity>

                {selectedHero.is_revealed ? (
                  <Image
                    source={getHeroImageSource(selectedHero.heroes.image_url)}
                    style={styles.modalImage}
                  />
                ) : (
                  <View style={styles.modalMysteryImage}>
                    <HelpCircle color="#FBBF24" size={64} />
                  </View>
                )}

                <Text style={styles.modalHeroName}>
                  {selectedHero.is_revealed ? selectedHero.heroes.name : 'Mystery Hero'}
                </Text>

                <View
                  style={[
                    styles.modalRarityBadge,
                    { backgroundColor: selectedHero.is_revealed
                        ? selectedHero.heroes.hero_rarities.color_hex + '20'
                        : 'rgba(251, 191, 36, 0.2)' },
                  ]}
                >
                  <Text
                    style={[
                      styles.modalRarityText,
                      { color: selectedHero.is_revealed
                          ? selectedHero.heroes.hero_rarities.color_hex
                          : '#FBBF24' },
                    ]}
                  >
                    {selectedHero.is_revealed
                      ? `${selectedHero.heroes.hero_rarities.name} (Tier ${selectedHero.heroes.hero_rarities.tier})`
                      : 'Unknown Rarity'}
                  </Text>
                </View>

                {selectedHero.is_revealed ? (
                  <>
                    <Text style={styles.modalDescription}>
                      {selectedHero.heroes.hero_rarities.description}
                    </Text>

                    <View style={styles.modalStats}>
                      <View style={styles.modalStatItem}>
                        <Coins color="#FBBF24" size={20} />
                        <Text style={styles.modalStatValue}>
                          {selectedHero.heroes.hero_rarities.supercash_per_hour}
                        </Text>
                        <Text style={styles.modalStatLabel}>SC/hr</Text>
                      </View>
                      <View style={styles.modalStatItem}>
                        <Flame color="#8B5CF6" size={20} />
                        <Text style={styles.modalStatValue}>
                          {selectedHero.heroes.hero_rarities.supercash_per_hour * 10}
                        </Text>
                        <Text style={styles.modalStatLabel}>Power</Text>
                      </View>
                      {selectedHero.is_active && selectedHero.activated_at && (
                        <View style={styles.modalStatItem}>
                          <Zap color="#22C55E" size={20} />
                          <Text style={styles.modalStatValue}>
                            {formatTimeActive(selectedHero.activated_at)}
                          </Text>
                          <Text style={styles.modalStatLabel}>Active</Text>
                        </View>
                      )}
                    </View>

                    {selectedHero.is_active ? (
                      <>
                        <View style={styles.activeStatus}>
                          <Check color="#22C55E" size={20} />
                          <Text style={styles.activeStatusText}>Currently Active & Earning</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.deactivateButton}
                          onPress={() => handleDeactivateHero(selectedHero.id)}
                          disabled={deactivating === selectedHero.id}
                        >
                          {deactivating === selectedHero.id ? (
                            <ActivityIndicator color="#EF4444" size="small" />
                          ) : (
                            <>
                              <Zap color="#EF4444" size={16} />
                              <Text style={styles.deactivateButtonText}>Set Inactive</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </>
                    ) : (
                      <TouchableOpacity
                        style={styles.activateButton}
                        onPress={() => handleActivateHero(selectedHero.id)}
                        disabled={activating === selectedHero.id}
                      >
                        <LinearGradient
                          colors={['#FBBF24', '#F59E0B']}
                          style={styles.activateGradient}
                        >
                          {activating === selectedHero.id ? (
                            <ActivityIndicator color="#0F172A" />
                          ) : (
                            <>
                              <Zap color="#0F172A" size={20} />
                              <Text style={styles.activateButtonText}>ACTIVATE</Text>
                            </>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                  </>
                ) : (
                  <>
                    <Text style={styles.modalDescription}>
                      This hero is waiting to be revealed! Tap the button below to discover who it is.
                    </Text>

                    <TouchableOpacity
                      style={styles.revealButton}
                      onPress={() => handleRevealHero(selectedHero.id)}
                      disabled={revealing === selectedHero.id}
                    >
                      <LinearGradient
                        colors={['#FBBF24', '#F59E0B']}
                        style={styles.revealGradient}
                      >
                        {revealing === selectedHero.id ? (
                          <ActivityIndicator color="#0F172A" />
                        ) : (
                          <>
                            <Eye color="#0F172A" size={20} />
                            <Text style={styles.revealButtonText}>REVEAL HERO</Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          )}
        </Modal>

        {/* Claim Success Modal */}
        <Modal
          visible={showClaimModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowClaimModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.claimSuccessModal}>
              <View style={styles.claimSuccessIcon}>
                <Sparkles color="#FBBF24" size={48} />
              </View>
              <Text style={styles.claimSuccessTitle}>Hero Claimed!</Text>
              <Text style={styles.claimSuccessText}>
                You received {starterHero?.name}! Tap Activate to start earning SuperCash.
              </Text>
              <TouchableOpacity
                style={styles.claimSuccessButton}
                onPress={() => setShowClaimModal(false)}
              >
                <Text style={styles.claimSuccessButtonText}>Awesome!</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
    height: height,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 15, 30, 0.75)',
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 16,
    fontSize: 14,
  },
  errorContainer: {
    marginHorizontal: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statCardMini: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  statIconMini: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statValueMini: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabelMini: {
    fontSize: 9,
    color: '#94A3B8',
  },
  claimCard: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 14,
  },
  claimGradient: {
    padding: 16,
  },
  claimContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  claimIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  claimTextContainer: {
    flex: 1,
  },
  claimTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  claimDescription: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  claimButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  claimButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#22C55E',
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  filterTabActive: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderColor: '#FBBF24',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#FBBF24',
  },
  emptyState: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
  heroesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  heroCard: {
    width: (width - 42) / 2,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
  },
  activeBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#22C55E',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mysteryBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(251, 191, 36, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  mysteryBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#0F172A',
  },
  heroImage: {
    width: '100%',
    height: 120,
  },
  mysteryImageContainer: {
    width: '100%',
    height: 120,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mysteryImageText: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: '600',
    color: '#FBBF24',
  },
  heroInfo: {
    padding: 10,
  },
  heroName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  rarityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    marginBottom: 6,
  },
  rarityText: {
    fontSize: 9,
    fontWeight: '700',
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  heroStatsText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FBBF24',
  },
  bottomSpacer: {
    height: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
  },
  modalClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    padding: 6,
  },
  modalImage: {
    width: 140,
    height: 140,
    borderRadius: 16,
    marginBottom: 16,
  },
  modalMysteryImage: {
    width: 140,
    height: 140,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FBBF24',
    borderStyle: 'dashed',
  },
  modalHeroName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalRarityBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  modalRarityText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalDescription: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  modalStats: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
  },
  modalStatItem: {
    alignItems: 'center',
  },
  modalStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 6,
  },
  modalStatLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  activeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    width: '100%',
    justifyContent: 'center',
  },
  activeStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22C55E',
  },
  activateButton: {
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
  },
  activateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
  },
  activateButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  deactivateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    width: '100%',
  },
  deactivateButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  revealButton: {
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 8,
  },
  revealGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
  },
  revealButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  claimSuccessModal: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    maxWidth: 300,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
  },
  claimSuccessIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  claimSuccessTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  claimSuccessText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  claimSuccessButton: {
    backgroundColor: '#FBBF24',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
  },
  claimSuccessButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
});
