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
import { Zap, Coins, Gift, X, Sparkles, Check, HelpCircle, Eye, ShoppingCart, Layers, Flame, Star, Lock, ArrowUpRight, Swords, Shield, TrendingUp } from 'lucide-react-native';
import { getHeroImageSource } from '@/lib/heroImages';

type FilterTab = 'all' | 'active' | 'inactive' | 'nft';

export default function HeroesScreen() {
  const { profile } = useAuth();
  const { userHeroes, allHeroes, claimFreeHero, activateHero, deactivateHero, revealHero, purchaseHero, loading, error } = useGame();
  const [claiming, setClaiming] = useState(false);
  const [activating, setActivating] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState<string | null>(null);
  const [revealing, setRevealing] = useState<string | null>(null);
  const [selectedHero, setSelectedHero] = useState<UserHeroWithDetails | null>(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const starterHero = allHeroes.find(h => h.is_starter);
  const canClaimFreeHero = !profile?.has_claimed_free_hero && starterHero;

  const activeHeroes = userHeroes.filter(h => h.is_active);
  const inactiveHeroes = userHeroes.filter(h => !h.is_active);
  const totalPower = activeHeroes.reduce((sum, h) => sum + h.heroes.hero_rarities.supercash_per_hour * 10, 0);

  const filteredHeroes = userHeroes.filter(hero => {
    switch (activeFilter) {
      case 'active': return hero.is_active;
      case 'inactive': return !hero.is_active;
      case 'nft': return false; // Future NFT heroes
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

  const getHeroPrice = (rarity: { tier: number; supercash_per_hour: number }): number => {
    return rarity.supercash_per_hour * 100;
  };

  const handlePurchaseHero = async (heroId: string, price: number) => {
    setPurchasing(heroId);
    const result = await purchaseHero(heroId, price);
    setPurchasing(null);
    if (!result.success && result.error) {
      alert(result.error);
    }
  };

  const marketplaceHeroes = allHeroes.filter(h => !h.is_starter);

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
        source={require('@/assets/photo_2025-12-10_12-50-44.jpg')} 
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
      source={require('@/assets/photo_2025-12-10_12-50-44.jpg')} 
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
                <Star color="#3B82F6" size={16} />
              </View>
              <Text style={styles.statValueMini}>0</Text>
              <Text style={styles.statLabelMini}>NFTs</Text>
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
            <TouchableOpacity 
              style={[styles.filterTab, activeFilter === 'nft' && styles.filterTabActive]}
              onPress={() => setActiveFilter('nft')}
            >
              <Lock color={activeFilter === 'nft' ? '#FBBF24' : '#64748B'} size={12} />
              <Text style={[styles.filterTabText, activeFilter === 'nft' && styles.filterTabTextActive]}>
                NFT
              </Text>
            </TouchableOpacity>
          </View>

          {filteredHeroes.length === 0 && !canClaimFreeHero ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Zap color="#64748B" size={40} />
              </View>
              <Text style={styles.emptyTitle}>
                {activeFilter === 'nft' ? 'No NFT Heroes Yet' : 'No Heroes Found'}
              </Text>
              <Text style={styles.emptyText}>
                {activeFilter === 'nft' 
                  ? 'NFT heroes will be available when you mint or purchase from the marketplace'
                  : 'Try changing the filter or acquire more heroes!'}
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

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hero Actions</Text>
            <View style={styles.actionGrid}>
              <TouchableOpacity style={styles.actionCard} onPress={() => setShowMarketplace(true)}>
                <LinearGradient
                  colors={['rgba(251, 191, 36, 0.2)', 'rgba(251, 191, 36, 0.05)']}
                  style={styles.actionCardGradient}
                >
                  <View style={styles.actionCardIcon}>
                    <ShoppingCart color="#FBBF24" size={22} />
                  </View>
                  <Text style={styles.actionCardTitle}>Marketplace</Text>
                  <Text style={styles.actionCardDesc}>Buy & Sell Heroes</Text>
                  <View style={[styles.actionCardBadge, { backgroundColor: 'rgba(34, 197, 94, 0.2)' }]}>
                    <Text style={[styles.actionCardBadgeText, { color: '#22C55E' }]}>Open</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard}>
                <LinearGradient
                  colors={['rgba(139, 92, 246, 0.2)', 'rgba(139, 92, 246, 0.05)']}
                  style={styles.actionCardGradient}
                >
                  <View style={styles.actionCardIcon}>
                    <Layers color="#8B5CF6" size={22} />
                  </View>
                  <Text style={styles.actionCardTitle}>Fusion</Text>
                  <Text style={styles.actionCardDesc}>Combine Heroes</Text>
                  <View style={styles.actionCardBadge}>
                    <Text style={styles.actionCardBadgeText}>Soon</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* Hero Upgrade Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Enhance Your Heroes</Text>
            <View style={styles.upgradeGrid}>
              <TouchableOpacity style={styles.upgradeCard}>
                <View style={[styles.upgradeIcon, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
                  <TrendingUp color="#22C55E" size={20} />
                </View>
                <View style={styles.upgradeInfo}>
                  <Text style={styles.upgradeTitle}>Level Up</Text>
                  <Text style={styles.upgradeDesc}>Increase earning rate</Text>
                </View>
                <Lock color="#64748B" size={16} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.upgradeCard}>
                <View style={[styles.upgradeIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                  <Shield color="#3B82F6" size={20} />
                </View>
                <View style={styles.upgradeInfo}>
                  <Text style={styles.upgradeTitle}>Equip Gear</Text>
                  <Text style={styles.upgradeDesc}>Boost hero stats</Text>
                </View>
                <Lock color="#64748B" size={16} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.upgradeCard}>
                <View style={[styles.upgradeIcon, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                  <Swords color="#EF4444" size={20} />
                </View>
                <View style={styles.upgradeInfo}>
                  <Text style={styles.upgradeTitle}>Battle Arena</Text>
                  <Text style={styles.upgradeDesc}>PvP combat</Text>
                </View>
                <Lock color="#64748B" size={16} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Mint NFT Banner */}
          <TouchableOpacity style={styles.mintBanner}>
            <LinearGradient
              colors={['rgba(139, 92, 246, 0.3)', 'rgba(59, 130, 246, 0.3)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.mintBannerGradient}
            >
              <View style={styles.mintBannerIcon}>
                <Sparkles color="#FFFFFF" size={24} />
              </View>
              <View style={styles.mintBannerText}>
                <Text style={styles.mintBannerTitle}>Mint Hero NFT</Text>
                <Text style={styles.mintBannerDesc}>Turn your hero into a tradeable NFT</Text>
              </View>
              <ArrowUpRight color="#FFFFFF" size={20} />
            </LinearGradient>
          </TouchableOpacity>

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

                    {/* Modal Web3 Actions */}
                    <View style={styles.modalWeb3Actions}>
                      <TouchableOpacity style={styles.modalWeb3Button}>
                        <ArrowUpRight color="#8B5CF6" size={16} />
                        <Text style={styles.modalWeb3ButtonText}>Mint NFT</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.modalWeb3Button}>
                        <ShoppingCart color="#3B82F6" size={16} />
                        <Text style={styles.modalWeb3ButtonText}>List for Sale</Text>
                      </TouchableOpacity>
                    </View>
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

        {/* Marketplace Modal */}
        <Modal
          visible={showMarketplace}
          transparent
          animationType="slide"
          onRequestClose={() => setShowMarketplace(false)}
        >
          <View style={styles.marketplaceOverlay}>
            <View style={styles.marketplaceModal}>
              <View style={styles.marketplaceHeader}>
                <View style={styles.marketplaceTitleRow}>
                  <View style={styles.marketplaceTitleIcon}>
                    <ShoppingCart color="#FBBF24" size={24} />
                  </View>
                  <View>
                    <Text style={styles.marketplaceTitle}>Marketplace</Text>
                    <Text style={styles.marketplaceSubtitle}>Buy heroes with SuperCash</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.marketplaceClose}
                  onPress={() => setShowMarketplace(false)}
                >
                  <X color="#94A3B8" size={24} />
                </TouchableOpacity>
              </View>

              <View style={styles.marketplaceBalance}>
                <Coins color="#FBBF24" size={18} />
                <Text style={styles.marketplaceBalanceText}>
                  Your Balance: {profile?.supercash_balance?.toLocaleString() || 0} SC
                </Text>
              </View>

              <ScrollView style={styles.marketplaceList} showsVerticalScrollIndicator={false}>
                {marketplaceHeroes.map(hero => {
                  const price = getHeroPrice(hero.hero_rarities);
                  const canAfford = (profile?.supercash_balance || 0) >= price;
                  const owned = userHeroes.some(uh => uh.hero_id === hero.id);
                  const isPurchasing = purchasing === hero.id;

                  return (
                    <View
                      key={hero.id}
                      style={[
                        styles.marketplaceItem,
                        { borderColor: hero.hero_rarities.color_hex + '40' },
                      ]}
                    >
                      <Image
                        source={getHeroImageSource(hero.image_url)}
                        style={styles.marketplaceHeroImage}
                      />
                      <View style={styles.marketplaceHeroInfo}>
                        <Text style={styles.marketplaceHeroName}>{hero.name}</Text>
                        <View
                          style={[
                            styles.marketplaceRarityBadge,
                            { backgroundColor: hero.hero_rarities.color_hex + '20' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.marketplaceRarityText,
                              { color: hero.hero_rarities.color_hex },
                            ]}
                          >
                            {hero.hero_rarities.name}
                          </Text>
                        </View>
                        <View style={styles.marketplaceHeroStats}>
                          <Coins color="#FBBF24" size={12} />
                          <Text style={styles.marketplaceHeroEarn}>
                            {hero.hero_rarities.supercash_per_hour}/hr
                          </Text>
                        </View>
                      </View>
                      <View style={styles.marketplacePriceSection}>
                        <Text style={styles.marketplacePrice}>{price.toLocaleString()} SC</Text>
                        {owned ? (
                          <View style={styles.marketplaceOwnedBadge}>
                            <Check color="#22C55E" size={14} />
                            <Text style={styles.marketplaceOwnedText}>Owned</Text>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={[
                              styles.marketplaceBuyButton,
                              !canAfford && styles.marketplaceBuyButtonDisabled,
                            ]}
                            onPress={() => handlePurchaseHero(hero.id, price)}
                            disabled={!canAfford || isPurchasing}
                          >
                            {isPurchasing ? (
                              <ActivityIndicator size="small" color="#0F172A" />
                            ) : (
                              <Text
                                style={[
                                  styles.marketplaceBuyButtonText,
                                  !canAfford && styles.marketplaceBuyButtonTextDisabled,
                                ]}
                              >
                                {canAfford ? 'Buy' : 'Not enough'}
                              </Text>
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}

                {marketplaceHeroes.length === 0 && (
                  <View style={styles.marketplaceEmpty}>
                    <ShoppingCart color="#64748B" size={48} />
                    <Text style={styles.marketplaceEmptyText}>No heroes available</Text>
                  </View>
                )}
              </ScrollView>
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
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
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
  // Stats Row
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
  // Claim Card
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
  // Filter Tabs
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
    paddingVertical: 8,
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
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#FBBF24',
  },
  // Empty State
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
  // Heroes Grid
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
  // Section
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  // Action Grid
  actionGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  actionCard: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionCardGradient: {
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
    borderRadius: 12,
    position: 'relative',
  },
  actionCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  actionCardDesc: {
    fontSize: 10,
    color: '#94A3B8',
  },
  actionCardBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(100, 116, 139, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  actionCardBadgeText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#94A3B8',
  },
  // Upgrade Grid
  upgradeGrid: {
    gap: 8,
  },
  upgradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  upgradeIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  upgradeInfo: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  upgradeDesc: {
    fontSize: 10,
    color: '#94A3B8',
  },
  // Mint Banner
  mintBanner: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 8,
  },
  mintBannerGradient: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: 14,
  },
  mintBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mintBannerText: {
    flex: 1,
  },
  mintBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  mintBannerDesc: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  bottomSpacer: {
    height: 24,
  },
  // Modal
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
  // Modal Web3 Actions
  modalWeb3Actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    width: '100%',
  },
  modalWeb3Button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  modalWeb3ButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
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
  // Marketplace Modal
  marketplaceOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  marketplaceModal: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.85,
    paddingBottom: 24,
  },
  marketplaceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 116, 139, 0.2)',
  },
  marketplaceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  marketplaceTitleIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  marketplaceTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  marketplaceSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  marketplaceClose: {
    padding: 4,
  },
  marketplaceBalance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  marketplaceBalanceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FBBF24',
  },
  marketplaceList: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  marketplaceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  marketplaceHeroImage: {
    width: 64,
    height: 64,
    borderRadius: 10,
  },
  marketplaceHeroInfo: {
    flex: 1,
    marginLeft: 12,
  },
  marketplaceHeroName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  marketplaceRarityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  marketplaceRarityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  marketplaceHeroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  marketplaceHeroEarn: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FBBF24',
  },
  marketplacePriceSection: {
    alignItems: 'flex-end',
    gap: 6,
  },
  marketplacePrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  marketplaceBuyButton: {
    backgroundColor: '#FBBF24',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  marketplaceBuyButtonDisabled: {
    backgroundColor: 'rgba(100, 116, 139, 0.3)',
  },
  marketplaceBuyButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  marketplaceBuyButtonTextDisabled: {
    color: '#64748B',
  },
  marketplaceOwnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  marketplaceOwnedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#22C55E',
  },
  marketplaceEmpty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  marketplaceEmptyText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 12,
  },
});
