import { Tabs, usePathname } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Home, Users, Settings, Trophy, Coins, Zap } from 'lucide-react-native';
import { GameProvider, useGame } from '@/contexts/GameContext';
import { useAuth } from '@/contexts/AuthContext';

function TabBarIcon({ icon: Icon, color, focused }: { icon: any; color: string; focused: boolean }) {
  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
      <Icon color={color} size={28} strokeWidth={focused ? 2.5 : 2} />
    </View>
  );
}

function Header() {
  const pathname = usePathname();
  const { profile, user } = useAuth();
  const { pendingSupercash } = useGame();

  const getPageInfo = () => {
    switch (pathname) {
      case '/':
      case '/index':
        return { title: 'Home', icon: Home };
      case '/heroes':
        return { title: 'My Heroes', icon: Users };
      case '/leaderboard':
        return { title: 'Leaderboard', icon: Trophy };
      case '/settings':
        return { title: 'Settings', icon: Settings };
      default:
        return { title: 'HeroVerse', icon: Home };
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  const { title, icon: PageIcon } = getPageInfo();

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={styles.logoContainer}>
          <PageIcon color="#FBBF24" size={26} strokeWidth={2.5} />
        </View>
        <View>
          <Text style={styles.pageTitle}>{title}</Text>
          <Text style={styles.username}>
            {profile?.username || user?.email?.split('@')[0] || 'Hero'}
          </Text>
        </View>
      </View>
      <View style={styles.headerRight}>
        <View style={styles.balanceContainer}>
          <Coins color="#FBBF24" size={18} />
          <Text style={styles.balanceText}>
            {formatNumber(profile?.supercash_balance || 0)}
          </Text>
        </View>
        {pendingSupercash > 0 && (
          <View style={styles.pendingContainer}>
            <Text style={styles.pendingText}>+{formatNumber(pendingSupercash)}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function TabLayoutContent() {
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Header />
      </SafeAreaView>
      <View style={styles.content}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarShowLabel: false,
            tabBarStyle: styles.tabBar,
            tabBarActiveTintColor: '#FBBF24',
            tabBarInactiveTintColor: '#64748B',
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Home',
              tabBarIcon: ({ color, focused }) => (
                <TabBarIcon icon={Home} color={color} focused={focused} />
              ),
            }}
          />
          <Tabs.Screen
            name="heroes"
            options={{
              title: 'My Heroes',
              tabBarIcon: ({ color, focused }) => (
                <TabBarIcon icon={Users} color={color} focused={focused} />
              ),
            }}
          />
          <Tabs.Screen
            name="leaderboard"
            options={{
              title: 'Ranks',
              tabBarIcon: ({ color, focused }) => (
                <TabBarIcon icon={Trophy} color={color} focused={focused} />
              ),
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: 'Settings',
              tabBarIcon: ({ color, focused }) => (
                <TabBarIcon icon={Settings} color={color} focused={focused} />
              ),
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <GameProvider>
      <TabLayoutContent />
    </GameProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  safeArea: {
    backgroundColor: '#0F172A',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 116, 139, 0.2)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  logoContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  username: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
  },
  balanceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FBBF24',
  },
  pendingContainer: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22C55E',
  },
  tabBar: {
    backgroundColor: '#0F172A',
    borderTopColor: 'rgba(100, 116, 139, 0.2)',
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 95 : 72,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    paddingTop: 10,
  },
  iconContainer: {
    padding: 8,
  },
  iconContainerFocused: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 12,
  },
});
