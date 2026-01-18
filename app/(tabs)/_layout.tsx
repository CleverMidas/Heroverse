import { useMemo } from 'react';
import { Tabs, usePathname } from 'expo-router';
import { View, Text, Platform, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Home, Users, Settings, Trophy, Coins, Sun, Moon, Gift } from 'lucide-react-native';
import { GameProvider, useGame } from '@/contexts/GameContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { formatNumber } from '@/lib/format';

const PAGE_INFO: Record<string, { title: string; icon: typeof Home }> = {
  '/': { title: 'Home', icon: Home },
  '/index': { title: 'Home', icon: Home },
  '/heroes': { title: 'My Heroes', icon: Users },
  '/leaderboard': { title: 'Leaderboard', icon: Trophy },
  '/daily-spin': { title: 'Daily Spin', icon: Gift },
  '/settings': { title: 'Settings', icon: Settings },
};

const TabBarIcon = ({ icon: Icon, color, focused }: { icon: typeof Home; color: string; focused: boolean }) => (
  <View style={[s.tabIconWrap, focused && s.tabIconFocused]}><Icon color={color} size={28} strokeWidth={focused ? 2.5 : 2} /></View>
);

function Header() {
  const pathname = usePathname();
  const { profile, user } = useAuth();
  const { pendingSupercash } = useGame();
  const { theme, isDark, toggleTheme } = useTheme();
  const { title, icon: PageIcon } = PAGE_INFO[pathname] || PAGE_INFO['/'];
  const balance = formatNumber(profile?.supercash_balance || 0);
  const username = profile?.username || user?.email?.split('@')[0] || 'Hero';

  return (
    <View style={[s.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.divider }]}>
      <View style={s.headerLeft}><View style={s.pageIconWrap}><PageIcon color={theme.colors.primary} size={26} strokeWidth={2.5} /></View><View><Text style={[s.headerTitle, { color: theme.colors.text }]}>{title}</Text><Text style={[s.headerSub, { color: theme.colors.textSecondary }]}>{username}</Text></View></View>
      <View style={s.headerRight}><View style={s.balanceBadge}><Coins color={theme.colors.primary} size={18} /><Text style={[s.balanceText, { color: theme.colors.primary }]}>{balance}</Text></View>{pendingSupercash > 0 && <View style={[s.pendingBadge, { backgroundColor: theme.colors.successLight }]}><Text style={[s.pendingText, { color: theme.colors.success }]}>+{formatNumber(pendingSupercash)}</Text></View>}<TouchableOpacity onPress={toggleTheme} style={[s.themeBtn, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(251, 191, 36, 0.15)' }]}>{isDark ? <Sun color="#FBBF24" size={20} /> : <Moon color="#8B5CF6" size={20} />}</TouchableOpacity></View>
    </View>
  );
}

function TabLayoutContent() {
  const { theme } = useTheme();
  const isIOS = Platform.OS === 'ios';

  const screenOptions = useMemo(() => ({
    headerShown: false,
    tabBarShowLabel: false,
    tabBarStyle: { backgroundColor: theme.colors.tabBar, borderTopColor: theme.colors.tabBarBorder, borderTopWidth: 1, height: isIOS ? 90 : 70, paddingBottom: isIOS ? 34 : 18, paddingTop: 8 },
    tabBarItemStyle: { justifyContent: 'flex-start' as const, paddingTop: 5 },
    tabBarActiveTintColor: theme.colors.activeTab,
    tabBarInactiveTintColor: theme.colors.inactiveTab,
  }), [theme, isIOS]);

  return (
    <View style={[s.container, { backgroundColor: theme.colors.background }]}><SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.surface }}><Header /></SafeAreaView><View style={s.flex1}><Tabs screenOptions={screenOptions}><Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, focused }) => <TabBarIcon icon={Home} color={color} focused={focused} /> }} /><Tabs.Screen name="heroes" options={{ title: 'My Heroes', tabBarIcon: ({ color, focused }) => <TabBarIcon icon={Users} color={color} focused={focused} /> }} /><Tabs.Screen name="leaderboard" options={{ title: 'Ranks', tabBarIcon: ({ color, focused }) => <TabBarIcon icon={Trophy} color={color} focused={focused} /> }} /><Tabs.Screen name="daily-spin" options={{ title: 'Spin', tabBarIcon: ({ color, focused }) => <TabBarIcon icon={Gift} color={color} focused={focused} /> }} /><Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color, focused }) => <TabBarIcon icon={Settings} color={color} focused={focused} /> }} /></Tabs></View></View>
  );
}

export default function TabLayout() {
  return <GameProvider><TabLayoutContent /></GameProvider>;
}

const s = StyleSheet.create({
  container: { flex: 1 },
  flex1: { flex: 1 },
  tabIconWrap: { padding: 8 },
  tabIconFocused: { backgroundColor: 'rgba(251, 191, 36, 0.15)', borderRadius: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  pageIconWrap: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(251, 191, 36, 0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  headerSub: { fontSize: 14, marginTop: 3 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  balanceBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(251, 191, 36, 0.1)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 24 },
  balanceText: { fontSize: 16, fontWeight: '700' },
  pendingBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  pendingText: { fontSize: 12, fontWeight: '600' },
  themeBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
});
