import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ImageBackground, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useGame } from '@/contexts/GameContext';
import { Zap, TrendingUp, Clock, Coins, ChevronRight, Sparkles, Gift, Target, Layers } from 'lucide-react-native';
import { getHeroImageSource } from '@/lib/heroImages';

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { stackedHeroes, pendingSupercash, collectSupercash } = useGame();

  const totalEarningRate = stackedHeroes.reduce((sum, s) => sum + s.totalEarningRate, 0);
  const activeHeroCount = stackedHeroes.reduce((sum, s) => sum + s.activeCount, 0);
  const totalHeroCount = stackedHeroes.reduce((sum, s) => sum + s.count, 0);

  const handleCollect = async () => {
    await collectSupercash();
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  const dailyQuestProgress = 2;
  const dailyQuestTotal = 5;

  return (
    <ImageBackground 
      source={require('@/assets/home_bg.jpg')} 
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.balanceCard}>
            <LinearGradient
              colors={['#FBBF24', '#D97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.balanceGradient}
            >
              <View style={styles.balanceGlowTop} />
              <View style={styles.balanceContent}>
                <View style={styles.balanceLabelContainer}>
                  <Text style={styles.balanceLabel}>TOTAL </Text>
                  <Text style={styles.balanceLabelAccent}>BALANCE</Text>
                </View>
                <View style={styles.balanceAmountContainer}>
                  <Text style={styles.balanceCurrency}>$</Text>
                  <Text style={styles.balanceAmount}>{formatNumber(profile?.supercash_balance || 0)}</Text>
                  <Text style={styles.balanceSC}>SC</Text>
                </View>
                <View style={styles.balanceStats}>
                  <View style={styles.balanceStat}>
                    <View style={styles.balanceStatIcon}>
                      <TrendingUp color="#166534" size={14} />
                    </View>
                    <Text style={styles.balanceStatText}>
                      <Text style={styles.balanceStatHighlight}>+{formatNumber(totalEarningRate)}</Text>
                      <Text style={{ color: '#166534' }}> /hr</Text>
                    </Text>
                  </View>
                  <View style={styles.balanceStatSeparator} />
                  <View style={styles.balanceStat}>
                    <View style={styles.balanceStatIcon}>
                      <Layers color="#78350F" size={14} />
                    </View>
                    <Text style={styles.balanceStatText}>
                      <Text style={styles.balanceStatHighlight}>{totalHeroCount}</Text>
                      <Text style={{ color: '#78350F' }}> Heroes</Text>
                    </Text>
                  </View>
                  <View style={styles.balanceStatSeparator} />
                  <View style={styles.balanceStat}>
                    <View style={styles.balanceStatIcon}>
                      <Zap color="#1D4ED8" size={14} />
                    </View>
                    <Text style={styles.balanceStatText}>
                      <Text style={styles.balanceStatHighlight}>{activeHeroCount}</Text>
                      <Text style={{ color: '#1D4ED8' }}> Active</Text>
                    </Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
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
                      <Text style={styles.collectValue}>+{formatNumber(pendingSupercash)}</Text>
                    </View>
                  </View>
                  <View style={styles.collectButton}>
                    <Text style={styles.collectButtonText}>COLLECT</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

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
                  <Text style={styles.questItemText}>Activate 3 Heroes</Text>
                  <Text style={styles.questItemReward}>+30 SC</Text>
                </View>
              </View>
            </View>
          </View>

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

            {activeHeroCount === 0 ? (
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
                {stackedHeroes.filter(s => s.isAnyActive).slice(0, 5).map(stack => (
                  <View
                    key={stack.hero_id}
                    style={[styles.heroCard, { borderColor: stack.hero.hero_rarities.color_hex }]}
                  >
                    <Image
                      source={getHeroImageSource(stack.hero.image_url)}
                      style={styles.heroImage}
                    />
                    {stack.count > 1 && (
                      <View style={styles.stackBadge}>
                        <Text style={styles.stackBadgeText}>{stack.count}X</Text>
                      </View>
                    )}
                    <View style={styles.heroInfo}>
                      <Text style={styles.heroName} numberOfLines={1}>{stack.hero.name}</Text>
                      <View style={[styles.rarityBadge, { backgroundColor: stack.hero.hero_rarities.color_hex + '20' }]}>
                        <Text style={[styles.rarityText, { color: stack.hero.hero_rarities.color_hex }]}>
                          {stack.hero.hero_rarities.name}
                        </Text>
                      </View>
                      <View style={styles.heroEarning}>
                        <Coins color="#FBBF24" size={12} />
                        <Text style={styles.heroEarningText}>
                          {stack.hero.hero_rarities.supercash_per_hour}/hr
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Stats</Text>
            <View style={styles.statsGridCompact}>
              <View style={styles.statCardCompact}>
                <Coins color="#FBBF24" size={18} />
                <Text style={styles.statCardValueCompact}>{formatNumber(totalEarningRate)}</Text>
                <Text style={styles.statCardLabelCompact}>SC/hr</Text>
              </View>
              <View style={styles.statCardCompact}>
                <Zap color="#22C55E" size={18} />
                <Text style={styles.statCardValueCompact}>{totalHeroCount}</Text>
                <Text style={styles.statCardLabelCompact}>Heroes</Text>
              </View>
              <View style={styles.statCardCompact}>
                <TrendingUp color="#3B82F6" size={18} />
                <Text style={styles.statCardValueCompact}>{activeHeroCount}</Text>
                <Text style={styles.statCardLabelCompact}>Active</Text>
              </View>
              <View style={styles.statCardCompact}>
                <Clock color="#A855F7" size={18} />
                <Text style={styles.statCardValueCompact}>{formatNumber(pendingSupercash)}</Text>
                <Text style={styles.statCardLabelCompact}>Pending</Text>
              </View>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width, height },
  overlay: { flex: 1, backgroundColor: 'rgba(10, 15, 30, 0.75)' },
  safeArea: { flex: 1 },
  scrollView: { flex: 1, paddingHorizontal: 16 },
  balanceCard: { borderRadius: 24, overflow: 'hidden', marginTop: 12, marginBottom: 16, shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  balanceGradient: { paddingHorizontal: 20, paddingVertical: 24, position: 'relative' },
  balanceGlowTop: { position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255, 255, 255, 0.25)' },
  balanceContent: { position: 'relative', zIndex: 1 },
  balanceLabelContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 },
  balanceLabel: { fontSize: 15, fontWeight: '800', color: '#78350F', letterSpacing: 2 },
  balanceLabelAccent: { fontSize: 15, fontWeight: '800', color: '#1C1917', letterSpacing: 2 },
  balanceAmountContainer: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', marginBottom: 20 },
  balanceCurrency: { fontSize: 24, fontWeight: '400', color: '#78350F', marginTop: 6, marginRight: 2 },
  balanceAmount: { fontSize: 48, fontWeight: '800', color: '#1C1917', letterSpacing: -1 },
  balanceSC: { fontSize: 14, fontWeight: '600', color: 'rgba(0, 0, 0, 0.4)', marginTop: 10, marginLeft: 6 },
  balanceStats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  balanceStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  balanceStatIcon: { width: 26, height: 26, borderRadius: 7, backgroundColor: 'rgba(0, 0, 0, 0.1)', justifyContent: 'center', alignItems: 'center' },
  balanceStatText: { fontSize: 12, color: 'rgba(0, 0, 0, 0.5)' },
  balanceStatHighlight: { fontWeight: '700', color: '#1C1917' },
  balanceStatSeparator: { width: 1, height: 20, backgroundColor: 'rgba(0, 0, 0, 0.15)', marginHorizontal: 12 },
  collectCard: { borderRadius: 14, overflow: 'hidden', marginBottom: 16 },
  collectGradient: { padding: 16 },
  collectContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  collectLabel: { fontSize: 11, fontWeight: '500', color: 'rgba(255, 255, 255, 0.8)', marginBottom: 2 },
  collectAmount: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  collectValue: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  collectButton: { backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  collectButtonText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  seeAllButton: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { fontSize: 12, fontWeight: '600', color: '#FBBF24' },
  questCard: { backgroundColor: 'rgba(30, 41, 59, 0.6)', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(100, 116, 139, 0.2)' },
  questProgress: { marginBottom: 12 },
  questProgressHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  questIconContainer: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(251, 191, 36, 0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  questInfo: { flex: 1 },
  questTitle: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  questSubtitle: { fontSize: 11, color: '#94A3B8' },
  questReward: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(34, 197, 94, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  questRewardText: { fontSize: 12, fontWeight: '700', color: '#22C55E' },
  progressBar: { height: 6, backgroundColor: 'rgba(100, 116, 139, 0.2)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#FBBF24', borderRadius: 3 },
  questList: { gap: 8 },
  questItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  questCheck: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: 'rgba(100, 116, 139, 0.4)', justifyContent: 'center', alignItems: 'center' },
  questCheckCompleted: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  questCheckText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  questItemText: { flex: 1, fontSize: 12, color: '#FFFFFF' },
  questItemCompleted: { color: '#94A3B8', textDecorationLine: 'line-through' },
  questItemReward: { fontSize: 11, fontWeight: '600', color: '#FBBF24' },
  emptyState: { backgroundColor: 'rgba(30, 41, 59, 0.5)', borderRadius: 14, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(100, 116, 139, 0.2)' },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(100, 116, 139, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 6 },
  emptyText: { fontSize: 12, color: '#94A3B8', textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  emptyButton: { backgroundColor: '#FBBF24', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  emptyButtonText: { fontSize: 12, fontWeight: '700', color: '#0F172A' },
  heroesScroll: { paddingRight: 16, gap: 10 },
  heroCard: { width: 120, backgroundColor: 'rgba(30, 41, 59, 0.8)', borderRadius: 12, overflow: 'hidden', borderWidth: 2 },
  stackBadge: { position: 'absolute', top: 105, right: 6, zIndex: 10, backgroundColor: '#FBBF24', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 4 },
  stackBadgeText: { fontSize: 12, fontWeight: '900', color: '#0F172A' },
  heroImage: { width: '100%', height: 100 },
  heroInfo: { padding: 10 },
  heroName: { fontSize: 12, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  rarityBadge: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 6 },
  rarityText: { fontSize: 9, fontWeight: '700' },
  heroEarning: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  heroEarningText: { fontSize: 11, fontWeight: '600', color: '#FBBF24' },
  statsGridCompact: { flexDirection: 'row', gap: 10, marginTop: 8 },
  statCardCompact: { flex: 1, backgroundColor: 'rgba(30, 41, 59, 0.5)', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(100, 116, 139, 0.2)' },
  statCardValueCompact: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginTop: 6, marginBottom: 2 },
  statCardLabelCompact: { fontSize: 10, color: '#94A3B8' },
  bottomSpacer: { height: 24 },
});
