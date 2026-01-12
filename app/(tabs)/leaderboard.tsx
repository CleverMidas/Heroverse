import { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { Trophy, Medal, Crown, Coins, TrendingUp, Users, Zap, ChevronRight } from 'lucide-react-native';
import { Profile } from '@/types/database';

const backgroundImage = require('@/assets/home_bg.jpg');

interface LeaderboardEntry extends Profile { rank: number }
type TimeFilter = 'all' | 'weekly' | 'daily';

const FILTER_LABELS: Record<TimeFilter, string> = { all: 'All Time', weekly: 'Weekly', daily: 'Daily' };
const FILTER_DESCRIPTIONS: Record<TimeFilter, string> = { all: 'All time rankings', weekly: 'Active this week', daily: 'Active today' };

const getRankColor = (rank: number) => rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : '#64748B';
const getRankBgColor = (rank: number) => rank <= 3 ? `${getRankColor(rank)}1A` : 'transparent';
const getRankBorderColor = (rank: number) => rank <= 3 ? `${getRankColor(rank)}4D` : 'transparent';

export default function LeaderboardScreen() {
  const { user, profile } = useAuth();
  const { theme, isDark } = useTheme();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  const getTimeFilterDate = useCallback((filter: TimeFilter): string | null => {
    if (filter === 'all') return null;
    const now = new Date();
    filter === 'daily' ? now.setHours(now.getHours() - 24) : now.setDate(now.getDate() - 7);
    return now.toISOString();
  }, []);

  const fetchLeaderboard = useCallback(async (filter: TimeFilter = timeFilter) => {
    try {
      let query = supabase.from('profiles').select('*').order('supercash_balance', { ascending: false }).limit(100);
      const filterDate = getTimeFilterDate(filter);
      if (filterDate) query = query.gte('updated_at', filterDate);
      const { data, error } = await query;
      if (error) throw error;
      if (data) {
        const rankedData = (data as Profile[]).map((entry, index) => ({ ...entry, rank: index + 1 }));
        setLeaderboard(rankedData);
        setUserRank(user ? rankedData.find(e => e.id === user.id)?.rank ?? null : null);
      }
    } catch { setLeaderboard([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, [user, timeFilter, getTimeFilterDate]);

  useEffect(() => { fetchLeaderboard(); }, [user]);
  useEffect(() => { setLoading(true); fetchLeaderboard(timeFilter); }, [timeFilter]);

  const { top3, restOfLeaderboard, totalPlayers, totalSC } = useMemo(() => ({
    top3: leaderboard.slice(0, 3),
    restOfLeaderboard: leaderboard.slice(3),
    totalPlayers: leaderboard.length,
    totalSC: leaderboard.reduce((sum, e) => sum + e.supercash_balance, 0),
  }), [leaderboard]);

  const overlayColor = isDark ? 'rgba(10, 15, 30, 0.88)' : 'rgba(248, 250, 252, 0.75)';

  if (loading) {
    return (
      <ImageBackground source={backgroundImage} style={{ flex: 1 }} resizeMode="cover">
        <View style={{ flex: 1, backgroundColor: overlayColor }}>
          <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={{ fontSize: 14, color: theme.colors.textSecondary }}>Loading Leaderboard...</Text>
          </SafeAreaView>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={backgroundImage} style={{ flex: 1 }} resizeMode="cover">
      <View style={{ flex: 1, backgroundColor: overlayColor }}>
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView style={{ flex: 1, paddingHorizontal: 8, paddingTop: 6 }} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchLeaderboard(timeFilter); }} tintColor={theme.colors.primary} />}>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <StatCard icon={Users} color={theme.colors.primary} value={totalPlayers} label="Players" theme={theme} />
              <StatCard icon={Trophy} color={theme.colors.success} value={userRank || '-'} label="Your Rank" theme={theme} />
              <StatCard icon={Coins} color={theme.colors.purple} value={totalSC >= 1000 ? `${(totalSC/1000).toFixed(0)}K` : totalSC} label="Total SC" theme={theme} />
              <StatCard icon={Zap} color={theme.colors.info} value={top3[0]?.supercash_balance?.toLocaleString() || '-'} label="Top Score" theme={theme} />
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
              {(['all', 'weekly', 'daily'] as TimeFilter[]).map(filter => (
                <TouchableOpacity key={filter} style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, backgroundColor: timeFilter === filter ? 'rgba(251, 191, 36, 0.15)' : theme.colors.card, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: timeFilter === filter ? theme.colors.primary : theme.colors.cardBorder }} onPress={() => setTimeFilter(filter)}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: timeFilter === filter ? theme.colors.primary : theme.colors.textMuted }}>{FILTER_LABELS[filter]}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontSize: 11, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 12 }}>{FILTER_DESCRIPTIONS[timeFilter]}</Text>

            {leaderboard.length === 0 ? (
              <View style={{ backgroundColor: theme.colors.card, borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.cardBorder, marginBottom: 20 }}>
                <Trophy color={theme.colors.textMuted} size={48} />
                <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.text, marginTop: 16, marginBottom: 8 }}>No Players Found</Text>
                <Text style={{ fontSize: 12, color: theme.colors.textSecondary, textAlign: 'center' }}>
                  {timeFilter === 'daily' ? 'No players have been active today yet' : timeFilter === 'weekly' ? 'No players have been active this week' : 'No players on the leaderboard yet'}
                </Text>
              </View>
            ) : (
              <>
                {top3.length >= 3 && <Top3Podium top3={top3} theme={theme} />}
                {userRank && profile && userRank > 3 && <UserRankCard userRank={userRank} profile={profile} theme={theme} />}
                <RankingsList entries={restOfLeaderboard} currentUserId={user?.id} theme={theme} />
              </>
            )}

            <TouchableOpacity style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 8 }}>
              <LinearGradient colors={['rgba(34, 197, 94, 0.3)', 'rgba(22, 163, 74, 0.3)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.3)', borderRadius: 12 }}>
                <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255, 255, 255, 0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                  <Trophy color="#FFFFFF" size={22} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 }}>Climb the Ranks</Text>
                  <Text style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.7)' }}>Earn more SuperCash to rank higher</Text>
                </View>
                <ChevronRight color="#FFFFFF" size={18} />
              </LinearGradient>
            </TouchableOpacity>
            <View style={{ height: 24 }} />
          </ScrollView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const StatCard = ({ icon: Icon, color, value, label, theme }: { icon: any; color: string; value: string | number; label: string; theme: any }) => (
  <View style={{ flex: 1, backgroundColor: theme.colors.card, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: color }}>
    <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: `${color}20`, justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
      <Icon color={color} size={16} />
    </View>
    <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.text }}>{value}</Text>
    <Text style={{ fontSize: 9, color: theme.colors.textSecondary }}>{label}</Text>
  </View>
);

