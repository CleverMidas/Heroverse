import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';

function RootLayoutNav() {
  const { session, loading, mfaChecking, mfaVerified } = useAuth();
  const { theme, isDark } = useTheme();
  const segments = useSegments();
  const router = useRouter();
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    setInitialLoading(false);
  }, [loading]);

  useEffect(() => {
    if (loading || mfaChecking) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && mfaVerified && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, loading, mfaChecking, segments, mfaVerified]);

  if (initialLoading) {
    return (<View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}><ActivityIndicator size="large" color={theme.colors.primary} /></View>);
  }

  return (<><Stack screenOptions={{ headerShown: false }}><Stack.Screen name="(auth)" /><Stack.Screen name="(tabs)" /><Stack.Screen name="+not-found" /></Stack><StatusBar style={isDark ? 'light' : 'dark'} /></>);
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
