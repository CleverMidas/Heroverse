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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useGame } from '@/contexts/GameContext';
import { UserHeroWithDetails } from '@/types/database';
import { Zap, Coins, Gift, X, Sparkles, Check, HelpCircle, Eye } from 'lucide-react-native';
import { getHeroImageSource } from '@/lib/heroImages';

export default function HeroesScreen() {
  const { profile } = useAuth();
  const { userHeroes, allHeroes, claimFreeHero, activateHero, revealHero, loading, error } = useGame();
  const [claiming, setClaiming] = useState(false);
  const [activating, setActivating] = useState<string | null>(null);
  const [revealing, setRevealing] = useState<string | null>(null);
  const [selectedHero, setSelectedHero] = useState<UserHeroWithDetails | null>(null);
  const [showClaimModal, setShowClaimModal] = useState(false);

  const starterHero = allHeroes.find(h => h.is_starter);
  const canClaimFreeHero = !profile?.has_claimed_free_hero && starterHero;

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
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.container}>
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FBBF24" />
          <Text style={styles.loadingText}>Loading heroes...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>My Heroes</Text>
          <View style={styles.heroCount}>
            <Zap color="#FBBF24" size={16} />
            <Text style={styles.heroCountText}>{userHeroes.length}</Text>
          </View>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
                    <Gift color="#FFFFFF" size={32} />
                  </View>
                  <View style={styles.claimTextContainer}>
                    <Text style={styles.claimTitle}>Claim Your Free Hero!</Text>
                    <Text style={styles.claimDescription}>
                      Get your first hero and start earning SuperCash
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

          {userHeroes.length === 0 && !canClaimFreeHero ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Zap color="#64748B" size={48} />
              </View>
              <Text style={styles.emptyTitle}>No Heroes Yet</Text>
              <Text style={styles.emptyText}>
                You haven't acquired any heroes yet. Keep an eye out for opportunities to add heroes to your collection!
              </Text>
            </View>
          ) : (
            <View style={styles.heroesGrid}>
              {userHeroes.map(userHero => (
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
                      <Sparkles color="#FFFFFF" size={12} />
                      <Text style={styles.activeBadgeText}>ACTIVE</Text>
                    </View>
                  )}
                  {!userHero.is_revealed && (
                    <View style={styles.mysteryBadge}>
                      <HelpCircle color="#FBBF24" size={12} />
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
                      <HelpCircle color="#FBBF24" size={48} />
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
                      <Coins color="#FBBF24" size={14} />
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
                        <Text style={styles.modalStatLabel}>SuperCash/hr</Text>
                      </View>
                      {selectedHero.is_active && selectedHero.activated_at && (
                        <View style={styles.modalStatItem}>
                          <Zap color="#22C55E" size={20} />
                          <Text style={styles.modalStatValue}>
                            {formatTimeActive(selectedHero.activated_at)}
                          </Text>
                          <Text style={styles.modalStatLabel}>Time Active</Text>
                        </View>
                      )}
                    </View>

                    {selectedHero.is_active ? (
                      <View style={styles.activeStatus}>
                        <Check color="#22C55E" size={20} />
                        <Text style={styles.activeStatusText}>Currently Active & Earning</Text>
                      </View>
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  heroCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FBBF24',
  },
  errorContainer: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
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
    paddingHorizontal: 20,
  },
  claimCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  claimGradient: {
    padding: 20,
  },
  claimContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  claimIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  claimTextContainer: {
    flex: 1,
  },
  claimTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  claimDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  claimButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  claimButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#22C55E',
  },
  emptyState: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
    marginTop: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
  },
  heroesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  heroCard: {
    width: '48%',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
  },
  activeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#22C55E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mysteryBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251, 191, 36, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  mysteryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
  },
  heroImage: {
    width: '100%',
    height: 140,
  },
  mysteryImageContainer: {
    width: '100%',
    height: 140,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mysteryImageText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#FBBF24',
  },
  heroInfo: {
    padding: 12,
  },
  heroName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  rarityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroStatsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FBBF24',
  },
  bottomSpacer: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  modalImage: {
    width: 160,
    height: 160,
    borderRadius: 20,
    marginBottom: 20,
  },
  modalMysteryImage: {
    width: 160,
    height: 160,
    borderRadius: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FBBF24',
    borderStyle: 'dashed',
  },
  modalHeroName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalRarityBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  modalRarityText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalDescription: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalStats: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 24,
  },
  modalStatItem: {
    alignItems: 'center',
  },
  modalStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  modalStatLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  activeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    justifyContent: 'center',
  },
  activeStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22C55E',
  },
  activateButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  activateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  activateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  revealButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  revealGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  revealButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  claimSuccessModal: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
  },
  claimSuccessIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  claimSuccessTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  claimSuccessText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  claimSuccessButton: {
    backgroundColor: '#FBBF24',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  claimSuccessButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
});
