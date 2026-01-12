import { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Dimensions, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useGame } from '@/contexts/GameContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Zap, TrendingUp, Clock, Coins, ChevronRight, Sparkles, Gift, Target, Layers } from 'lucide-react-native';
import { getHeroImageSource } from '@/lib/heroImages';

const { width, height } = Dimensions.get('window');
const backgroundImage = require('@/assets/home_bg.jpg');

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
};

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { stackedHeroes, pendingSupercash, collectSupercash } = useGame();
  const { theme, isDark } = useTheme();

  const { totalEarningRate, activeHeroCount, totalHeroCount, activeStacks } = useMemo(() => ({
    totalEarningRate: stackedHeroes.reduce((sum, s) => sum + s.totalEarningRate, 0),
    activeHeroCount: stackedHeroes.reduce((sum, s) => sum + s.activeCount, 0),
    totalHeroCount: stackedHeroes.reduce((sum, s) => sum + s.count, 0),
    activeStacks: stackedHeroes.filter(s => s.isAnyActive).slice(0, 5),
  }), [stackedHeroes]);

  const balance = formatNumber(profile?.supercash_balance || 0);
  const overlayColor = isDark ? 'rgba(10, 15, 30, 0.85)' : 'rgba(248, 250, 252, 0.75)';

  return (
    <ImageBackground source={backgroundImage} style={{ flex: 1, width, height }} resizeMode="cover">
      <View style={{ flex: 1, backgroundColor: overlayColor }}>
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
            <View style={{ borderRadius: 24, overflow: 'hidden', marginTop: 12, marginBottom: 16, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 }}>
              <LinearGradient colors={theme.gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingHorizontal: 20, paddingVertical: 24, position: 'relative' }}>
                <View style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255, 255, 255, 0.25)' }} />
                <View style={{ position: 'relative', zIndex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#78350F', letterSpacing: 2 }}>TOTAL </Text>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#1C1917', letterSpacing: 2 }}>BALANCE</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', marginBottom: 20 }}>
                    <Text style={{ fontSize: 24, fontWeight: '400', color: '#78350F', marginTop: 6, marginRight: 2 }}>$</Text>
                    <Text style={{ fontSize: 48, fontWeight: '800', color: '#1C1917', letterSpacing: -1 }}>{balance}</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: 'rgba(0, 0, 0, 0.4)', marginTop: 10, marginLeft: 6 }}>SC</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <StatItem icon={TrendingUp} color="#166534" value={`+${formatNumber(totalEarningRate)}`} label="/hr" />
                    <Divider />
                    <StatItem icon={Layers} color="#78350F" value={totalHeroCount} label=" Heroes" />
                    <Divider />
                    <StatItem icon={Zap} color="#1D4ED8" value={activeHeroCount} label=" Active" />
                  </View>
                </View>
              </LinearGradient>
            </View>

            {pendingSupercash > 0 && (
              <TouchableOpacity style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 16 }} onPress={collectSupercash}>
                <LinearGradient colors={theme.gradients.success} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={{ fontSize: 11, fontWeight: '500', color: 'rgba(255, 255, 255, 0.8)', marginBottom: 2 }}>Ready to Collect</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Sparkles color="#FFFFFF" size={20} />
                        <Text style={{ fontSize: 22, fontWeight: '700', color: '#FFFFFF' }}>+{formatNumber(pendingSupercash)}</Text>
                      </View>
                    </View>
                    <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>COLLECT</Text>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}

            <SectionHeader title="Daily Quests" actionText="View All" theme={theme} />
            <DailyQuestsCard theme={theme} />

            <SectionHeader title="Active Heroes" actionText="See All" theme={theme} onPress={() => router.push('/(tabs)/heroes')} />
            {activeHeroCount === 0 ? (
              <EmptyHeroesCard theme={theme} onPress={() => router.push('/(tabs)/heroes')} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16, gap: 10 }}>
                {activeStacks.map(stack => <HeroCard key={stack.hero_id} stack={stack} theme={theme} />)}
              </ScrollView>
            )}

            <View style={{ marginBottom: 20, marginTop: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.text }}>Quick Stats</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                <QuickStatCard icon={Coins} color={theme.colors.primary} value={formatNumber(totalEarningRate)} label="SC/hr" theme={theme} />
                <QuickStatCard icon={Zap} color={theme.colors.success} value={totalHeroCount} label="Heroes" theme={theme} />
                <QuickStatCard icon={TrendingUp} color={theme.colors.info} value={activeHeroCount} label="Active" theme={theme} />
                <QuickStatCard icon={Clock} color={theme.colors.purple} value={formatNumber(pendingSupercash)} label="Pending" theme={theme} />
              </View>
            </View>
            <View style={{ height: 24 }} />
          </ScrollView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const StatItem = ({ icon: Icon, color, value, label }: { icon: any; color: string; value: string | number; label: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
    <View style={{ width: 26, height: 26, borderRadius: 7, backgroundColor: 'rgba(0, 0, 0, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
      <Icon color={color} size={14} />
    </View>
    <Text style={{ fontSize: 12, color: 'rgba(0, 0, 0, 0.5)' }}>
      <Text style={{ fontWeight: '700', color: '#1C1917' }}>{value}</Text>
      <Text style={{ color }}>{label}</Text>
    </Text>
  </View>
);

const Divider = () => <View style={{ width: 1, height: 20, backgroundColor: 'rgba(0, 0, 0, 0.15)', marginHorizontal: 12 }} />;

const SectionHeader = ({ title, actionText, theme, onPress }: { title: string; actionText: string; theme: any; onPress?: () => void }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
    <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.text }}>{title}</Text>
    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }} onPress={onPress}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.primary }}>{actionText}</Text>
      <ChevronRight color={theme.colors.primary} size={16} />
    </TouchableOpacity>
  </View>
);

