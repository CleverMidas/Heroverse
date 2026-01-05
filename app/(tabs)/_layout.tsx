import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Home, Users, Settings, Trophy } from 'lucide-react-native';
import { GameProvider } from '@/contexts/GameContext';

function TabBarIcon({ icon: Icon, color, focused }: { icon: any; color: string; focused: boolean }) {
  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
      <Icon color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <GameProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: '#FBBF24',
          tabBarInactiveTintColor: '#64748B',
          tabBarLabelStyle: styles.tabBarLabel,
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
    </GameProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0F172A',
    borderTopColor: 'rgba(100, 116, 139, 0.2)',
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  iconContainer: {
    padding: 4,
  },
  iconContainerFocused: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 8,
  },
});
