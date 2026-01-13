import { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, ImageBackground, Dimensions, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { Trophy, Crown, Coins, Users, Zap, ChevronRight, X, Sparkles, Layers, TrendingUp } from 'lucide-react-native';
import { Profile } from '@/types/database';

const { width, height } = Dimensions.get('window');
const backgroundImage = require('@/assets/home_bg.jpg');

interface LeaderboardEntry extends Profile { rank: number; hourly_rate: number; owned_heroes: number }
type TimeFilter = 'all' | 'weekly' | 'daily';

const FILTER_LABELS: Record<TimeFilter, string> = { all: 'All Time', weekly: 'Weekly', daily: 'Daily' };
const FILTER_DESCRIPTIONS: Record<TimeFilter, string> = { all: 'All time rankings', weekly: 'Active this week', daily: 'Active today' };

const formatShortNumber = (num: number): string => {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return num.toString();
};

const formatCompactNumber = (num: number): string => num < 100_000 ? num.toLocaleString() : formatShortNumber(num);

export default function LeaderboardScreen() {
  const { user, profile } = useAuth();
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [showTipsModal, setShowTipsModal] = useState(false);

  const handleTipPress = useCallback((action: TipAction) => {
    setShowTipsModal(false);
    if (action === 'heroes') {
      router.push('/(tabs)/heroes');
    } else if (action === 'mystery') {
      router.push({ pathname: '/(tabs)/heroes', params: { openMystery: 'true' } });
    }
  }, [router]);

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
        const userIds = (data as Profile[]).map(p => p.id);
        const [{ data: activeHeroData }, { data: ownedHeroData }] = await Promise.all([
          supabase.from('user_heroes').select('user_id, heroes!inner(hero_rarities!inner(supercash_per_hour))').in('user_id', userIds).eq('is_active', true),
          supabase.from('user_heroes').select('user_id').in('user_id', userIds)
        ]);
        const hourlyRates: Record<string, number> = {};
        const ownedHeroesCount: Record<string, number> = {};
        activeHeroData?.forEach((h: any) => {
          hourlyRates[h.user_id] = (hourlyRates[h.user_id] || 0) + (h.heroes?.hero_rarities?.supercash_per_hour || 0);
        });
        ownedHeroData?.forEach((h: any) => {
          ownedHeroesCount[h.user_id] = (ownedHeroesCount[h.user_id] || 0) + 1;
        });
        const rankedData = (data as Profile[]).map((entry, index) => ({
          ...entry,
          rank: index + 1,
          hourly_rate: hourlyRates[entry.id] || 0,
          owned_heroes: ownedHeroesCount[entry.id] || 0
        }));
        setLeaderboard(rankedData);
        setUserRank(user ? rankedData.find(e => e.id === user.id)?.rank ?? null : null);
      }
    } catch { setLeaderboard([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, [user, timeFilter, getTimeFilterDate]);

  useEffect(() => { fetchLeaderboard(); }, [user]);
  useEffect(() => { setLoading(true); fetchLeaderboard(timeFilter); }, [timeFilter]);

  const { totalPlayers, totalSC, topScore } = useMemo(() => ({
    totalPlayers: leaderboard.length,
    totalSC: leaderboard.reduce((sum, e) => sum + e.supercash_balance, 0),
    topScore: leaderboard[0]?.supercash_balance || 0,
  }), [leaderboard]);

  const overlayColor = isDark ? 'rgba(10, 15, 30, 0.88)' : 'rgba(248, 250, 252, 0.75)';

  if (loading) {
    return (
      <ImageBackground source={backgroundImage} style={{ flex: 1, width, height }} resizeMode="cover">
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
    <ImageBackground source={backgroundImage} style={{ flex: 1, width, height }} resizeMode="cover">
      <View style={{ flex: 1, backgroundColor: overlayColor }}>
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView style={{ flex: 1, paddingHorizontal: 8, paddingTop: 6 }} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchLeaderboard(timeFilter); }} tintColor={theme.colors.primary} />}>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <StatCard icon={Users} color={theme.colors.primary} value={totalPlayers} label="Players" theme={theme} />
              <StatCard icon={Trophy} color={theme.colors.success} value={userRank || '-'} label="Your Rank" theme={theme} />
              <StatCard icon={Coins} color={theme.colors.purple} value={totalSC >= 1000 ? `${(totalSC / 1000).toFixed(0)}K` : totalSC} label="Total SC" theme={theme} />
              <StatCard icon={Zap} color={theme.colors.info} value={topScore?.toLocaleString() || '-'} label="Top Score" theme={theme} />
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
              {(['all', 'weekly', 'daily'] as TimeFilter[]).map(filter => (
                <TouchableOpacity key={filter} onPress={() => setTimeFilter(filter)} style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, backgroundColor: timeFilter === filter ? 'rgba(251, 191, 36, 0.15)' : theme.colors.card, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: timeFilter === filter ? theme.colors.primary : theme.colors.cardBorder }}>
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
              <GoldenLeaderboard entries={leaderboard} currentUserId={user?.id} />
            )}
            <TouchableOpacity style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 8 }} onPress={() => setShowTipsModal(true)}>
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
          <RankUpTipsModal visible={showTipsModal} onClose={() => setShowTipsModal(false)} onTipPress={handleTipPress} theme={theme} />
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

type TipAction = 'heroes' | 'mystery';
const RANK_UP_TIPS: { icon: any; color: string; title: string; description: string; action: TipAction }[] = [
  { icon: Zap, color: '#22C55E', title: 'Activate Heroes', description: 'Active heroes earn SuperCash every hour. More active heroes = faster earnings!', action: 'heroes' },
  { icon: Sparkles, color: '#8B5CF6', title: 'Get Rare Heroes', description: 'Higher rarity heroes earn more SC/hr. Open Mystery Boxes for a chance at legendary heroes!', action: 'mystery' },
  { icon: Layers, color: '#3B82F6', title: 'Stack Duplicates', description: 'Duplicate heroes stack and multiply your earnings. Each copy adds to your hourly rate!', action: 'mystery' },
];