const DailyQuestsCard = ({ theme }: { theme: any }) => (
  <View style={{ backgroundColor: theme.colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: theme.colors.cardBorder, marginBottom: 20 }}>
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(251, 191, 36, 0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
          <Target color={theme.colors.primary} size={20} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.text }}>Daily Progress</Text>
          <Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>2/5 Completed</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.colors.successLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
          <Gift color={theme.colors.success} size={16} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.success }}>+50</Text>
        </View>
      </View>
      <View style={{ height: 6, backgroundColor: theme.colors.surfaceSecondary, borderRadius: 3, overflow: 'hidden' }}>
        <View style={{ height: '100%', backgroundColor: theme.colors.primary, borderRadius: 3, width: '40%' }} />
      </View>
    </View>
    <View style={{ gap: 8 }}>
      <QuestItem completed text="Login Daily" reward="+10 SC" theme={theme} />
      <QuestItem completed text="Collect Earnings" reward="+10 SC" theme={theme} />
      <QuestItem text="Activate 3 Heroes" reward="+30 SC" theme={theme} />
    </View>
  </View>
);

const QuestItem = ({ completed, text, reward, theme }: { completed?: boolean; text: string; reward: string; theme: any }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
    <View style={{ width: 20, height: 20, borderRadius: 6, backgroundColor: completed ? theme.colors.success : 'transparent', borderWidth: 2, borderColor: completed ? theme.colors.success : theme.colors.cardBorder, justifyContent: 'center', alignItems: 'center' }}>
      {completed && <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFFFFF' }}>✓</Text>}
    </View>
    <Text style={{ flex: 1, fontSize: 12, color: completed ? theme.colors.textSecondary : theme.colors.text, textDecorationLine: completed ? 'line-through' : 'none' }}>{text}</Text>
    <Text style={{ fontSize: 11, fontWeight: '600', color: theme.colors.primary }}>{reward}</Text>
  </View>
);

const EmptyHeroesCard = ({ theme, onPress }: { theme: any; onPress: () => void }) => (
  <View style={{ backgroundColor: theme.colors.card, borderRadius: 14, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.cardBorder, marginBottom: 20 }}>
    <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.surfaceSecondary, justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
      <Zap color={theme.colors.textMuted} size={32} />
    </View>
    <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 6 }}>No Active Heroes</Text>
    <Text style={{ fontSize: 12, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 18, marginBottom: 16 }}>Visit My Heroes to activate a hero and start earning SuperCash!</Text>
    <TouchableOpacity style={{ backgroundColor: theme.colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }} onPress={onPress}>
      <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A' }}>Go to My Heroes</Text>
    </TouchableOpacity>
  </View>
);

const HeroCard = ({ stack, theme }: { stack: any; theme: any }) => (
  <View style={{ width: 120, height: 170, borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: stack.hero.hero_rarities.color_hex }}>
    <Image source={getHeroImageSource(stack.hero.image_url)} style={{ width: '100%', height: '100%', position: 'absolute' }} />
    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} locations={[0.3, 1]} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
    {stack.count > 1 && (
      <View style={{ position: 'absolute', top: 6, left: 6, zIndex: 10, backgroundColor: theme.colors.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
        <Text style={{ fontSize: 10, fontWeight: '900', color: '#0F172A' }}>{stack.count}X</Text>
      </View>
    )}
    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10 }}>
      <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF', marginBottom: 6, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }} numberOfLines={1}>{stack.hero.name}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, backgroundColor: stack.hero.hero_rarities.color_hex + '30' }}>
          <Text style={{ fontSize: 8, fontWeight: '700', color: stack.hero.hero_rarities.color_hex }}>{stack.hero.hero_rarities.name}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(251,191,36,0.2)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 }}>
          <Coins color={theme.colors.primary} size={10} />
          <Text style={{ fontSize: 9, fontWeight: '700', color: theme.colors.primary }}>{stack.hero.hero_rarities.supercash_per_hour}/hr</Text>
        </View>
      </View>
    </View>
  </View>
);

const QuickStatCard = ({ icon: Icon, color, value, label, theme }: { icon: any; color: string; value: string | number; label: string; theme: any }) => (
  <View style={{ flex: 1, backgroundColor: theme.colors.card, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: color }}>
    <Icon color={color} size={18} />
    <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.text, marginTop: 6, marginBottom: 2 }}>{value}</Text>
    <Text style={{ fontSize: 10, color: theme.colors.textSecondary }}>{label}</Text>
  </View>
);
