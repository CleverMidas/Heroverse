import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ImageBackground, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useGame } from '@/contexts/GameContext';
import { Zap, TrendingUp, Clock, Coins, ChevronRight, Sparkles, Wallet, ArrowUpRight, ArrowDownLeft, Gift, Target, Trophy, Shield, Globe, Lock } from 'lucide-react-native';
import { getHeroImageSource } from '@/lib/heroImages';

export default function HomeScreen() {
  const router = useRouter();
  const { profile, user } = useAuth();
  const { userHeroes, pendingSupercash, collectSupercash } = useGame();

  const activeHeroes = userHeroes.filter(h => h.is_active);
  const totalEarningRate = activeHeroes.reduce(
    (sum, h) => sum + h.heroes.hero_rarities.supercash_per_hour,
    0
  );

  const handleCollect = async () => {
    await collectSupercash();
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  // Mock data for future features
  const heroVerseTokenBalance = 0;
  const heroVerseTokenPrice = 0.0042;
  const dailyQuestProgress = 2;
  const dailyQuestTotal = 5;

  return (
    <ImageBackground 
      source={require('@/assets/photo_2025-12-10_12-50-44.jpg')} 
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Balance Cards Row */}
          <View style={styles.balanceRow}>
            {/* SuperCash Balance */}
            <View style={styles.balanceCardSmall}>
              <LinearGradient
                colors={['#FBBF24', '#F59E0B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.balanceGradientSmall}
              >
                <View style={styles.balanceHeaderSmall}>
                  <View style={styles.balanceIconContainerSmall}>
                    <Coins color="#0F172A" size={18} />
                  </View>
                  <Text style={styles.balanceLabelSmall}>SuperCash</Text>
                </View>
                <Text style={styles.balanceAmountSmall}>
                  {formatNumber(profile?.supercash_balance || 0)}
                </Text>
                <View style={styles.balanceFooterSmall}>
                  <TrendingUp color="#0F172A" size={12} />
                  <Text style={styles.statTextSmall}>{formatNumber(totalEarningRate)}/hr</Text>
                </View>
              </LinearGradient>
            </View>

            {/* HeroVerse Token Balance */}
            <View style={styles.balanceCardSmall}>
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.balanceGradientSmall}
              >
                <View style={styles.balanceHeaderSmall}>
                  <View style={styles.balanceIconContainerSmall}>
                    <Wallet color="#FFFFFF" size={18} />
                  </View>
                  <Text style={[styles.balanceLabelSmall, { color: '#FFFFFF' }]}>$HERO</Text>
                </View>
                <Text style={[styles.balanceAmountSmall, { color: '#FFFFFF' }]}>
                  {formatNumber(heroVerseTokenBalance)}
                </Text>
                <View style={styles.balanceFooterSmall}>
                  <Text style={[styles.statTextSmall, { color: 'rgba(255,255,255,0.8)' }]}>≈ ${(heroVerseTokenBalance * heroVerseTokenPrice).toFixed(2)}</Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionButton}>
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
                <ArrowDownLeft color="#22C55E" size={20} />
              </View>
              <Text style={styles.actionText}>Deposit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                <ArrowUpRight color="#3B82F6" size={20} />
              </View>
              <Text style={styles.actionText}>Withdraw</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
                <Coins color="#FBBF24" size={20} />
              </View>
              <Text style={styles.actionText}>Swap</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                <Lock color="#A855F7" size={20} />
              </View>
              <Text style={styles.actionText}>Stake</Text>
            </TouchableOpacity>
          </View>

          {pendingSupercash > 0 && (
            <TouchableOpacity style={styles.collectCard} onPress={handleCollect}>
              <LinearGradient
                colors={['#22C55E', '#16A34A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.collectGradient}
              >
                <View style={styles.collectContent}>
                  <View>
                    <Text style={styles.collectLabel}>Ready to Collect</Text>
                    <View style={styles.collectAmount}>
                      <Sparkles color="#FFFFFF" size={20} />
                      <Text style={styles.collectValue}>
                        +{formatNumber(pendingSupercash)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.collectButton}>
                    <Text style={styles.collectButtonText}>COLLECT</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Daily Quests Preview */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Daily Quests</Text>
              <TouchableOpacity style={styles.seeAllButton}>
                <Text style={styles.seeAllText}>View All</Text>
                <ChevronRight color="#FBBF24" size={16} />
              </TouchableOpacity>
            </View>
            <View style={styles.questCard}>
              <View style={styles.questProgress}>
                <View style={styles.questProgressHeader}>
                  <View style={styles.questIconContainer}>
                    <Target color="#FBBF24" size={20} />
                  </View>
                  <View style={styles.questInfo}>
                    <Text style={styles.questTitle}>Daily Progress</Text>
                    <Text style={styles.questSubtitle}>{dailyQuestProgress}/{dailyQuestTotal} Completed</Text>
                  </View>
                  <View style={styles.questReward}>
                    <Gift color="#22C55E" size={16} />
                    <Text style={styles.questRewardText}>+50</Text>
                  </View>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${(dailyQuestProgress / dailyQuestTotal) * 100}%` }]} />
                </View>
              </View>
              <View style={styles.questList}>
                <View style={styles.questItem}>
                  <View style={[styles.questCheck, styles.questCheckCompleted]}>
                    <Text style={styles.questCheckText}>✓</Text>
                  </View>
                  <Text style={[styles.questItemText, styles.questItemCompleted]}>Login Daily</Text>
                  <Text style={styles.questItemReward}>+10 SC</Text>
                </View>
                <View style={styles.questItem}>
                  <View style={[styles.questCheck, styles.questCheckCompleted]}>
                    <Text style={styles.questCheckText}>✓</Text>
                  </View>
                  <Text style={[styles.questItemText, styles.questItemCompleted]}>Collect Earnings</Text>
                  <Text style={styles.questItemReward}>+10 SC</Text>
                </View>
                <View style={styles.questItem}>
                  <View style={styles.questCheck} />
                  <Text style={styles.questItemText}>Win 3 Battles</Text>
                  <Text style={styles.questItemReward}>+30 SC</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Active Heroes */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Heroes</Text>
              <TouchableOpacity
                style={styles.seeAllButton}
                onPress={() => router.push('/(tabs)/heroes')}
              >
                <Text style={styles.seeAllText}>See All</Text>
                <ChevronRight color="#FBBF24" size={16} />
              </TouchableOpacity>
            </View>

            {activeHeroes.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Zap color="#64748B" size={32} />
                </View>
                <Text style={styles.emptyTitle}>No Active Heroes</Text>
                <Text style={styles.emptyText}>
                  Visit My Heroes to activate a hero and start earning SuperCash!
                </Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => router.push('/(tabs)/heroes')}
                >
                  <Text style={styles.emptyButtonText}>Go to My Heroes</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.heroesScroll}
              >
                {activeHeroes.slice(0, 5).map(hero => (
                  <View
                    key={hero.id}
                    style={[
                      styles.heroCard,
                      { borderColor: hero.heroes.hero_rarities.color_hex },
                    ]}
                  >
                    <Image
                      source={getHeroImageSource(hero.heroes.image_url)}
                      style={styles.heroImage}
                    />
                    <View style={styles.heroInfo}>
                      <Text style={styles.heroName} numberOfLines={1}>
                        {hero.heroes.name}
                      </Text>
                      <View
                        style={[
                          styles.rarityBadge,
                          { backgroundColor: hero.heroes.hero_rarities.color_hex + '20' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.rarityText,
                            { color: hero.heroes.hero_rarities.color_hex },
                          ]}
                        >
                          {hero.heroes.hero_rarities.name}
                        </Text>
                      </View>
                      <View style={styles.heroEarning}>
                        <Coins color="#FBBF24" size={12} />
                        <Text style={styles.heroEarningText}>
                          {hero.heroes.hero_rarities.supercash_per_hour}/hr
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Stats Grid - Compact */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Stats</Text>
            <View style={styles.statsGridCompact}>
              <View style={styles.statCardCompact}>
                <Coins color="#FBBF24" size={18} />
                <Text style={styles.statCardValueCompact}>{formatNumber(totalEarningRate)}</Text>
                <Text style={styles.statCardLabelCompact}>SC/hr</Text>
              </View>
              <View style={styles.statCardCompact}>
                <Users color="#22C55E" size={18} />
                <Text style={styles.statCardValueCompact}>{userHeroes.length}</Text>
                <Text style={styles.statCardLabelCompact}>Heroes</Text>
              </View>
              <View style={styles.statCardCompact}>
                <Zap color="#3B82F6" size={18} />
                <Text style={styles.statCardValueCompact}>{activeHeroes.length}</Text>
                <Text style={styles.statCardLabelCompact}>Active</Text>
              </View>
              <View style={styles.statCardCompact}>
                <Clock color="#A855F7" size={18} />
                <Text style={styles.statCardValueCompact}>{formatNumber(pendingSupercash)}</Text>
                <Text style={styles.statCardLabelCompact}>Pending</Text>
              </View>
            </View>
          </View>

          {/* Web3 Features Preview */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>HeroVerse Ecosystem</Text>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Coming Soon</Text>
              </View>
            </View>
            <View style={styles.web3Grid}>
              <TouchableOpacity style={styles.web3Card}>
                <LinearGradient
                  colors={['rgba(139, 92, 246, 0.2)', 'rgba(139, 92, 246, 0.05)']}
                  style={styles.web3CardGradient}
                >
                  <View style={styles.web3IconContainer}>
                    <Globe color="#8B5CF6" size={24} />
                  </View>
                  <Text style={styles.web3CardTitle}>NFT Market</Text>
                  <Text style={styles.web3CardDesc}>Trade Hero NFTs</Text>
                  <View style={styles.lockedOverlay}>
                    <Lock color="#64748B" size={16} />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.web3Card}>
                <LinearGradient
                  colors={['rgba(34, 197, 94, 0.2)', 'rgba(34, 197, 94, 0.05)']}
                  style={styles.web3CardGradient}
                >
                  <View style={styles.web3IconContainer}>
                    <Shield color="#22C55E" size={24} />
                  </View>
                  <Text style={styles.web3CardTitle}>Staking</Text>
                  <Text style={styles.web3CardDesc}>Earn $HERO</Text>
                  <View style={styles.lockedOverlay}>
                    <Lock color="#64748B" size={16} />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.web3Card}>
                <LinearGradient
                  colors={['rgba(251, 191, 36, 0.2)', 'rgba(251, 191, 36, 0.05)']}
                  style={styles.web3CardGradient}
                >
                  <View style={styles.web3IconContainer}>
                    <Trophy color="#FBBF24" size={24} />
                  </View>
                  <Text style={styles.web3CardTitle}>Tournaments</Text>
                  <Text style={styles.web3CardDesc}>Compete & Win</Text>
                  <View style={styles.lockedOverlay}>
                    <Lock color="#64748B" size={16} />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.web3Card}>
                <LinearGradient
                  colors={['rgba(59, 130, 246, 0.2)', 'rgba(59, 130, 246, 0.05)']}
                  style={styles.web3CardGradient}
                >
                  <View style={styles.web3IconContainer}>
                    <Sparkles color="#3B82F6" size={24} />
                  </View>
                  <Text style={styles.web3CardTitle}>Governance</Text>
                  <Text style={styles.web3CardDesc}>Vote & Decide</Text>
                  <View style={styles.lockedOverlay}>
                    <Lock color="#64748B" size={16} />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* Token Info Banner */}
          <TouchableOpacity style={styles.tokenBanner}>
            <LinearGradient
              colors={['rgba(139, 92, 246, 0.3)', 'rgba(59, 130, 246, 0.3)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.tokenBannerGradient}
            >
              <View style={styles.tokenBannerContent}>
                <View style={styles.tokenBannerIcon}>
                  <Text style={styles.tokenBannerEmoji}>🚀</Text>
                </View>
                <View style={styles.tokenBannerText}>
                  <Text style={styles.tokenBannerTitle}>$HERO Token Launch</Text>
                  <Text style={styles.tokenBannerDesc}>Join the whitelist for exclusive benefits</Text>
                </View>
              </View>
              <ChevronRight color="#FFFFFF" size={20} />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

function Users(props: any) {
  return <Zap {...props} />;
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
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  // Balance Cards Row
  balanceRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    marginBottom: 16,
  },
  balanceCardSmall: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  balanceGradientSmall: {
    padding: 16,
  },
  balanceHeaderSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceIconContainerSmall: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  balanceLabelSmall: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  balanceAmountSmall: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  balanceFooterSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statTextSmall: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  actionButton: {
    alignItems: 'center',
    gap: 6,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  actionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  // Collect Card
  collectCard: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
  },
  collectGradient: {
    padding: 16,
  },
  collectContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  collectLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  collectAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  collectValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  collectButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  collectButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Sections
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FBBF24',
  },
  // Quest Card
  questCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  questProgress: {
    marginBottom: 12,
  },
  questProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  questIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  questInfo: {
    flex: 1,
  },
  questTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  questSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
  },
  questReward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  questRewardText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#22C55E',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FBBF24',
    borderRadius: 3,
  },
  questList: {
    gap: 8,
  },
  questItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  questCheck: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(100, 116, 139, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questCheckCompleted: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  questCheckText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  questItemText: {
    flex: 1,
    fontSize: 12,
    color: '#FFFFFF',
  },
  questItemCompleted: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  questItemReward: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FBBF24',
  },
  // Empty State
  emptyState: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
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
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#FBBF24',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  // Heroes Scroll
  heroesScroll: {
    paddingRight: 16,
    gap: 10,
  },
  heroCard: {
    width: 120,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
  },
  heroImage: {
    width: '100%',
    height: 100,
  },
  heroInfo: {
    padding: 10,
  },
  heroName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  rarityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  rarityText: {
    fontSize: 9,
    fontWeight: '700',
  },
  heroEarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  heroEarningText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FBBF24',
  },
  // Stats Grid Compact
  statsGridCompact: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  statCardCompact: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  statCardValueCompact: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 6,
    marginBottom: 2,
  },
  statCardLabelCompact: {
    fontSize: 10,
    color: '#94A3B8',
  },
  // Web3 Grid
  web3Grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  web3Card: {
    width: (width - 42) / 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  web3CardGradient: {
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
    borderRadius: 12,
    position: 'relative',
  },
  web3IconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  web3CardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  web3CardDesc: {
    fontSize: 11,
    color: '#94A3B8',
  },
  lockedOverlay: {
    position: 'absolute',
    top: 14,
    right: 14,
    opacity: 0.5,
  },
  comingSoonBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  // Token Banner
  tokenBanner: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 8,
  },
  tokenBannerGradient: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: 14,
  },
  tokenBannerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tokenBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenBannerEmoji: {
    fontSize: 20,
  },
  tokenBannerText: {
    flex: 1,
  },
  tokenBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  tokenBannerDesc: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  bottomSpacer: {
    height: 24,
  },
});