const RankUpTipsModal = ({ visible, onClose, onTipPress, theme }: { visible: boolean; onClose: () => void; onTipPress: (action: TipAction) => void; theme: any }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={{ flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <View style={{ backgroundColor: theme.colors.modalBackground, borderRadius: 20, padding: 24, width: '100%', maxWidth: 340, borderWidth: 2, borderColor: 'rgba(34, 197, 94, 0.3)' }}>
        <TouchableOpacity style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, padding: 6 }} onPress={onClose}>
          <X color={theme.colors.textSecondary} size={24} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(34, 197, 94, 0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
            <TrendingUp color="#22C55E" size={32} />
          </View>
          <Text style={{ fontSize: 22, fontWeight: '800', color: theme.colors.text, marginBottom: 4 }}>How to Rank Up</Text>
          <Text style={{ fontSize: 12, color: theme.colors.textSecondary, textAlign: 'center' }}>Follow these tips to climb the leaderboard!</Text>
        </View>
        <View style={{ gap: 12 }}>
          {RANK_UP_TIPS.map((tip, index) => (
            <TouchableOpacity key={index} onPress={() => onTipPress(tip.action)} style={{ flexDirection: 'row', backgroundColor: theme.colors.surfaceSecondary, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: theme.colors.cardBorder }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: `${tip.color}20`, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                <tip.icon color={tip.color} size={22} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.text, marginBottom: 4 }}>{tip.title}</Text>
                <Text style={{ fontSize: 11, color: theme.colors.textSecondary, lineHeight: 16 }}>{tip.description}</Text>
              </View>
              <View style={{ justifyContent: 'center' }}>
                <ChevronRight color={theme.colors.textSecondary} size={18} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={{ marginTop: 20, backgroundColor: '#22C55E', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }} onPress={onClose}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>Got it!</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const GoldenLeaderboard = ({ entries, currentUserId }: { entries: LeaderboardEntry[]; currentUserId?: string }) => (
  <View style={{ marginBottom: 18, borderWidth: 3, borderColor: '#D4A54A', borderRadius: 16, backgroundColor: 'rgba(20, 20, 35, 0.95)', padding: 12, shadowColor: '#FFD700', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 14, paddingVertical: 8 }}>
      <Crown color="#FFD700" size={24} style={{ marginRight: 10 }} />
      <Text style={{ fontSize: 20, fontWeight: '900', color: '#FFD700', letterSpacing: 2, textShadowColor: 'rgba(255, 215, 0, 0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 }}>LEADERBOARD</Text>
    </View>
    <View style={{ gap: 8 }}>
      {entries.map((entry) => {
        const isCurrentUser = currentUserId === entry.id;
        const isTop3 = entry.rank <= 3;
        const rankColor = entry.rank === 1 ? '#FFD700' : entry.rank === 2 ? '#C0C0C0' : entry.rank === 3 ? '#CD7F32' : '#8B7355';
        return (
          <View key={entry.id} style={{ overflow: 'hidden', borderRadius: 25 }}>
            <LinearGradient colors={isCurrentUser ? ['#FFD700', '#FFA500', '#CC8400'] : ['#D4A54A', '#B8860B', '#8B6914']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 25, borderWidth: isCurrentUser ? 2 : 1, borderColor: isCurrentUser ? '#FFD700' : '#8B6914' }}>
              <View style={{ width: 28, minWidth: 28, alignItems: 'center', marginRight: 6 }}>
                {isTop3 ? (
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: rankColor, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF', shadowColor: rankColor, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.8, shadowRadius: 4 }}>
                    <Text style={{ fontSize: 11, fontWeight: '900', color: entry.rank === 2 ? '#333' : '#FFF' }}>{entry.rank}</Text>
                  </View>
                ) : (
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#4A3728' }}>{entry.rank}</Text>
                )}
              </View>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isTop3 ? rankColor : '#6B5344', justifyContent: 'center', alignItems: 'center', marginRight: 10, borderWidth: 2, borderColor: '#FFF' }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: entry.rank === 2 ? '#333' : '#FFF' }}>{(entry.username || 'A')[0].toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#3D2914', textTransform: 'uppercase' }} numberOfLines={1}>{entry.username || 'Anonymous'}</Text>
                  {isCurrentUser && (
                    <View style={{ backgroundColor: '#DC2626', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#FFF' }}>
                      <Text style={{ fontSize: 9, fontWeight: '900', color: '#FFF' }}>YOU</Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontSize: 10, fontWeight: '600', color: '#5D4A3A', marginTop: 2 }}>🏆 {entry.owned_heroes} hero{entry.owned_heroes !== 1 ? 's' : ''}</Text>
              </View>
              <View style={{ width: 75, alignItems: 'center', marginRight: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(34, 197, 94, 0.25)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                  <Zap color="#15803D" size={11} />
                  <Text style={{ fontSize: 11, fontWeight: '900', color: '#15803D', marginLeft: 3 }}>+{formatShortNumber(entry.hourly_rate)}/hr</Text>
                </View>
              </View>
              <View style={{ width: 80, alignItems: 'flex-end' }}>
                <View style={{ backgroundColor: 'rgba(61, 41, 20, 0.3)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center' }}>
                  <Coins color="#3D2914" size={12} />
                  <Text style={{ fontSize: 13, fontWeight: '900', color: '#3D2914', marginLeft: 4 }}>{formatCompactNumber(entry.supercash_balance)}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        );
      })}
    </View>
  </View>
);
