import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, ImageBackground, Dimensions, TouchableOpacity } from 'react-native';

const { width, height } = Dimensions.get('window');
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Trophy, Medal, Crown, Coins, TrendingUp, Users, Zap, ChevronRight } from 'lucide-react-native';
import { Profile } from '@/types/database';

interface LeaderboardEntry extends Profile { rank: number; }
type TimeFilter = 'all' | 'weekly' | 'daily';

export default function LeaderboardScreen() {
  const { user, profile } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  const getTimeFilterDate = (filter: TimeFilter): string | null => {
    const now = new Date();
    if (filter === 'daily') { now.setHours(now.getHours() - 24); return now.toISOString(); }
    if (filter === 'weekly') { now.setDate(now.getDate() - 7); return now.toISOString(); }
    return null;
  };

  const fetchLeaderboard = async (filter: TimeFilter = timeFilter) => {
    try {
      let query = supabase.from('profiles').select('*').order('supercash_balance', { ascending: false }).limit(100);
      const filterDate = getTimeFilterDate(filter);
      if (filterDate) query = query.gte('updated_at', filterDate);
      const { data, error } = await query;
      if (error) throw error;
      if (data) {
        const rankedData: LeaderboardEntry[] = (data as Profile[]).map((entry, index) => ({ ...entry, rank: index + 1 }));
        setLeaderboard(rankedData);
        if (user) {
          const userEntry = rankedData.find(entry => entry.id === user.id);
          setUserRank(userEntry?.rank ?? null);
        }
      }
    } catch (error) {
      setLeaderboard([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchLeaderboard(); }, [user]);
  useEffect(() => { setLoading(true); fetchLeaderboard(timeFilter); }, [timeFilter]);
  const onRefresh = () => { setRefreshing(true); fetchLeaderboard(timeFilter); };

  const getFilterLabel = () => {
    if (timeFilter === 'daily') return 'Active today';
    if (timeFilter === 'weekly') return 'Active this week';
    return 'All time rankings';
  };

  const getRankColor = (rank: number) => rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : '#64748B';
  const getRankBgColor = (rank: number) => rank === 1 ? 'rgba(255, 215, 0, 0.1)' : rank === 2 ? 'rgba(192, 192, 192, 0.1)' : rank === 3 ? 'rgba(205, 127, 50, 0.1)' : 'rgba(30, 41, 59, 0.6)';
  const getRankBorderColor = (rank: number) => rank === 1 ? 'rgba(255, 215, 0, 0.3)' : rank === 2 ? 'rgba(192, 192, 192, 0.3)' : rank === 3 ? 'rgba(205, 127, 50, 0.3)' : 'rgba(51, 65, 85, 0.5)';

  const top3 = leaderboard.slice(0, 3);
  const restOfLeaderboard = leaderboard.slice(3);
  const totalPlayers = leaderboard.length;
  const totalSC = leaderboard.reduce((sum, entry) => sum + entry.supercash_balance, 0);

  if (loading) {
    return (
      <ImageBackground source={require('@/assets/home_bg.jpg')} style={styles.container} resizeMode="cover">
        <View style={styles.overlay}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#FBBF24" /><Text style={styles.loadingText}>Loading Leaderboard...</Text></View>
          </SafeAreaView>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={require('@/assets/home_bg.jpg')} style={styles.container} resizeMode="cover">
      <View style={styles.overlay}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FBBF24" />}>
          <View style={styles.statsRow}>
            <View style={styles.statCardMini}><Users color="#FBBF24" size={16} /><Text style={styles.statValueMini}>{totalPlayers}</Text><Text style={styles.statLabelMini}>Players</Text></View>
            <View style={styles.statCardMini}><Trophy color="#22C55E" size={16} /><Text style={styles.statValueMini}>{userRank || '-'}</Text><Text style={styles.statLabelMini}>Your Rank</Text></View>
            <View style={styles.statCardMini}><Coins color="#8B5CF6" size={16} /><Text style={styles.statValueMini}>{totalSC >= 1000 ? `${(totalSC/1000).toFixed(0)}K` : totalSC}</Text><Text style={styles.statLabelMini}>Total SC</Text></View>
            <View style={styles.statCardMini}><Zap color="#3B82F6" size={16} /><Text style={styles.statValueMini}>{top3[0]?.supercash_balance?.toLocaleString() || '-'}</Text><Text style={styles.statLabelMini}>Top Score</Text></View>
          </View>

          <View style={styles.filterTabs}>
            <TouchableOpacity style={[styles.filterTab, timeFilter === 'all' && styles.filterTabActive]} onPress={() => setTimeFilter('all')}><Text style={[styles.filterTabText, timeFilter === 'all' && styles.filterTabTextActive]}>All Time</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.filterTab, timeFilter === 'weekly' && styles.filterTabActive]} onPress={() => setTimeFilter('weekly')}><Text style={[styles.filterTabText, timeFilter === 'weekly' && styles.filterTabTextActive]}>Weekly</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.filterTab, timeFilter === 'daily' && styles.filterTabActive]} onPress={() => setTimeFilter('daily')}><Text style={[styles.filterTabText, timeFilter === 'daily' && styles.filterTabTextActive]}>Daily</Text></TouchableOpacity>
          </View>

          <View style={styles.filterInfo}><Text style={styles.filterInfoText}>{getFilterLabel()}</Text></View>

          {leaderboard.length === 0 ? (
            <View style={styles.emptyState}>
              <Trophy color="#64748B" size={48} />
              <Text style={styles.emptyTitle}>No Players Found</Text>
              <Text style={styles.emptyText}>{timeFilter === 'daily' ? 'No players have been active today yet' : timeFilter === 'weekly' ? 'No players have been active this week' : 'No players on the leaderboard yet'}</Text>
            </View>
          ) : (
            <>
              {top3.length >= 3 && (
                <View style={styles.podiumContainer}>
                  <View style={styles.podiumItem}>
                    <View style={[styles.podiumAvatar, styles.podiumSilver]}><Medal color="#C0C0C0" size={24} /></View>
                    <Text style={styles.podiumRank}>#2</Text>
                    <Text style={styles.podiumName} numberOfLines={1}>{top3[1]?.username || 'Anonymous'}</Text>
                    <View style={styles.podiumBalance}><Coins color="#FBBF24" size={10} /><Text style={styles.podiumBalanceText}>{(top3[1]?.supercash_balance || 0).toLocaleString()}</Text></View>
                    <View style={[styles.podiumBar, styles.podiumBarSilver]} />
                  </View>
                  <View style={[styles.podiumItem, styles.podiumItemFirst]}>
                    <View style={[styles.podiumAvatar, styles.podiumGold]}><Crown color="#FFD700" size={28} /></View>
                    <Text style={[styles.podiumRank, styles.podiumRankFirst]}>#1</Text>
                    <Text style={[styles.podiumName, styles.podiumNameFirst]} numberOfLines={1}>{top3[0]?.username || 'Anonymous'}</Text>
                    <View style={styles.podiumBalance}><Coins color="#FBBF24" size={10} /><Text style={styles.podiumBalanceText}>{(top3[0]?.supercash_balance || 0).toLocaleString()}</Text></View>
                    <View style={[styles.podiumBar, styles.podiumBarGold]} />
                  </View>
                  <View style={styles.podiumItem}>
                    <View style={[styles.podiumAvatar, styles.podiumBronze]}><Medal color="#CD7F32" size={24} /></View>
                    <Text style={styles.podiumRank}>#3</Text>
                    <Text style={styles.podiumName} numberOfLines={1}>{top3[2]?.username || 'Anonymous'}</Text>
                    <View style={styles.podiumBalance}><Coins color="#FBBF24" size={10} /><Text style={styles.podiumBalanceText}>{(top3[2]?.supercash_balance || 0).toLocaleString()}</Text></View>
                    <View style={[styles.podiumBar, styles.podiumBarBronze]} />
                  </View>
                </View>
              )}

              {userRank && profile && userRank > 3 && (
                <View style={styles.userCard}>
                  <View style={styles.userCardLeft}>
                    <View style={styles.userRankBadge}><Text style={styles.userRankText}>#{userRank}</Text></View>
                    <View style={styles.userInfo}><Text style={styles.userCardUsername}>{profile.username || 'Anonymous'}</Text><View style={styles.userCardBalance}><Coins color="#FBBF24" size={14} /><Text style={styles.userCardBalanceText}>{profile.supercash_balance.toLocaleString()}</Text></View></View>
                  </View>
                  <View style={styles.userCardRight}><TrendingUp color="#22C55E" size={16} /><Text style={styles.userCardTrend}>You</Text></View>
                </View>
              )}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Rankings</Text>
                <View style={styles.leaderboardList}>
                  {restOfLeaderboard.map((entry) => {
                    const isCurrentUser = user && entry.id === user.id;
                    return (
                      <View key={entry.id} style={[styles.leaderboardCard, { backgroundColor: isCurrentUser ? 'rgba(251, 191, 36, 0.15)' : getRankBgColor(entry.rank), borderColor: isCurrentUser ? 'rgba(251, 191, 36, 0.4)' : getRankBorderColor(entry.rank), borderWidth: isCurrentUser ? 2 : 1 }]}>
                        <View style={styles.leaderboardLeft}>
                          <View style={[styles.rankBadge, { backgroundColor: entry.rank <= 3 ? getRankColor(entry.rank) + '20' : 'rgba(51, 65, 85, 0.5)' }]}><Text style={[styles.rankText, { color: getRankColor(entry.rank) }]}>#{entry.rank}</Text></View>
                          <View style={styles.playerInfo}><Text style={[styles.playerName, isCurrentUser && { color: '#FBBF24' }]} numberOfLines={1}>{entry.username || 'Anonymous'}</Text>{isCurrentUser && <Text style={styles.youBadge}>You</Text>}</View>
                        </View>
                        <View style={styles.leaderboardRight}>
                          <View style={styles.balanceContainer}><Coins color="#FBBF24" size={12} /><Text style={styles.balanceText}>{entry.supercash_balance.toLocaleString()}</Text></View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            </>
          )}

          <TouchableOpacity style={styles.competeBanner}>
            <LinearGradient colors={['rgba(34, 197, 94, 0.3)', 'rgba(22, 163, 74, 0.3)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.competeBannerGradient}>
              <View style={styles.competeBannerIcon}><Trophy color="#FFFFFF" size={22} /></View>
              <View style={styles.competeBannerText}><Text style={styles.competeBannerTitle}>Climb the Ranks</Text><Text style={styles.competeBannerDesc}>Earn more SuperCash to rank higher</Text></View>
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
  container: { flex: 1, width, height },
  overlay: { flex: 1, backgroundColor: 'rgba(10, 15, 30, 0.75)' },
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { fontSize: 14, color: '#94A3B8' },
  scrollView: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statCardMini: { flex: 1, backgroundColor: 'rgba(30, 41, 59, 0.6)', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(100, 116, 139, 0.2)' },
  statValueMini: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginTop: 4 },
  statLabelMini: { fontSize: 9, color: '#94A3B8' },
  filterTabs: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  filterTab: { flex: 1, paddingVertical: 10, backgroundColor: 'rgba(30, 41, 59, 0.6)', borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(100, 116, 139, 0.2)' },
  filterTabActive: { backgroundColor: 'rgba(251, 191, 36, 0.15)', borderColor: '#FBBF24' },
  filterTabText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  filterTabTextActive: { color: '#FBBF24' },
  filterInfo: { marginBottom: 12 },
  filterInfoText: { fontSize: 11, color: '#94A3B8', textAlign: 'center' },
  emptyState: { backgroundColor: 'rgba(30, 41, 59, 0.6)', borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(100, 116, 139, 0.2)', marginBottom: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 12, color: '#94A3B8', textAlign: 'center' },
  podiumContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', marginBottom: 16, paddingHorizontal: 8 },
  podiumItem: { flex: 1, alignItems: 'center', marginHorizontal: 4 },
  podiumItemFirst: { marginBottom: 12 },
  podiumAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  podiumGold: { backgroundColor: 'rgba(255, 215, 0, 0.2)', borderWidth: 2, borderColor: '#FFD700', width: 56, height: 56, borderRadius: 28 },
  podiumSilver: { backgroundColor: 'rgba(192, 192, 192, 0.2)', borderWidth: 2, borderColor: '#C0C0C0' },
  podiumBronze: { backgroundColor: 'rgba(205, 127, 50, 0.2)', borderWidth: 2, borderColor: '#CD7F32' },
  podiumRank: { fontSize: 12, fontWeight: '800', color: '#94A3B8' },
  podiumRankFirst: { fontSize: 14, color: '#FFD700' },
  podiumName: { fontSize: 11, fontWeight: '600', color: '#FFFFFF', marginTop: 2, maxWidth: 80, textAlign: 'center' },
  podiumNameFirst: { fontSize: 12, fontWeight: '700' },
  podiumBalance: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  podiumBalanceText: { fontSize: 10, fontWeight: '600', color: '#FBBF24' },
  podiumBar: { width: '100%', borderRadius: 6, marginTop: 8 },
  podiumBarGold: { height: 60, backgroundColor: 'rgba(255, 215, 0, 0.3)' },
  podiumBarSilver: { height: 44, backgroundColor: 'rgba(192, 192, 192, 0.3)' },
  podiumBarBronze: { height: 32, backgroundColor: 'rgba(205, 127, 50, 0.3)' },
  userCard: { backgroundColor: 'rgba(251, 191, 36, 0.1)', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.3)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  userRankBadge: { backgroundColor: 'rgba(251, 191, 36, 0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  userRankText: { fontSize: 14, fontWeight: '800', color: '#FBBF24' },
  userInfo: { gap: 2 },
  userCardUsername: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  userCardBalance: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  userCardBalanceText: { fontSize: 12, fontWeight: '600', color: '#FBBF24' },
  userCardRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  userCardTrend: { fontSize: 12, fontWeight: '700', color: '#22C55E' },
  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: 10 },
  leaderboardList: { gap: 8 },
  leaderboardCard: { borderRadius: 12, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  leaderboardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rankBadge: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  rankText: { fontSize: 12, fontWeight: '800' },
  playerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  playerName: { fontSize: 13, fontWeight: '600', color: '#FFFFFF', flex: 1 },
  youBadge: { fontSize: 10, fontWeight: '700', color: '#FBBF24', backgroundColor: 'rgba(251, 191, 36, 0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  leaderboardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  balanceContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(251, 191, 36, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  balanceText: { fontSize: 12, fontWeight: '700', color: '#FBBF24' },
  competeBanner: { borderRadius: 12, overflow: 'hidden', marginBottom: 8 },
  competeBannerGradient: { padding: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.3)', borderRadius: 12 },
  competeBannerIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255, 255, 255, 0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  competeBannerText: { flex: 1 },
  competeBannerTitle: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 },
  competeBannerDesc: { fontSize: 10, color: 'rgba(255, 255, 255, 0.7)' },
  bottomSpacer: { height: 24 },
});
