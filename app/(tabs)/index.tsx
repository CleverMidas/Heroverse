import { useMemo, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Dimensions, ImageBackground, Modal, TextInput, ActivityIndicator, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useGame } from '@/contexts/GameContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { formatNumber, formatDate } from '@/lib/format';
import { StatItem, Divider, QuickStatCard } from '@/components/ui';
import { Zap, TrendingUp, Clock, Coins, ChevronRight, Sparkles, Gift, Target, Layers, X, Send, ArrowUpRight, ArrowDownLeft, History, User, AlertCircle, CheckCircle } from 'lucide-react-native';
import { getHeroImageSource } from '@/lib/heroImages';
import { Transaction, TransactionType } from '@/types/database';

const { width, height } = Dimensions.get('window');
const backgroundImage = require('@/assets/home_bg.jpg');

const TX_ICONS: Record<TransactionType, any> = { send: ArrowUpRight, receive: ArrowDownLeft, collect: Sparkles, mystery_box: Gift, referral_bonus: User, daily_bonus: Target, quest_reward: Target, admin_bonus: Gift, daily_spin: Sparkles };
const TX_LABELS: Record<TransactionType, (u?: string | null) => string> = {
  send: u => `Sent to ${u || 'User'}`, receive: u => `Received from ${u || 'User'}`, collect: () => 'Hero Earnings',
  mystery_box: () => 'Mystery Box', referral_bonus: () => 'Referral Bonus', daily_bonus: () => 'Daily Bonus', quest_reward: () => 'Quest Reward', admin_bonus: () => 'Bonus', daily_spin: () => 'Daily Spin Reward'
};

