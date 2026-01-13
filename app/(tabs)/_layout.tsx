import { useMemo } from 'react';
import { Tabs, usePathname } from 'expo-router';
import { View, Text, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Home, Users, Settings, Trophy, Coins, Sun, Moon } from 'lucide-react-native';
import { GameProvider, useGame } from '@/contexts/GameContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

const PAGE_INFO: Record<string, { title: string; icon: typeof Home }> = {
  '/': { title: 'Home', icon: Home },
  '/index': { title: 'Home', icon: Home },
  '/heroes': { title: 'My Heroes', icon: Users },
  '/leaderboard': { title: 'Leaderboard', icon: Trophy },
  '/settings': { title: 'Settings', icon: Settings },
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
};

const TabBarIcon = ({ icon: Icon, color, focused }: { icon: typeof Home; color: string; focused: boolean }) => (
  <View style={[{ padding: 8 }, focused && { backgroundColor: 'rgba(251, 191, 36, 0.15)', borderRadius: 12 }]}><Icon color={color} size={28} strokeWidth={focused ? 2.5 : 2} /></View>
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
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.divider }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}><View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(251, 191, 36, 0.15)', justifyContent: 'center', alignItems: 'center' }}><PageIcon color={theme.colors.primary} size={26} strokeWidth={2.5} /></View><View><Text style={{ fontSize: 22, fontWeight: '700', color: theme.colors.text }}>{title}</Text><Text style={{ fontSize: 14, color: theme.colors.textSecondary, marginTop: 3 }}>{username}</Text></View></View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(251, 191, 36, 0.1)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 24 }}><Coins color={theme.colors.primary} size={18} /><Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.primary }}>{balance}</Text></View>{pendingSupercash > 0 && (<View style={{ backgroundColor: theme.colors.successLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}><Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.success }}>+{formatNumber(pendingSupercash)}</Text></View>)}<TouchableOpacity onPress={toggleTheme} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(251, 191, 36, 0.15)', justifyContent: 'center', alignItems: 'center' }}>{isDark ? <Sun color="#FBBF24" size={20} /> : <Moon color="#8B5CF6" size={20} />}</TouchableOpacity></View>
    </View>
  );
}

function TabLayoutContent() {
  const { theme } = useTheme();
  const isIOS = Platform.OS === 'ios';

  const screenOptions = useMemo(() => ({
    headerShown: false,
    tabBarShowLabel: false,
    tabBarStyle: {
      backgroundColor: theme.colors.tabBar,
      borderTopColor: theme.colors.tabBarBorder,
      borderTopWidth: 1,
      height: isIOS ? 90 : 70,
      paddingBottom: isIOS ? 34 : 18,
      paddingTop: 8,
    },
    tabBarItemStyle: { justifyContent: 'flex-start' as const, paddingTop: 5 },
    tabBarActiveTintColor: theme.colors.activeTab,
    tabBarInactiveTintColor: theme.colors.inactiveTab,
  }), [theme, isIOS]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}><SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.surface }}><Header /></SafeAreaView><View style={{ flex: 1 }}><Tabs screenOptions={screenOptions}><Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, focused }) => <TabBarIcon icon={Home} color={color} focused={focused} /> }} /><Tabs.Screen name="heroes" options={{ title: 'My Heroes', tabBarIcon: ({ color, focused }) => <TabBarIcon icon={Users} color={color} focused={focused} /> }} /><Tabs.Screen name="leaderboard" options={{ title: 'Ranks', tabBarIcon: ({ color, focused }) => <TabBarIcon icon={Trophy} color={color} focused={focused} /> }} /><Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color, focused }) => <TabBarIcon icon={Settings} color={color} focused={focused} /> }} /></Tabs></View></View>
  );
}

export default function TabLayout() {
  return (<GameProvider><TabLayoutContent /></GameProvider>);
}
