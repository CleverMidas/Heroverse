import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, ImageBackground, Dimensions, TouchableOpacity } from 'react-native';

const { width, height } = Dimensions.get('window');
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Trophy, Medal, Crown, Coins, TrendingUp, Users, Clock, Gift, Zap, Target, ChevronRight, Lock, Calendar, Star } from 'lucide-react-native';
import { Profile } from '@/types/database';

interface LeaderboardEntry extends Profile {
  rank: number;
}

type TimeFilter = 'all' | 'weekly' | 'daily';

export default function LeaderboardScreen() {
  const { user, profile } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('supercash_balance', { ascending: false })
        .limit(100);

      if (error) throw error;

      if (data) {
        const rankedData: LeaderboardEntry[] = (data as Profile[]).map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));
        setLeaderboard(rankedData);

        if (user) {
          const userEntry = rankedData.find(entry => entry.id === user.id);
          setUserRank(userEntry?.rank ?? null);
        }
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };

  const getRankIcon = (rank: number, size: number = 20) => {
    if (rank === 1) return <Crown color="#FFD700" size={size} />;
    if (rank === 2) return <Medal color="#C0C0C0" size={size} />;
    if (rank === 3) return <Medal color="#CD7F32" size={size} />;
    return <Trophy color="#64748B" size={size - 4} />;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return '#64748B';
  };

  const getRankBgColor = (rank: number) => {
    if (rank === 1) return 'rgba(255, 215, 0, 0.1)';
    if (rank === 2) return 'rgba(192, 192, 192, 0.1)';
    if (rank === 3) return 'rgba(205, 127, 50, 0.1)';
    return 'rgba(30, 41, 59, 0.6)';
  };

  const getRankBorderColor = (rank: number) => {
    if (rank === 1) return 'rgba(255, 215, 0, 0.3)';
    if (rank === 2) return 'rgba(192, 192, 192, 0.3)';
    if (rank === 3) return 'rgba(205, 127, 50, 0.3)';
    return 'rgba(51, 65, 85, 0.5)';
  };

  const top3 = leaderboard.slice(0, 3);
  const restOfLeaderboard = leaderboard.slice(3);
  const totalPlayers = leaderboard.length;

  if (loading) {
    return (
      <ImageBackground 
        source={require('@/assets/photo_2025-12-10_12-50-44.jpg')} 
        style={styles.container}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FBBF24" />
              <Text style={styles.loadingText}>Loading Leaderboard...</Text>
            </View>
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
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FBBF24"
            />
          }
        >
          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCardMini}>
              <Users color="#FBBF24" size={16} />
              <Text style={styles.statValueMini}>{totalPlayers}</Text>
              <Text style={styles.statLabelMini}>Players</Text>
            </View>
            <View style={styles.statCardMini}>
              <Trophy color="#22C55E" size={16} />
              <Text style={styles.statValueMini}>{userRank || '-'}</Text>
              <Text style={styles.statLabelMini}>Your Rank</Text>
            </View>
            <View style={styles.statCardMini}>
              <Gift color="#8B5CF6" size={16} />
              <Text style={styles.statValueMini}>1K</Text>
              <Text style={styles.statLabelMini}>Prize Pool</Text>
            </View>
            <View style={styles.statCardMini}>
              <Clock color="#3B82F6" size={16} />
              <Text style={styles.statValueMini}>6d</Text>
              <Text style={styles.statLabelMini}>Ends In</Text>
            </View>
          </View>

          {/* Time Filters */}
          <View style={styles.filterTabs}>
            <TouchableOpacity 
              style={[styles.filterTab, timeFilter === 'all' && styles.filterTabActive]}
              onPress={() => setTimeFilter('all')}
            >
              <Text style={[styles.filterTabText, timeFilter === 'all' && styles.filterTabTextActive]}>All Time</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterTab, timeFilter === 'weekly' && styles.filterTabActive]}
              onPress={() => setTimeFilter('weekly')}
            >
              <Text style={[styles.filterTabText, timeFilter === 'weekly' && styles.filterTabTextActive]}>Weekly</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterTab, timeFilter === 'daily' && styles.filterTabActive]}
              onPress={() => setTimeFilter('daily')}
            >
              <Text style={[styles.filterTabText, timeFilter === 'daily' && styles.filterTabTextActive]}>Daily</Text>
            </TouchableOpacity>
          </View>

          {/* Top 3 Podium */}
          {top3.length >= 3 && (
            <View style={styles.podiumContainer}>
              {/* 2nd Place */}
              <View style={styles.podiumItem}>
                <View style={[styles.podiumAvatar, styles.podiumSilver]}>
                  <Medal color="#C0C0C0" size={24} />
                </View>
                <Text style={styles.podiumRank}>#2</Text>
                <Text style={styles.podiumName} numberOfLines={1}>{top3[1]?.username || 'Anonymous'}</Text>
                <View style={styles.podiumBalance}>
                  <Coins color="#FBBF24" size={10} />
                  <Text style={styles.podiumBalanceText}>{(top3[1]?.supercash_balance || 0).toLocaleString()}</Text>
                </View>
                <View style={[styles.podiumBar, styles.podiumBarSilver]} />
              </View>

              {/* 1st Place */}
              <View style={[styles.podiumItem, styles.podiumItemFirst]}>
                <View style={[styles.podiumAvatar, styles.podiumGold]}>
                  <Crown color="#FFD700" size={28} />
                </View>
                <Text style={[styles.podiumRank, styles.podiumRankFirst]}>#1</Text>
                <Text style={[styles.podiumName, styles.podiumNameFirst]} numberOfLines={1}>{top3[0]?.username || 'Anonymous'}</Text>
                <View style={styles.podiumBalance}>
                  <Coins color="#FBBF24" size={10} />
                  <Text style={styles.podiumBalanceText}>{(top3[0]?.supercash_balance || 0).toLocaleString()}</Text>
                </View>
                <View style={[styles.podiumBar, styles.podiumBarGold]} />
              </View>

              {/* 3rd Place */}
              <View style={styles.podiumItem}>
                <View style={[styles.podiumAvatar, styles.podiumBronze]}>
                  <Medal color="#CD7F32" size={24} />
                </View>
                <Text style={styles.podiumRank}>#3</Text>
                <Text style={styles.podiumName} numberOfLines={1}>{top3[2]?.username || 'Anonymous'}</Text>
                <View style={styles.podiumBalance}>
                  <Coins color="#FBBF24" size={10} />
                  <Text style={styles.podiumBalanceText}>{(top3[2]?.supercash_balance || 0).toLocaleString()}</Text>
                </View>
                <View style={[styles.podiumBar, styles.podiumBarBronze]} />
              </View>
            </View>
          )}

          {/* Your Rank Card */}
          {userRank && profile && userRank > 3 && (
            <View style={styles.userCard}>
              <View style={styles.userCardLeft}>
                <View style={styles.userRankBadge}>
                  <Text style={styles.userRankText}>#{userRank}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userCardUsername}>{profile.username || 'Anonymous'}</Text>
                  <View style={styles.userCardBalance}>
                    <Coins color="#FBBF24" size={14} />
                    <Text style={styles.userCardBalanceText}>
                      {profile.supercash_balance.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.userCardRight}>
                <TrendingUp color="#22C55E" size={16} />
                <Text style={styles.userCardTrend}>+12</Text>
              </View>
            </View>
          )}

          {/* Season Rewards */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Season Rewards</Text>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Season 1</Text>
              </View>
            </View>
            <View style={styles.rewardsGrid}>
              <View style={styles.rewardCard}>
                <View style={[styles.rewardIcon, { backgroundColor: 'rgba(255, 215, 0, 0.15)' }]}>
                  <Crown color="#FFD700" size={20} />
                </View>
                <Text style={styles.rewardRank}>1st</Text>
                <Text style={styles.rewardPrize}>500 $HERO</Text>
              </View>
              <View style={styles.rewardCard}>
                <View style={[styles.rewardIcon, { backgroundColor: 'rgba(192, 192, 192, 0.15)' }]}>
                  <Medal color="#C0C0C0" size={20} />
                </View>
                <Text style={styles.rewardRank}>2nd</Text>
                <Text style={styles.rewardPrize}>300 $HERO</Text>
              </View>
              <View style={styles.rewardCard}>
                <View style={[styles.rewardIcon, { backgroundColor: 'rgba(205, 127, 50, 0.15)' }]}>
                  <Medal color="#CD7F32" size={20} />
                </View>
                <Text style={styles.rewardRank}>3rd</Text>
                <Text style={styles.rewardPrize}>150 $HERO</Text>
              </View>
              <View style={styles.rewardCard}>
                <View style={[styles.rewardIcon, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                  <Star color="#8B5CF6" size={20} />
                </View>
                <Text style={styles.rewardRank}>4-10</Text>
                <Text style={styles.rewardPrize}>50 $HERO</Text>
              </View>
            </View>
          </View>

          {/* Leaderboard List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rankings</Text>
            <View style={styles.leaderboardList}>
              {restOfLeaderboard.map((entry) => {
                const isCurrentUser = user && entry.id === user.id;
                const rankColor = getRankColor(entry.rank);
                const bgColor = getRankBgColor(entry.rank);
                const borderColor = getRankBorderColor(entry.rank);

                return (
                  <View
                    key={entry.id}
                    style={[
                      styles.leaderboardCard,
                      {
                        backgroundColor: isCurrentUser ? 'rgba(251, 191, 36, 0.15)' : bgColor,
                        borderColor: isCurrentUser ? 'rgba(251, 191, 36, 0.4)' : borderColor,
                        borderWidth: isCurrentUser ? 2 : 1,
                      },
                    ]}
                  >
                    <View style={styles.leaderboardLeft}>
                      <View
                        style={[
                          styles.rankBadge,
                          {
                            backgroundColor: entry.rank <= 3 ? rankColor + '20' : 'rgba(51, 65, 85, 0.5)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.rankText,
                            { color: rankColor },
                          ]}
                        >
                          #{entry.rank}
                        </Text>
                      </View>
                      <View style={styles.playerInfo}>
                        <Text
                          style={[
                            styles.playerName,
                            isCurrentUser && { color: '#FBBF24' }
                          ]}
                          numberOfLines={1}
                        >
                          {entry.username || 'Anonymous'}
                        </Text>
                        {isCurrentUser && (
                          <Text style={styles.youBadge}>You</Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.leaderboardRight}>
                      <View style={styles.balanceContainer}>
                        <Coins color="#FBBF24" size={12} />
                        <Text style={styles.balanceText}>
                          {entry.supercash_balance.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Upcoming Tournaments */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tournaments</Text>
              <TouchableOpacity style={styles.seeAllButton}>
                <Text style={styles.seeAllText}>View All</Text>
                <ChevronRight color="#FBBF24" size={14} />
              </TouchableOpacity>
            </View>
            <View style={styles.tournamentsGrid}>
              <TouchableOpacity style={styles.tournamentCard}>
                <LinearGradient
                  colors={['rgba(251, 191, 36, 0.2)', 'rgba(251, 191, 36, 0.05)']}
                  style={styles.tournamentGradient}
                >
                  <View style={styles.tournamentIcon}>
                    <Zap color="#FBBF24" size={20} />
                  </View>
                  <Text style={styles.tournamentTitle}>Speed Race</Text>
                  <Text style={styles.tournamentDesc}>Earn fastest in 24h</Text>
                  <View style={styles.tournamentMeta}>
                    <Calendar color="#94A3B8" size={10} />
                    <Text style={styles.tournamentMetaText}>Starts in 2d</Text>
                  </View>
                  <View style={styles.lockedOverlay}>
                    <Lock color="#64748B" size={14} />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.tournamentCard}>
                <LinearGradient
                  colors={['rgba(139, 92, 246, 0.2)', 'rgba(139, 92, 246, 0.05)']}
                  style={styles.tournamentGradient}
                >
                  <View style={styles.tournamentIcon}>
                    <Target color="#8B5CF6" size={20} />
                  </View>
                  <Text style={styles.tournamentTitle}>Hero Battle</Text>
                  <Text style={styles.tournamentDesc}>PvP tournament</Text>
                  <View style={styles.tournamentMeta}>
                    <Calendar color="#94A3B8" size={10} />
                    <Text style={styles.tournamentMetaText}>Starts in 5d</Text>
                  </View>
                  <View style={styles.lockedOverlay}>
                    <Lock color="#64748B" size={14} />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* Compete Banner */}
          <TouchableOpacity style={styles.competeBanner}>
            <LinearGradient
              colors={['rgba(34, 197, 94, 0.3)', 'rgba(22, 163, 74, 0.3)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.competeBannerGradient}
            >
              <View style={styles.competeBannerIcon}>
                <Trophy color="#FFFFFF" size={22} />
              </View>
              <View style={styles.competeBannerText}>
                <Text style={styles.competeBannerTitle}>Climb the Ranks</Text>
                <Text style={styles.competeBannerDesc}>Earn more SuperCash to rank higher</Text>
              </View>
              <ChevronRight color="#FFFFFF" size={18} />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
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
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#94A3B8',
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
    marginBottom: 12,
  },
  statCardMini: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  statValueMini: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  statLabelMini: {
    fontSize: 9,
    color: '#94A3B8',
  },
  // Filter Tabs
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 10,
    alignItems: 'center',
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
  // Podium
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  podiumItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  podiumItemFirst: {
    marginBottom: 12,
  },
  podiumAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  podiumGold: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 2,
    borderColor: '#FFD700',
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  podiumSilver: {
    backgroundColor: 'rgba(192, 192, 192, 0.2)',
    borderWidth: 2,
    borderColor: '#C0C0C0',
  },
  podiumBronze: {
    backgroundColor: 'rgba(205, 127, 50, 0.2)',
    borderWidth: 2,
    borderColor: '#CD7F32',
  },
  podiumRank: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
  },
  podiumRankFirst: {
    fontSize: 14,
    color: '#FFD700',
  },
  podiumName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 2,
    maxWidth: 80,
    textAlign: 'center',
  },
  podiumNameFirst: {
    fontSize: 12,
    fontWeight: '700',
  },
  podiumBalance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  podiumBalanceText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FBBF24',
  },
  podiumBar: {
    width: '100%',
    borderRadius: 6,
    marginTop: 8,
  },
  podiumBarGold: {
    height: 60,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
  },
  podiumBarSilver: {
    height: 44,
    backgroundColor: 'rgba(192, 192, 192, 0.3)',
  },
  podiumBarBronze: {
    height: 32,
    backgroundColor: 'rgba(205, 127, 50, 0.3)',
  },
  // User Card
  userCard: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userRankBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  userRankText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FBBF24',
  },
  userInfo: {
    gap: 2,
  },
  userCardUsername: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userCardBalance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userCardBalanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FBBF24',
  },
  userCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userCardTrend: {
    fontSize: 12,
    fontWeight: '700',
    color: '#22C55E',
  },
  // Sections
  section: {
    marginBottom: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FBBF24',
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
  // Rewards Grid
  rewardsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  rewardCard: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  rewardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  rewardRank: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rewardPrize: {
    fontSize: 9,
    fontWeight: '600',
    color: '#8B5CF6',
    marginTop: 2,
  },
  // Leaderboard List
  leaderboardList: {
    gap: 8,
  },
  leaderboardCard: {
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leaderboardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '800',
  },
  playerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playerName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  youBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FBBF24',
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  leaderboardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  balanceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FBBF24',
  },
  // Tournaments Grid
  tournamentsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  tournamentCard: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tournamentGradient: {
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
    borderRadius: 12,
    position: 'relative',
  },
  tournamentIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  tournamentTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  tournamentDesc: {
    fontSize: 10,
    color: '#94A3B8',
  },
  tournamentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  tournamentMetaText: {
    fontSize: 9,
    color: '#94A3B8',
  },
  lockedOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    opacity: 0.5,
  },
  // Compete Banner
  competeBanner: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  competeBannerGradient: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    borderRadius: 12,
  },
  competeBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  competeBannerText: {
    flex: 1,
  },
  competeBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  competeBannerDesc: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  bottomSpacer: {
    height: 24,
  },
});