export default function HomeScreen() {
  const router = useRouter();
  const { profile, refreshProfile } = useAuth();
  const { stackedHeroes, pendingSupercash, collectSupercash } = useGame();
  const { theme, isDark } = useTheme();
  const [showTxModal, setShowTxModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [sendForm, setSendForm] = useState({ username: '', amount: '', message: '' });
  const [sendState, setSendState] = useState({ loading: false, error: null as string | null, success: null as string | null });

  const stats = useMemo(() => ({
    earning: stackedHeroes.reduce((s, h) => s + h.totalEarningRate, 0),
    active: stackedHeroes.reduce((s, h) => s + h.activeCount, 0),
    total: stackedHeroes.reduce((s, h) => s + h.count, 0),
    stacks: stackedHeroes.filter(s => s.isAnyActive).slice(0, 5),
  }), [stackedHeroes]);

  const fetchTx = useCallback(async () => {
    setLoadingTx(true);
    const { data } = await (supabase.rpc as any)('get_transaction_history', { limit_count: 100 });
    if (data) setTransactions(data);
    setLoadingTx(false);
  }, []);

  const handleSend = async () => {
    const { username, amount, message } = sendForm;
    if (!username.trim()) return setSendState(s => ({ ...s, error: 'Please enter a username' }));
    const amt = parseInt(amount);
    if (isNaN(amt) || amt <= 0) return setSendState(s => ({ ...s, error: 'Please enter a valid amount' }));
    if (amt > (profile?.supercash_balance || 0)) return setSendState(s => ({ ...s, error: 'Insufficient balance' }));
    setSendState({ loading: true, error: null, success: null });
    const { data, error } = await (supabase.rpc as any)('send_supercash', { recipient_username: username.trim(), send_amount: amt, message: message.trim() || null });
    if (error || !data?.success) { setSendState({ loading: false, error: data?.error || error?.message || 'Failed', success: null }); return; }
    setSendState({ loading: false, error: null, success: `Sent ${amt} SC to ${data.recipient}` });
    setSendForm({ username: '', amount: '', message: '' });
    refreshProfile();
    setTimeout(() => { setShowSendModal(false); setSendState(s => ({ ...s, success: null })); }, 2000);
  };

  const closeSendModal = () => { setShowSendModal(false); setSendForm({ username: '', amount: '', message: '' }); setSendState({ loading: false, error: null, success: null }); };

  const renderTx = ({ item }: { item: Transaction }) => {
    const Icon = TX_ICONS[item.type as TransactionType] || Coins;
    const color = item.amount > 0 ? '#22C55E' : item.amount < 0 ? '#EF4444' : '#6B7280';
    return (
      <View style={[s.txRow, { borderBottomColor: theme.colors.cardBorder }]}>
        <View style={[s.txIcon, { backgroundColor: `${color}15` }]}><Icon color={color} size={22} /></View>
        <View style={s.flex1}><Text style={[s.txLabel, { color: theme.colors.text }]}>{TX_LABELS[item.type as TransactionType]?.(item.related_username) || 'Transaction'}</Text><Text style={[s.txDate, { color: theme.colors.textSecondary }]}>{formatDate(item.created_at)}</Text></View>
        <View style={s.txAmountWrap}><Text style={[s.txAmount, { color }]}>{item.amount > 0 ? '+' : ''}{formatNumber(item.amount)} SC</Text><Text style={[s.txBal, { color: theme.colors.textMuted }]}>Bal: {formatNumber(item.balance_after)}</Text></View>
      </View>
    );
  };

  return (
    <ImageBackground source={backgroundImage} style={s.bg} resizeMode="cover">
      <View style={[s.overlay, { backgroundColor: isDark ? 'rgba(10,15,30,0.85)' : 'rgba(248,250,252,0.75)' }]}>
        <SafeAreaView style={s.flex1}>
          <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
            <TouchableOpacity onPress={() => { setShowTxModal(true); fetchTx(); }} activeOpacity={0.9} style={[s.balanceCard, { shadowColor: theme.colors.primary }]}>
              <LinearGradient colors={theme.gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.balanceGrad}>
                <View style={s.balanceCircle} />
                <View style={s.balanceContent}>
                  <View style={s.balanceHeader}><Text style={s.balanceLabel}>TOTAL</Text><Text style={s.balanceLabelDark}>BALANCE</Text></View>
                  <View style={s.balanceRow}><Text style={s.balanceNum}>{formatNumber(profile?.supercash_balance || 0)}</Text><Text style={s.balanceSc}>SC</Text></View>
                  <View style={s.statsRow}><StatItem icon={TrendingUp} color="#166534" value={`+${formatNumber(stats.earning)}`} label="/hr" /><Divider /><StatItem icon={Layers} color="#78350F" value={stats.total} label="Heroes" /><Divider /><StatItem icon={Zap} color="#1D4ED8" value={stats.active} label="Active" /></View>
                  <View style={s.tapHint}><History color="#78350F" size={14} /><Text style={s.tapHintText}>Tap to view transaction history</Text></View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
            {pendingSupercash > 0 && (
              <TouchableOpacity style={s.collectBtn} onPress={collectSupercash}>
                <LinearGradient colors={theme.gradients.success} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.collectGrad}>
                  <View><Text style={s.collectLabel}>Ready to Collect</Text><View style={s.collectRow}><Sparkles color="#FFF" size={20} /><Text style={s.collectAmt}>+{formatNumber(pendingSupercash)}</Text></View></View>
                  <View style={s.collectAction}><Text style={s.collectActionText}>COLLECT</Text></View>
                </LinearGradient>
              </TouchableOpacity>
            )}
            <SectionHeader title="Daily Quests" action="View All" theme={theme} />
            <DailyQuests theme={theme} />
            <SectionHeader title="Active Heroes" action="See All" theme={theme} onPress={() => router.push('/(tabs)/heroes')} />
            {stats.active === 0 ? <EmptyHeroes theme={theme} onPress={() => router.push('/(tabs)/heroes')} /> : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.heroScroll}>{stats.stacks.map(st => <HeroCard key={st.hero_id} stack={st} theme={theme} />)}</ScrollView>
            )}
            <View style={s.quickSection}><Text style={[s.sectionTitle, { color: theme.colors.text }]}>Quick Stats</Text><View style={s.quickRow}>
              <QuickStatCard icon={Coins} color={theme.colors.primary} value={formatNumber(stats.earning)} label="SC/hr" theme={theme} />
              <QuickStatCard icon={Zap} color={theme.colors.success} value={stats.total} label="Heroes" theme={theme} />
              <QuickStatCard icon={TrendingUp} color={theme.colors.info} value={stats.active} label="Active" theme={theme} />
              <QuickStatCard icon={Clock} color={theme.colors.purple} value={formatNumber(pendingSupercash)} label="Pending" theme={theme} />
            </View></View>
            <View style={s.spacer} />
          </ScrollView>
        </SafeAreaView>
      </View>
      <Modal visible={showTxModal} transparent animationType="slide" onRequestClose={() => setShowTxModal(false)}>
        <View style={[s.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <View style={[s.txModal, { backgroundColor: theme.colors.modalBackground }]}>
            <View style={[s.txHeader, { borderBottomColor: theme.colors.cardBorder }]}>
              <View style={s.row}><View style={s.txHeaderIcon}><History color={theme.colors.primary} size={24} /></View><View><Text style={[s.txTitle, { color: theme.colors.text }]}>Transactions</Text><Text style={[s.txSub, { color: theme.colors.textSecondary }]}>Your recent activity</Text></View></View>
              <TouchableOpacity onPress={() => setShowTxModal(false)} style={s.closeBtn}><X color={theme.colors.textSecondary} size={24} /></TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => { setShowTxModal(false); setShowSendModal(true); }} style={s.sendBtn}><LinearGradient colors={['#3B82F6', '#2563EB']} style={s.sendGrad}><Send color="#FFF" size={20} /><Text style={s.sendText}>Send SuperCash</Text></LinearGradient></TouchableOpacity>
            {loadingTx ? <View style={s.center}><ActivityIndicator size="large" color={theme.colors.primary} /></View> : transactions.length === 0 ? (
              <View style={s.emptyTx}><History color={theme.colors.textMuted} size={48} /><Text style={[s.emptyTitle, { color: theme.colors.text }]}>No transactions yet</Text><Text style={[s.emptySub, { color: theme.colors.textSecondary }]}>Your transaction history will appear here</Text></View>
            ) : <FlatList data={transactions} keyExtractor={i => i.id} renderItem={renderTx} contentContainerStyle={s.txList} showsVerticalScrollIndicator={false} />}
          </View>
        </View>
      </Modal>
      <Modal visible={showSendModal} transparent animationType="fade" onRequestClose={closeSendModal}>
        <View style={[s.modalCenter, { backgroundColor: theme.colors.overlay }]}>
          <View style={[s.sendModal, { backgroundColor: theme.colors.modalBackground }]}>
            <View style={s.sendHeader}><View style={s.row}><View style={s.sendHeaderIcon}><Send color="#3B82F6" size={24} /></View><Text style={[s.sendTitle, { color: theme.colors.text }]}>Send SuperCash</Text></View><TouchableOpacity onPress={closeSendModal} style={s.p4}><X color={theme.colors.textSecondary} size={24} /></TouchableOpacity></View>
            {sendState.error && <View style={s.errorBox}><AlertCircle color="#EF4444" size={18} /><Text style={s.errorText}>{sendState.error}</Text></View>}
            {sendState.success && <View style={s.successBox}><CheckCircle color="#22C55E" size={18} /><Text style={s.successText}>{sendState.success}</Text></View>}
            <View style={s.inputGroup}><Text style={[s.label, { color: theme.colors.text }]}>Recipient Username</Text><View style={[s.inputRow, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.cardBorder }]}><User color={theme.colors.textSecondary} size={20} /><TextInput style={[s.input, { color: theme.colors.text }]} placeholder="Enter username" placeholderTextColor={theme.colors.textMuted} value={sendForm.username} onChangeText={t => setSendForm(f => ({ ...f, username: t }))} autoCapitalize="none" /></View></View>
            <View style={s.inputGroup}><Text style={[s.label, { color: theme.colors.text }]}>Amount</Text><View style={[s.inputRow, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.cardBorder }]}><Coins color={theme.colors.primary} size={20} /><TextInput style={[s.input, { color: theme.colors.text }]} placeholder="0" placeholderTextColor={theme.colors.textMuted} value={sendForm.amount} onChangeText={t => setSendForm(f => ({ ...f, amount: t }))} keyboardType="number-pad" /><Text style={[s.scLabel, { color: theme.colors.primary }]}>SC</Text></View><Text style={[s.availText, { color: theme.colors.textSecondary }]}>Available: {formatNumber(profile?.supercash_balance || 0)} SC</Text></View>
            <View style={s.inputGroupLast}><Text style={[s.label, { color: theme.colors.text }]}>Message (optional)</Text><TextInput style={[s.msgInput, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.cardBorder, color: theme.colors.text }]} placeholder="Add a note..." placeholderTextColor={theme.colors.textMuted} value={sendForm.message} onChangeText={t => setSendForm(f => ({ ...f, message: t }))} multiline numberOfLines={2} /></View>
            <TouchableOpacity onPress={handleSend} disabled={sendState.loading || !sendForm.username.trim() || !sendForm.amount} style={[s.sendActionBtn, (!sendForm.username.trim() || !sendForm.amount || sendState.loading) && s.disabled]}><LinearGradient colors={['#3B82F6', '#2563EB']} style={s.sendActionGrad}>{sendState.loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.sendActionText}>Send SuperCash</Text>}</LinearGradient></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const SectionHeader = ({ title, action, theme, onPress }: any) => (
  <View style={s.sectionHeader}><Text style={[s.sectionTitle, { color: theme.colors.text }]}>{title}</Text><TouchableOpacity style={s.sectionAction} onPress={onPress}><Text style={[s.actionText, { color: theme.colors.primary }]}>{action}</Text><ChevronRight color={theme.colors.primary} size={16} /></TouchableOpacity></View>
);