const Top3Podium = ({ top3, theme }: { top3: LeaderboardEntry[]; theme: any }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', marginBottom: 16, paddingHorizontal: 8 }}>
    <PodiumItem entry={top3[1]} rank={2} icon={Medal} color="#C0C0C0" size={48} iconSize={24} height={44} theme={theme} />
    <PodiumItem entry={top3[0]} rank={1} icon={Crown} color="#FFD700" size={56} iconSize={28} height={60} isFirst theme={theme} />
    <PodiumItem entry={top3[2]} rank={3} icon={Medal} color="#CD7F32" size={48} iconSize={24} height={32} theme={theme} />
  </View>
);

const PodiumItem = ({ entry, rank, icon: Icon, color, size, iconSize, height, isFirst, theme }: { entry: LeaderboardEntry; rank: number; icon: any; color: string; size: number; iconSize: number; height: number; isFirst?: boolean; theme: any }) => (
  <View style={{ flex: 1, alignItems: 'center', marginHorizontal: 4, marginBottom: isFirst ? 12 : 0 }}>
    <View style={{ width: size, height: size, borderRadius: size / 2, justifyContent: 'center', alignItems: 'center', marginBottom: 6, backgroundColor: `${color}33`, borderWidth: 2, borderColor: color }}>
      <Icon color={color} size={iconSize} />
    </View>
    <Text style={{ fontSize: isFirst ? 14 : 12, fontWeight: '800', color: isFirst ? color : theme.colors.textSecondary }}>#{rank}</Text>
    <Text style={{ fontSize: isFirst ? 12 : 11, fontWeight: isFirst ? '700' : '600', color: theme.colors.text, marginTop: 2, maxWidth: 80, textAlign: 'center' }} numberOfLines={1}>{entry?.username || 'Anonymous'}</Text>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 }}>
      <Coins color={theme.colors.primary} size={10} />
      <Text style={{ fontSize: 10, fontWeight: '600', color: theme.colors.primary }}>{(entry?.supercash_balance || 0).toLocaleString()}</Text>
    </View>
    <View style={{ width: '100%', borderRadius: 6, marginTop: 8, height, backgroundColor: `${color}4D` }} />
  </View>
);

const UserRankCard = ({ userRank, profile, theme }: { userRank: number; profile: Profile; theme: any }) => (
  <View style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.3)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ backgroundColor: 'rgba(251, 191, 36, 0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
        <Text style={{ fontSize: 14, fontWeight: '800', color: theme.colors.primary }}>#{userRank}</Text>
      </View>
      <View style={{ gap: 2 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.text }}>{profile.username || 'Anonymous'}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Coins color={theme.colors.primary} size={14} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.primary }}>{profile.supercash_balance.toLocaleString()}</Text>
        </View>
      </View>
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <TrendingUp color={theme.colors.success} size={16} />
      <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.success }}>You</Text>
    </View>
  </View>
);

const RankingsList = ({ entries, currentUserId, theme }: { entries: LeaderboardEntry[]; currentUserId?: string; theme: any }) => (
  <View style={{ marginBottom: 18 }}>
    <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.text, marginBottom: 10 }}>Rankings</Text>
    <View style={{ gap: 8 }}>
      {entries.map(entry => {
        const isCurrentUser = currentUserId === entry.id;
        return (
          <View key={entry.id} style={{ backgroundColor: isCurrentUser ? 'rgba(251, 191, 36, 0.15)' : getRankBgColor(entry.rank), borderColor: isCurrentUser ? 'rgba(251, 191, 36, 0.4)' : getRankBorderColor(entry.rank) || theme.colors.cardBorder, borderWidth: isCurrentUser ? 2 : 1, borderRadius: 12, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={{ width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10, backgroundColor: entry.rank <= 3 ? `${getRankColor(entry.rank)}33` : theme.colors.surfaceSecondary }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: getRankColor(entry.rank) }}>#{entry.rank}</Text>
              </View>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: isCurrentUser ? theme.colors.primary : theme.colors.text, flex: 1 }} numberOfLines={1}>{entry.username || 'Anonymous'}</Text>
                {isCurrentUser && <Text style={{ fontSize: 10, fontWeight: '700', color: theme.colors.primary, backgroundColor: 'rgba(251, 191, 36, 0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>You</Text>}
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(251, 191, 36, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
              <Coins color={theme.colors.primary} size={12} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.primary }}>{entry.supercash_balance.toLocaleString()}</Text>
            </View>
          </View>
        );
      })}
    </View>
  </View>
);
