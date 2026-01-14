import { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, ImageBackground, Dimensions, Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { formatShortNumber, formatCompactNumber } from '@/lib/format';
import { StatCard } from '@/components/ui';
import { Trophy, Crown, Coins, Users, Zap, ChevronRight, X, Sparkles, Layers, TrendingUp } from 'lucide-react-native';
import { Profile } from '@/types/database';

const { width, height } = Dimensions.get('window');
const BG = require('@/assets/home_bg.jpg');

interface LeaderboardEntry extends Profile { rank: number; hourly_rate: number; owned_heroes: number }
type TimeFilter = 'all' | 'weekly' | 'daily';
type TipAction = 'heroes' | 'mystery';

const FILTER_LABELS: Record<TimeFilter, string> = { all: 'All Time', weekly: 'Weekly', daily: 'Daily' };
const FILTER_DESCRIPTIONS: Record<TimeFilter, string> = { all: 'All time rankings', weekly: 'Active this week', daily: 'Active today' };
const RANK_UP_TIPS: { icon: any; color: string; title: string; description: string; action: TipAction }[] = [
  { icon: Zap, color: '#22C55E', title: 'Activate Heroes', description: 'Active heroes earn SuperCash every hour. More active heroes = faster earnings!', action: 'heroes' },
  { icon: Sparkles, color: '#8B5CF6', title: 'Get Rare Heroes', description: 'Higher rarity heroes earn more SC/hr. Open Mystery Boxes for a chance at legendary heroes!', action: 'mystery' },
  { icon: Layers, color: '#3B82F6', title: 'Stack Duplicates', description: 'Duplicate heroes stack and multiply your earnings. Each copy adds to your hourly rate!', action: 'mystery' },
];

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
    if (action === 'heroes') router.push('/(tabs)/heroes');
    else if (action === 'mystery') router.push({ pathname: '/(tabs)/heroes', params: { openMystery: 'true' } });
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
        activeHeroData?.forEach((h: any) => { hourlyRates[h.user_id] = (hourlyRates[h.user_id] || 0) + (h.heroes?.hero_rarities?.supercash_per_hour || 0); });
        ownedHeroData?.forEach((h: any) => { ownedHeroesCount[h.user_id] = (ownedHeroesCount[h.user_id] || 0) + 1; });
        const rankedData = (data as Profile[]).map((entry, index) => ({ ...entry, rank: index + 1, hourly_rate: hourlyRates[entry.id] || 0, owned_heroes: ownedHeroesCount[entry.id] || 0 }));
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
      <ImageBackground source={BG} style={s.bg} resizeMode="cover"><View style={[s.overlay, { backgroundColor: overlayColor }]}><SafeAreaView style={s.loadCenter}><ActivityIndicator size="large" color={theme.colors.primary} /><Text style={[s.loadText, { color: theme.colors.textSecondary }]}>Loading Leaderboard...</Text></SafeAreaView></View></ImageBackground>
    );
  }

  return (
    <ImageBackground source={BG} style={s.bg} resizeMode="cover">
      <View style={[s.overlay, { backgroundColor: overlayColor }]}>
        <SafeAreaView style={s.flex1}>
          <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchLeaderboard(timeFilter); }} tintColor={theme.colors.primary} />}>
            <View style={s.statsRow}>
              <StatCard icon={Users} color={theme.colors.primary} value={totalPlayers} label="Players" theme={theme} />
              <StatCard icon={Trophy} color={theme.colors.success} value={userRank || '-'} label="Your Rank" theme={theme} />
              <StatCard icon={Coins} color={theme.colors.purple} value={totalSC >= 1000 ? `${(totalSC / 1000).toFixed(0)}K` : totalSC} label="Total SC" theme={theme} />
              <StatCard icon={Zap} color={theme.colors.info} value={topScore?.toLocaleString() || '-'} label="Top Score" theme={theme} />
            </View>
            <View style={s.filterRow}>
              {(['all', 'weekly', 'daily'] as TimeFilter[]).map(filter => (
                <TouchableOpacity key={filter} onPress={() => setTimeFilter(filter)} style={[s.filterBtn, { backgroundColor: timeFilter === filter ? 'rgba(251, 191, 36, 0.15)' : theme.colors.card, borderColor: timeFilter === filter ? theme.colors.primary : theme.colors.cardBorder }]}><Text style={[s.filterText, { color: timeFilter === filter ? theme.colors.primary : theme.colors.textMuted }]}>{FILTER_LABELS[filter]}</Text></TouchableOpacity>
              ))}
            </View>
            <Text style={[s.filterDesc, { color: theme.colors.textSecondary }]}>{FILTER_DESCRIPTIONS[timeFilter]}</Text>
            {leaderboard.length === 0 ? (
              <View style={[s.emptyCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder }]}><Trophy color={theme.colors.textMuted} size={48} /><Text style={[s.emptyTitle, { color: theme.colors.text }]}>No Players Found</Text><Text style={[s.emptyDesc, { color: theme.colors.textSecondary }]}>{timeFilter === 'daily' ? 'No players have been active today yet' : timeFilter === 'weekly' ? 'No players have been active this week' : 'No players on the leaderboard yet'}</Text></View>
            ) : (
              <GoldenLeaderboard entries={leaderboard} currentUserId={user?.id} />
            )}
            <TouchableOpacity style={s.climbBtn} onPress={() => setShowTipsModal(true)}>
              <LinearGradient colors={['rgba(34, 197, 94, 0.3)', 'rgba(22, 163, 74, 0.3)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.climbGrad}>
                <View style={s.climbIcon}><Trophy color="#FFFFFF" size={22} /></View>
                <View style={s.flex1}><Text style={s.climbTitle}>Climb the Ranks</Text><Text style={s.climbSub}>Earn more SuperCash to rank higher</Text></View>
                <ChevronRight color="#FFFFFF" size={18} />
              </LinearGradient>
            </TouchableOpacity>
            <View style={s.spacer} />
          </ScrollView>
          <RankUpTipsModal visible={showTipsModal} onClose={() => setShowTipsModal(false)} onTipPress={handleTipPress} theme={theme} />
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const RankUpTipsModal = ({ visible, onClose, onTipPress, theme }: { visible: boolean; onClose: () => void; onTipPress: (action: TipAction) => void; theme: any }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={[s.modalBg, { backgroundColor: theme.colors.overlay }]}><View style={[s.modalCard, { backgroundColor: theme.colors.modalBackground }]}>
      <TouchableOpacity style={s.closeBtn} onPress={onClose}><X color={theme.colors.textSecondary} size={24} /></TouchableOpacity>
      <View style={s.modalHeader}><View style={s.modalHeaderIcon}><TrendingUp color="#22C55E" size={32} /></View><Text style={[s.modalTitle, { color: theme.colors.text }]}>How to Rank Up</Text><Text style={[s.modalSub, { color: theme.colors.textSecondary }]}>Follow these tips to climb the leaderboard!</Text></View>
      <View style={s.tipsGap}>{RANK_UP_TIPS.map((tip, index) => (<TouchableOpacity key={index} onPress={() => onTipPress(tip.action)} style={[s.tipRow, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.cardBorder }]}><View style={[s.tipIcon, { backgroundColor: `${tip.color}20` }]}><tip.icon color={tip.color} size={22} /></View><View style={s.flex1}><Text style={[s.tipTitle, { color: theme.colors.text }]}>{tip.title}</Text><Text style={[s.tipDesc, { color: theme.colors.textSecondary }]}>{tip.description}</Text></View><View style={s.tipChev}><ChevronRight color={theme.colors.textSecondary} size={18} /></View></TouchableOpacity>))}</View>
      <TouchableOpacity style={s.gotItBtn} onPress={onClose}><Text style={s.gotItText}>Got it!</Text></TouchableOpacity>
    </View></View>
  </Modal>
);

const GoldenLeaderboard = ({ entries, currentUserId }: { entries: LeaderboardEntry[]; currentUserId?: string }) => (
  <View style={s.goldenContainer}>
    <View style={s.goldenHeader}><Crown color="#FFD700" size={24} style={s.crownIcon} /><Text style={s.goldenTitle}>LEADERBOARD</Text></View>
    <View style={s.goldenGap}>
      {entries.map((entry) => {
        const isCurrentUser = currentUserId === entry.id;
        const isTop3 = entry.rank <= 3;
        const rankColor = entry.rank === 1 ? '#FFD700' : entry.rank === 2 ? '#C0C0C0' : entry.rank === 3 ? '#CD7F32' : '#8B7355';
        return (
          <View key={entry.id} style={s.entryWrap}>
            <LinearGradient colors={isCurrentUser ? ['#FFD700', '#FFA500', '#CC8400'] : ['#D4A54A', '#B8860B', '#8B6914']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.entryGrad, { borderWidth: isCurrentUser ? 2 : 1, borderColor: isCurrentUser ? '#FFD700' : '#8B6914' }]}>
              <View style={s.rankCol}>
                {isTop3 ? <View style={[s.rankBadge, { backgroundColor: rankColor, shadowColor: rankColor }]}><Text style={[s.rankBadgeText, { color: entry.rank === 2 ? '#333' : '#FFF' }]}>{entry.rank}</Text></View> : <Text style={s.rankText}>{entry.rank}</Text>}
              </View>
              <View style={[s.avatar, { backgroundColor: isTop3 ? rankColor : '#6B5344' }]}><Text style={[s.avatarText, { color: entry.rank === 2 ? '#333' : '#FFF' }]}>{(entry.username || 'A')[0].toUpperCase()}</Text></View>
              <View style={s.userCol}>
                <View style={s.usernameRow}><Text style={s.username} numberOfLines={1}>{entry.username || 'Anonymous'}</Text>{isCurrentUser && <View style={s.youBadge}><Text style={s.youText}>YOU</Text></View>}</View>
                <Text style={s.heroCount}>🏆 {entry.owned_heroes} hero{entry.owned_heroes !== 1 ? 's' : ''}</Text>
              </View>
              <View style={s.hourlyCol}><View style={s.hourlyBadge}><Zap color="#15803D" size={11} /><Text style={s.hourlyText}>+{formatShortNumber(entry.hourly_rate)}/hr</Text></View></View>
              <View style={s.scCol}><View style={s.scBadge}><Coins color="#3D2914" size={12} /><Text style={s.scText}>{formatCompactNumber(entry.supercash_balance)}</Text></View></View>
            </LinearGradient>
          </View>
        );
      })}
    </View>
  </View>
);

