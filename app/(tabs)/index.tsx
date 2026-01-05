import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ImageBackground, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useGame } from '@/contexts/GameContext';
import { Zap, TrendingUp, Clock, Coins, ChevronRight, Sparkles } from 'lucide-react-native';
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

  return (
    <ImageBackground 
      source={require('@/assets/photo_2025-12-10_12-50-44.jpg')} 
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.balanceCard}>
            <LinearGradient
              colors={['#FBBF24', '#F59E0B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.balanceGradient}
            >
              <View style={styles.balanceHeader}>
                <View style={styles.balanceIconContainer}>
                  <Coins color="#0F172A" size={24} />
                </View>
                <Text style={styles.balanceLabel}>SuperCash Balance</Text>
              </View>
              <Text style={styles.balanceAmount}>
                {formatNumber(profile?.supercash_balance || 0)}
              </Text>
              <View style={styles.balanceFooter}>
                <View style={styles.statItem}>
                  <TrendingUp color="#0F172A" size={16} />
                  <Text style={styles.statText}>{formatNumber(totalEarningRate)}/hr</Text>
                </View>
                <View style={styles.statItem}>
                  <Users color="#0F172A" size={16} />
                  <Text style={styles.statText}>{activeHeroes.length} Active</Text>
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

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
                  <Coins color="#FBBF24" size={24} />
                </View>
                <Text style={styles.statCardValue}>{formatNumber(totalEarningRate)}</Text>
                <Text style={styles.statCardLabel}>SuperCash/hr</Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
                  <Users color="#22C55E" size={24} />
                </View>
                <Text style={styles.statCardValue}>{userHeroes.length}</Text>
                <Text style={styles.statCardLabel}>Total Heroes</Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                  <Zap color="#3B82F6" size={24} />
                </View>
                <Text style={styles.statCardValue}>{activeHeroes.length}</Text>
                <Text style={styles.statCardLabel}>Active Now</Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                  <Clock color="#A855F7" size={24} />
                </View>
                <Text style={styles.statCardValue}>{formatNumber(pendingSupercash)}</Text>
                <Text style={styles.statCardLabel}>Pending</Text>
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
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: '#94A3B8',
  },
  username: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  logoIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    marginTop: 13
  },
  balanceGradient: {
    padding: 24,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
  },
  balanceFooter: {
    flexDirection: 'row',
    gap: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  collectCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  collectGradient: {
    padding: 20,
  },
  collectContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  collectLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  collectAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  collectValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  collectButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  collectButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FBBF24',
  },
  emptyState: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16,
    padding: 32,
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
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#FBBF24',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  heroesScroll: {
    paddingRight: 20,
    gap: 12,
  },
  heroCard: {
    width: 140,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
  },
  heroImage: {
    width: '100%',
    height: 120,
  },
  heroInfo: {
    padding: 12,
  },
  heroName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
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
  heroEarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroEarningText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FBBF24',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statCardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statCardLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  bottomSpacer: {
    height: 20,
  },
});