const DailyQuests = ({ theme }: any) => (
  <View style={[s.questCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder }]}>
    <View style={s.questHeader}><View style={s.questIcon}><Target color={theme.colors.primary} size={20} /></View><View style={s.flex1}><Text style={[s.questTitle, { color: theme.colors.text }]}>Daily Progress</Text><Text style={[s.questSub, { color: theme.colors.textSecondary }]}>2/5 Completed</Text></View><View style={[s.questBadge, { backgroundColor: theme.colors.successLight }]}><Gift color={theme.colors.success} size={16} /><Text style={[s.questBadgeText, { color: theme.colors.success }]}>+50</Text></View></View>
    <View style={[s.progressBg, { backgroundColor: theme.colors.surfaceSecondary }]}><View style={[s.progressFill, { backgroundColor: theme.colors.primary }]} /></View>
    <View style={s.questList}><QuestItem done text="Login Daily" reward="+10 SC" theme={theme} /><QuestItem done text="Collect Earnings" reward="+10 SC" theme={theme} /><QuestItem text="Activate 3 Heroes" reward="+30 SC" theme={theme} /></View>
  </View>
);

const QuestItem = ({ done, text, reward, theme }: any) => (
  <View style={s.questItem}><View style={[s.questCheck, done && { backgroundColor: theme.colors.success, borderColor: theme.colors.success }]}>{done && <Text style={s.checkMark}>✓</Text>}</View><Text style={[s.questText, { color: done ? theme.colors.textSecondary : theme.colors.text }, done && s.strikethrough]}>{text}</Text><Text style={[s.questReward, { color: theme.colors.primary }]}>{reward}</Text></View>
);

