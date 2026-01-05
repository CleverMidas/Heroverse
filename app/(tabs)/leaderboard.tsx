import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, ImageBackground, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Trophy, Medal, Crown, Coins, TrendingUp } from 'lucide-react-native';
import { Profile } from '@/types/database';

interface LeaderboardEntry extends Profile {
  rank: number;
}

export default function LeaderboardScreen() {
  const { user, profile } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown color="#FFD700" size={24} />;
    if (rank === 2) return <Medal color="#C0C0C0" size={24} />;
    if (rank === 3) return <Medal color="#CD7F32" size={24} />;
    return <Trophy color="#64748B" size={20} />;
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
    return 'rgba(30, 41, 59, 0.8)';
  };

  const getRankBorderColor = (rank: number) => {
    if (rank === 1) return 'rgba(255, 215, 0, 0.3)';
    if (rank === 2) return 'rgba(192, 192, 192, 0.3)';
    if (rank === 3) return 'rgba(205, 127, 50, 0.3)';
    return 'rgba(51, 65, 85, 0.5)';
  };

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
          {userRank && profile && (
            <View style={styles.userCard}>
              <View style={styles.userCardHeader}>
                <TrendingUp color="#FBBF24" size={20} />
                <Text style={styles.userCardTitle}>Your Rank</Text>
              </View>
              <View style={styles.userCardContent}>
                <View style={styles.userCardRank}>
                  <Text style={styles.userCardRankNumber}>#{userRank}</Text>
                  {getRankIcon(userRank)}
                </View>
                <View style={styles.userCardStats}>
                  <Text style={styles.userCardUsername}>{profile.username || 'Anonymous'}</Text>
                  <View style={styles.userCardBalance}>
                    <Coins color="#FBBF24" size={16} />
                    <Text style={styles.userCardBalanceText}>
                      {profile.supercash_balance.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          <View style={styles.leaderboardList}>
            {leaderboard.map((entry) => {
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
                      <Coins color="#FBBF24" size={16} />
                      <Text style={styles.balanceText}>
                        {entry.supercash_balance.toLocaleString()}
                      </Text>
                    </View>
                    {getRankIcon(entry.rank)}
                  </View>
                </View>
              );
            })}
          </View>

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
    fontSize: 16,
    color: '#94A3B8',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  userCard: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    marginTop: 13
  },
  userCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  userCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FBBF24',
  },
  userCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  userCardRank: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userCardRankNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userCardStats: {
    flex: 1,
  },
  userCardUsername: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  userCardBalance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userCardBalanceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FBBF24',
  },
  leaderboardList: {
    gap: 12,
  },
  leaderboardCard: {
    borderRadius: 16,
    padding: 16,
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
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '800',
  },
  playerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  youBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FBBF24',
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  leaderboardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  balanceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FBBF24',
  },
  bottomSpacer: {
    height: 20,
  },
});