const s = StyleSheet.create({
  bg: { flex: 1, width, height },
  overlay: { flex: 1 },
  flex1: { flex: 1 },
  scroll: { flex: 1, paddingHorizontal: 8, paddingTop: 6 },
  spacer: { height: 24 },
  loadCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadText: { fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  filterBtn: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
  filterText: { fontSize: 12, fontWeight: '600' },
  filterDesc: { fontSize: 11, textAlign: 'center', marginBottom: 12 },
  emptyCard: { borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, marginBottom: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  emptyDesc: { fontSize: 12, textAlign: 'center' },
  climbBtn: { borderRadius: 12, overflow: 'hidden', marginBottom: 8 },
  climbGrad: { padding: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.3)', borderRadius: 12 },
  climbIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255, 255, 255, 0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  climbTitle: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 },
  climbSub: { fontSize: 10, color: 'rgba(255, 255, 255, 0.7)' },
  modalBg: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { borderRadius: 20, padding: 24, width: '100%', maxWidth: 340, borderWidth: 2, borderColor: 'rgba(34, 197, 94, 0.3)' },
  closeBtn: { position: 'absolute', top: 12, right: 12, zIndex: 10, padding: 6 },
  modalHeader: { alignItems: 'center', marginBottom: 20 },
  modalHeaderIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(34, 197, 94, 0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  modalSub: { fontSize: 12, textAlign: 'center' },
  tipsGap: { gap: 12 },
  tipRow: { flexDirection: 'row', borderRadius: 14, padding: 14, borderWidth: 1 },
  tipIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  tipTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  tipDesc: { fontSize: 11, lineHeight: 16 },
  tipChev: { justifyContent: 'center' },
  gotItBtn: { marginTop: 20, backgroundColor: '#22C55E', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  gotItText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  goldenContainer: { marginBottom: 18, borderWidth: 3, borderColor: '#D4A54A', borderRadius: 16, backgroundColor: 'rgba(20, 20, 35, 0.95)', padding: 12, shadowColor: '#FFD700', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  goldenHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 14, paddingVertical: 8 },
  crownIcon: { marginRight: 10 },
  goldenTitle: { fontSize: 20, fontWeight: '900', color: '#FFD700', letterSpacing: 2 },
  goldenGap: { gap: 8 },
  entryWrap: { overflow: 'hidden', borderRadius: 25 },
  entryGrad: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 25 },
  rankCol: { width: 28, minWidth: 28, alignItems: 'center', marginRight: 6 },
  rankBadge: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.8, shadowRadius: 4 },
  rankBadgeText: { fontSize: 11, fontWeight: '900' },
  rankText: { fontSize: 14, fontWeight: '800', color: '#4A3728' },
  avatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 10, borderWidth: 2, borderColor: '#FFF' },
  avatarText: { fontSize: 14, fontWeight: '800' },
  userCol: { flex: 1, justifyContent: 'center' },
  usernameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  username: { fontSize: 13, fontWeight: '800', color: '#3D2914', textTransform: 'uppercase' },
  youBadge: { backgroundColor: '#DC2626', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#FFF' },
  youText: { fontSize: 9, fontWeight: '900', color: '#FFF' },
  heroCount: { fontSize: 10, fontWeight: '600', color: '#5D4A3A', marginTop: 2 },
  hourlyCol: { width: 75, alignItems: 'center', marginRight: 6 },
  hourlyBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(34, 197, 94, 0.25)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  hourlyText: { fontSize: 11, fontWeight: '900', color: '#15803D', marginLeft: 3 },
  scCol: { width: 80, alignItems: 'flex-end' },
  scBadge: { backgroundColor: 'rgba(61, 41, 20, 0.3)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
  scText: { fontSize: 13, fontWeight: '900', color: '#3D2914', marginLeft: 4 },
});