const EmptyHeroes = ({ theme, onPress }: any) => (
  <View style={[s.emptyCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder }]}><View style={[s.emptyIcon, { backgroundColor: theme.colors.surfaceSecondary }]}><Zap color={theme.colors.textMuted} size={32} /></View><Text style={[s.emptyTitle, { color: theme.colors.text }]}>No Active Heroes</Text><Text style={[s.emptySub, { color: theme.colors.textSecondary }]}>Visit My Heroes to activate a hero and start earning SuperCash!</Text><TouchableOpacity style={[s.emptyBtn, { backgroundColor: theme.colors.primary }]} onPress={onPress}><Text style={s.emptyBtnText}>Go to My Heroes</Text></TouchableOpacity></View>
);

const HeroCard = ({ stack, theme }: any) => (
  <View style={[s.heroCard, { borderColor: stack.hero.hero_rarities.color_hex }]}><Image source={getHeroImageSource(stack.hero.image_url)} style={s.heroImg} /><LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} locations={[0.3, 1]} style={s.heroGrad} />{stack.count > 1 && <View style={[s.heroBadge, { backgroundColor: theme.colors.primary }]}><Text style={s.heroBadgeText}>{stack.count}X</Text></View>}<View style={s.heroInfo}><Text style={s.heroName} numberOfLines={1}>{stack.hero.name}</Text><View style={s.heroMeta}><View style={[s.rarityBadge, { backgroundColor: stack.hero.hero_rarities.color_hex + '30' }]}><Text style={[s.rarityText, { color: stack.hero.hero_rarities.color_hex }]}>{stack.hero.hero_rarities.name}</Text></View><View style={s.scBadge}><Coins color={theme.colors.primary} size={10} /><Text style={[s.scText, { color: theme.colors.primary }]}>{stack.hero.hero_rarities.supercash_per_hour}/hr</Text></View></View></View></View>
);

const s = StyleSheet.create({
  bg: { flex: 1, width, height },
  overlay: { flex: 1 },
  flex1: { flex: 1 },
  scroll: { flex: 1, paddingHorizontal: 16 },
  spacer: { height: 24 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  p4: { padding: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  disabled: { opacity: 0.6 },
  balanceCard: { borderRadius: 24, overflow: 'hidden', marginTop: 12, marginBottom: 16, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  balanceGrad: { paddingHorizontal: 20, paddingVertical: 24, position: 'relative' },
  balanceCircle: { position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.25)' },
  balanceContent: { position: 'relative', zIndex: 1 },
  balanceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 },
  balanceLabel: { fontSize: 15, fontWeight: '800', color: '#78350F', letterSpacing: 2 },
  balanceLabelDark: { fontSize: 15, fontWeight: '800', color: '#1C1917', letterSpacing: 2 },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginBottom: 20 },
  balanceNum: { fontSize: 48, fontWeight: '800', color: '#1C1917', letterSpacing: -1 },
  balanceSc: { fontSize: 22, fontWeight: '800', color: '#92400E', marginLeft: 8 },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  tapHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, gap: 4 },
  tapHintText: { fontSize: 11, fontWeight: '600', color: '#78350F' },
  collectBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 16 },
  collectGrad: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  collectLabel: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.8)', marginBottom: 2 },
  collectRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  collectAmt: { fontSize: 22, fontWeight: '700', color: '#FFF' },
  collectAction: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  collectActionText: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  actionText: { fontSize: 12, fontWeight: '600' },
  questCard: { borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 20 },
  questHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  questIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(251,191,36,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  questTitle: { fontSize: 13, fontWeight: '700' },
  questSub: { fontSize: 11 },
  questBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  questBadgeText: { fontSize: 12, fontWeight: '700' },
  progressBg: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 12 },
  progressFill: { height: '100%', borderRadius: 3, width: '40%' },
  questList: { gap: 8 },
  questItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  questCheck: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  checkMark: { fontSize: 10, fontWeight: '700', color: '#FFF' },
  questText: { flex: 1, fontSize: 12 },
  strikethrough: { textDecorationLine: 'line-through' },
  questReward: { fontSize: 11, fontWeight: '600' },
  emptyCard: { borderRadius: 14, padding: 24, alignItems: 'center', borderWidth: 1, marginBottom: 20 },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  emptySub: { fontSize: 12, textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  emptyBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  emptyBtnText: { fontSize: 12, fontWeight: '700', color: '#0F172A' },
  heroScroll: { paddingRight: 16, gap: 10 },
  heroCard: { width: 120, height: 170, borderRadius: 12, overflow: 'hidden', borderWidth: 2 },
  heroImg: { width: '100%', height: '100%', position: 'absolute' },
  heroGrad: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroBadge: { position: 'absolute', top: 6, left: 6, zIndex: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  heroBadgeText: { fontSize: 10, fontWeight: '900', color: '#0F172A' },
  heroInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10 },
  heroName: { fontSize: 12, fontWeight: '800', color: '#FFF', marginBottom: 6 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rarityBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  rarityText: { fontSize: 8, fontWeight: '700' },
  scBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(251,191,36,0.2)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  scText: { fontSize: 9, fontWeight: '700' },
  quickSection: { marginBottom: 20, marginTop: 20 },
  quickRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  modalOverlay: { flex: 1 },
  txModal: { flex: 1, marginTop: 60, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  txHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1 },
  txHeaderIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(251,191,36,0.15)', justifyContent: 'center', alignItems: 'center' },
  txTitle: { fontSize: 18, fontWeight: '700' },
  txSub: { fontSize: 12 },
  closeBtn: { padding: 8 },
  sendBtn: { margin: 16, marginBottom: 8 },
  sendGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, gap: 8 },
  sendText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  txList: { paddingHorizontal: 16, paddingBottom: 40 },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  txIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  txLabel: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  txDate: { fontSize: 11 },
  txAmountWrap: { alignItems: 'flex-end' },
  txAmount: { fontSize: 16, fontWeight: '700' },
  txBal: { fontSize: 10 },
  emptyTx: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  modalCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  sendModal: { borderRadius: 20, padding: 24, width: '100%', maxWidth: 360 },
  sendHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  sendHeaderIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(59,130,246,0.15)', justifyContent: 'center', alignItems: 'center' },
  sendTitle: { fontSize: 18, fontWeight: '700' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.1)', padding: 12, borderRadius: 10, marginBottom: 16 },
  errorText: { flex: 1, fontSize: 13, color: '#EF4444', fontWeight: '500' },
  successBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(34,197,94,0.1)', padding: 12, borderRadius: 10, marginBottom: 16 },
  successText: { flex: 1, fontSize: 13, color: '#22C55E', fontWeight: '500' },
  inputGroup: { marginBottom: 16 },
  inputGroupLast: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 14, borderWidth: 1 },
  input: { flex: 1, paddingVertical: 14, paddingHorizontal: 10, fontSize: 15 },
  scLabel: { fontSize: 14, fontWeight: '600' },
  availText: { fontSize: 11, marginTop: 6 },
  msgInput: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, borderWidth: 1, textAlignVertical: 'top' },
  sendActionBtn: { borderRadius: 12, overflow: 'hidden' },
  sendActionGrad: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  sendActionText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
