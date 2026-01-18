import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, Modal, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Text as SvgText, Circle, G } from 'react-native-svg';
import { useAuth } from '@/contexts/AuthContext';
import { useGame } from '@/contexts/GameContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { formatNumber } from '@/lib/format';
import { Gift, Clock, Coins, Sparkles, AlertCircle, CheckCircle, Trophy, Star, RotateCw } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const WHEEL_SIZE = Math.min(width - 32, 380);
const CENTER = WHEEL_SIZE / 2;
const RADIUS = WHEEL_SIZE / 2 - 20;
const OUTER_RIM_WIDTH = 8;
const SLICE_COUNT = 30;
const SLICE_ANGLE = (2 * Math.PI) / SLICE_COUNT;

const COLOR_PATTERN = ['#22C55E', '#3B82F6', '#A855F7', '#EF4444', '#EC4899', '#FBBF24', '#F97316'];
const GOLDEN_RIM_COLOR = '#FBBF24';

const PRIZE_VALUES = [
  { type: 'hero' as const, value: 0, label: 'FREE HERO', count: 1, specialColor: '#FBBF24', preferredPosition: 5 },
  { type: 'sc' as const, value: 500, label: '500', count: 1 },
  { type: 'sc' as const, value: 150, label: '150', count: 2 },
  { type: 'sc' as const, value: 100, label: '100', count: 3 },
  { type: 'sc' as const, value: 50, label: '50', count: 4 },
  { type: 'sc' as const, value: 25, label: '25', count: 5 },
  { type: 'sc' as const, value: 15, label: '15', count: 6 },
  { type: 'sc' as const, value: 10, label: '10', count: 8, preferredPositions: [1, 4, 7, 13, 19, 24, 27, 30] },
];

const createShuffledPrizes = (): Array<{ type: 'sc' | 'hero'; value: number; label: string; color: string }> => {
  const colorMap = new Map<string, string>();
  PRIZE_VALUES.forEach(prize => {
    if (!colorMap.has(prize.label)) {
      const colorIndex = colorMap.size % COLOR_PATTERN.length;
      colorMap.set(prize.label, COLOR_PATTERN[colorIndex]);
    }
  });

  const allPrizes: Array<{ type: 'sc' | 'hero'; value: number; label: string; color: string }> = [];
  
  PRIZE_VALUES.forEach(prize => {
    const color = colorMap.get(prize.label)!;
    for (let i = 0; i < prize.count; i++) {
      allPrizes.push({
        type: prize.type,
        value: prize.value,
        label: prize.label,
        color: color,
      });
    }
  });

  const shuffled: (typeof allPrizes[0] | null)[] = new Array(SLICE_COUNT).fill(null);
  const remaining = [...allPrizes];
  
  const canPlace = (label: string, pos: number): boolean => {
    if (shuffled[pos] !== null) return false;
    const prevIdx = pos === 0 ? SLICE_COUNT - 1 : pos - 1;
    const nextIdx = pos === SLICE_COUNT - 1 ? 0 : pos + 1;
    
    if (shuffled[prevIdx]?.label === label) return false;
    if (shuffled[nextIdx]?.label === label) return false;
    
    return true;
  };
  
  const freeHeroPrize = remaining.find(p => p.label === 'FREE HERO');
  const freeHeroPosition = PRIZE_VALUES.find(p => p.label === 'FREE HERO')?.preferredPosition;
  if (freeHeroPrize && freeHeroPosition) {
    const pos = freeHeroPosition - 1;
    if (pos >= 0 && pos < SLICE_COUNT && canPlace('FREE HERO', pos)) {
      shuffled[pos] = freeHeroPrize;
      remaining.splice(remaining.indexOf(freeHeroPrize), 1);
    }
  }
  
  const tenPrizes = remaining.filter(p => p.label === '10');
  const otherPrizes = remaining.filter(p => p.label !== '10');
  
  const preferredPositions = PRIZE_VALUES.find(p => p.label === '10')?.preferredPositions || [];
  const usedIndices = new Set<number>();
  
  for (let i = 0; i < tenPrizes.length && i < preferredPositions.length; i++) {
    const pos = preferredPositions[i] - 1;
    if (pos >= 0 && pos < SLICE_COUNT && canPlace('10', pos)) {
      shuffled[pos] = tenPrizes[i];
      usedIndices.add(i);
    }
  }
  
  const remainingTens = tenPrizes.filter((_, idx) => !usedIndices.has(idx));
  const allRemaining = [...remainingTens, ...otherPrizes];
  
  const getLabelCount = (label: string): number => {
    return allRemaining.filter(p => p.label === label).length;
  };

  const getIdealSpacing = (label: string): number => {
    const count = PRIZE_VALUES.find(p => p.label === label)?.count || 1;
    return Math.floor(SLICE_COUNT / count);
  };

  const getMinDistance = (label: string, pos: number): number => {
    let minDist = SLICE_COUNT;
    for (let i = 0; i < SLICE_COUNT; i++) {
      if (shuffled[i]?.label === label) {
        const dist = Math.min(
          Math.abs(pos - i),
          Math.abs(pos - i + SLICE_COUNT),
          Math.abs(pos - i - SLICE_COUNT)
        );
        minDist = Math.min(minDist, dist);
      }
    }
    return minDist;
  };

  for (let pos = 0; pos < SLICE_COUNT; pos++) {
    if (shuffled[pos] !== null) continue;
    
    let bestCandidate: typeof allPrizes[0] | null = null;
    let bestIndex = -1;
    let bestScore = -1;
    
    for (let i = 0; i < allRemaining.length; i++) {
      const candidate = allRemaining[i];
      
      if (!canPlace(candidate.label, pos)) {
        continue;
      }
      
      const minDist = getMinDistance(candidate.label, pos);
      const idealSpacing = getIdealSpacing(candidate.label);
      const spacingScore = minDist >= idealSpacing ? 100 : (minDist / idealSpacing) * 100;
      const distanceScore = minDist * 10;
      const totalScore = spacingScore + distanceScore;
      
      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestCandidate = candidate;
        bestIndex = i;
      }
    }
    
    if (bestCandidate && bestIndex >= 0) {
      shuffled[pos] = bestCandidate;
      allRemaining.splice(bestIndex, 1);
    } else {
      for (let i = 0; i < allRemaining.length; i++) {
        const candidate = allRemaining[i];
        if (canPlace(candidate.label, pos)) {
          shuffled[pos] = candidate;
          allRemaining.splice(i, 1);
          break;
        }
      }
    }
  }

  for (let attempt = 0; attempt < 200; attempt++) {
    let improved = false;
    
    for (let i = 0; i < SLICE_COUNT; i++) {
      const prevIdx = i === 0 ? SLICE_COUNT - 1 : i - 1;
      const nextIdx = i === SLICE_COUNT - 1 ? 0 : i + 1;
      const current = shuffled[i];
      
      if (!current) continue;
      
      if (current.label === shuffled[prevIdx]?.label || current.label === shuffled[nextIdx]?.label) {
        for (let j = 0; j < SLICE_COUNT; j++) {
          if (i === j || !shuffled[j]) continue;
          
          const jPrevIdx = j === 0 ? SLICE_COUNT - 1 : j - 1;
          const jNextIdx = j === SLICE_COUNT - 1 ? 0 : j + 1;
          
          if (canPlace(current.label, j) && canPlace(shuffled[j]!.label, i)) {
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            improved = true;
            break;
          }
        }
      }
    }
    
    if (!improved) break;
  }
  
  return shuffled.filter(p => p !== null) as typeof allPrizes;
};

const PRIZES = createShuffledPrizes();

interface SpinResult {
  success: boolean;
  prize_type?: 'sc' | 'hero';
  prize_value?: number;
  hero_id?: string;
  new_balance?: number;
  error?: string;
  hours_remaining?: number;
}

export default function DailySpinScreen() {
  const { profile, refreshProfile } = useAuth();
  const { refreshHeroes } = useGame();
  const { theme } = useTheme();
  const [spinning, setSpinning] = useState(false);
  const [canSpin, setCanSpin] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [result, setResult] = useState<SpinResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const rotation = useRef(new Animated.Value(0)).current;
  const selectedPrizeIndex = useRef(0);

  useEffect(() => {
    checkSpinAvailability();
    const interval = setInterval(checkSpinAvailability, 1000);
    return () => clearInterval(interval);
  }, [profile]);

  const checkSpinAvailability = () => {
    if (!profile?.last_spin_at) {
      setCanSpin(true);
      setTimeRemaining('');
      return;
    }

    const lastSpin = new Date(profile.last_spin_at);
    const now = new Date();
    const hoursSinceSpin = (now.getTime() - lastSpin.getTime()) / (1000 * 60 * 60);

    if (hoursSinceSpin >= 24) {
      setCanSpin(true);
      setTimeRemaining('');
    } else {
      setCanSpin(false);
      const hoursLeft = 24 - hoursSinceSpin;
      const hours = Math.floor(hoursLeft);
      const minutes = Math.floor((hoursLeft - hours) * 60);
      const seconds = Math.floor(((hoursLeft - hours) * 60 - minutes) * 60);
      setTimeRemaining(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }
  };

  const performSpin = async () => {
    if (!canSpin || spinning) return;

    setSpinning(true);
    setResult(null);

    try {
      const { data, error } = await (supabase.rpc as any)('perform_daily_spin');

      if (error || !data?.success) {
        setResult({
          success: false,
          error: data?.error || error?.message || 'Failed to spin',
          hours_remaining: data?.hours_remaining,
        });
        setShowResultModal(true);
        setSpinning(false);
        return;
      }

      const prizeLabel = data.prize_type === 'hero' ? 'FREE HERO' : String(data.prize_value || 0);
      const matchingIndices: number[] = [];
      
      for (let i = 0; i < PRIZES.length; i++) {
        if (PRIZES[i].label === prizeLabel) {
          matchingIndices.push(i);
        }
      }
      
      if (matchingIndices.length > 0) {
        selectedPrizeIndex.current = matchingIndices[Math.floor(Math.random() * matchingIndices.length)];
      } else {
        selectedPrizeIndex.current = Math.floor(Math.random() * SLICE_COUNT);
      }

      const fullSpins = 5;
      const sliceCenterAngleFromTop = (selectedPrizeIndex.current + 0.5) * SLICE_ANGLE;
      const rotationToAlign = (2 * Math.PI) - sliceCenterAngleFromTop;
      const totalRotation = fullSpins * (2 * Math.PI) + rotationToAlign;

      rotation.setValue(0);
      Animated.timing(rotation, {
        toValue: totalRotation,
        duration: 3000,
        useNativeDriver: true,
      }).start(() => {
        setResult(data);
        setShowResultModal(true);
        refreshProfile();
        refreshHeroes();
        setSpinning(false);
      });
    } catch (error: any) {
      setResult({
        success: false,
        error: error?.message || 'Failed to spin the wheel',
      });
      setShowResultModal(true);
      setSpinning(false);
    }
  };

  const renderWheelSlice = (index: number) => {
    const startAngle = index * SLICE_ANGLE - Math.PI / 2;
    const endAngle = (index + 1) * SLICE_ANGLE - Math.PI / 2;
    const prize = PRIZES[index % PRIZES.length];

    const innerRadius = 30;
    const outerRadius = RADIUS;
    
    const x1Inner = CENTER + innerRadius * Math.cos(startAngle);
    const y1Inner = CENTER + innerRadius * Math.sin(startAngle);
    const x1Outer = CENTER + outerRadius * Math.cos(startAngle);
    const y1Outer = CENTER + outerRadius * Math.sin(startAngle);
    const x2Outer = CENTER + outerRadius * Math.cos(endAngle);
    const y2Outer = CENTER + outerRadius * Math.sin(endAngle);
    const x2Inner = CENTER + innerRadius * Math.cos(endAngle);
    const y2Inner = CENTER + innerRadius * Math.sin(endAngle);

    const largeArc = SLICE_ANGLE > Math.PI ? 1 : 0;

    const path = `M ${x1Inner} ${y1Inner} L ${x1Outer} ${y1Outer} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2Outer} ${y2Outer} L ${x2Inner} ${y2Inner} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x1Inner} ${y1Inner} Z`;

    return (
      <Path
        key={index}
        d={path}
        fill={prize.color}
        stroke={GOLDEN_RIM_COLOR}
        strokeWidth={1.5}
      />
    );
  };

  const renderWheelText = (index: number) => {
    const startAngle = index * SLICE_ANGLE - Math.PI / 2;
    const endAngle = (index + 1) * SLICE_ANGLE - Math.PI / 2;
    const prize = PRIZES[index % PRIZES.length];
    const textAngle = (startAngle + endAngle) / 2;
    const textRadius = RADIUS * 0.85;
    const textX = CENTER + textRadius * Math.cos(textAngle);
    const textY = CENTER + textRadius * Math.sin(textAngle);
    const rotationDeg = (textAngle * 180) / Math.PI;

    if (prize.label === 'FREE HERO') {
      return (
        <G
          key={`star-${index}`}
          transform={`translate(${textX}, ${textY}) rotate(${rotationDeg + 90})`}
        >
          <Path
            d="M0 -12L3.5 -3.5L12 -3.5L5.2 1.2L7.5 12L0 7.5L-7.5 12L-5.2 1.2L-12 -3.5L-3.5 -3.5Z"
            fill="#FFD700"
            stroke="#FFA500"
            strokeWidth={0.8}
          />
          <Path
            d="M0 -9L2.5 -2.5L9 -2.5L3.5 1.5L5.5 9L0 5.5L-5.5 9L-3.5 1.5L-9 -2.5L-2.5 -2.5Z"
            fill="#FFA500"
            stroke="none"
          />
        </G>
      );
    }

    return (
      <SvgText
        key={`text-${index}`}
        x={textX}
        y={textY}
        fontSize={16}
        fontWeight="900"
        fill="#FFFFFF"
        stroke="#000000"
        strokeWidth={1}
        textAnchor="middle"
        alignmentBaseline="middle"
        transform={`rotate(${rotationDeg + 90}, ${textX}, ${textY})`}
      >
        {prize.label}
      </SvgText>
    );
  };

  const spinRotation = rotation.interpolate({
    inputRange: [0, 10 * Math.PI],
    outputRange: ['0deg', '1800deg'],
    extrapolate: 'extend',
  });

  return (
    <SafeAreaView style={[s.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={s.scrollView} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.infoContainer}>
          <Text style={[s.infoText, { color: theme.colors.textSecondary }]}>
            Can spin only once per day
          </Text>
          {!canSpin && timeRemaining && (
            <Text style={[s.nextSpinText, { color: theme.colors.primary }]}>
              You can spin at: {timeRemaining}
            </Text>
          )}
        </View>
        <View style={s.wheelContainer}>
          <Animated.View
            style={[
              s.wheelWrapper,
              {
                transform: [{ rotate: spinRotation }],
              },
            ]}
          >
            <Svg width={WHEEL_SIZE} height={WHEEL_SIZE} viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}>
              <Circle 
                cx={CENTER} 
                cy={CENTER} 
                r={RADIUS + OUTER_RIM_WIDTH / 2} 
                fill="none" 
                stroke={GOLDEN_RIM_COLOR} 
                strokeWidth={OUTER_RIM_WIDTH}
              />
              {Array.from({ length: SLICE_COUNT }).map((_, i) => renderWheelSlice(i))}
              {Array.from({ length: SLICE_COUNT }).map((_, i) => renderWheelText(i))}
              <Circle 
                cx={CENTER} 
                cy={CENTER} 
                r={30} 
                fill="#000" 
                stroke={GOLDEN_RIM_COLOR} 
                strokeWidth={3} 
              />
              <SvgText
                x={CENTER}
                y={CENTER}
                fontSize={12}
                fontWeight="700"
                fill="#FFF"
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                SPIN
              </SvgText>
            </Svg>
          </Animated.View>

          <View style={s.pointer} />
        </View>

        <TouchableOpacity
          onPress={performSpin}
          disabled={!canSpin || spinning}
          style={[s.spinButton, (!canSpin || spinning) && s.spinButtonDisabled]}
        >
          <LinearGradient
            colors={canSpin && !spinning ? theme.gradients.primary : ['#9CA3AF', '#6B7280']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.spinButtonGrad}
          >
            {spinning ? (
              <ActivityIndicator color="#FFF" />
            ) : !canSpin && timeRemaining ? (
              <>
                <Clock color="#FFF" size={24} />
                <Text style={s.spinButtonText}>
                  Next spin available in: <Text style={s.spinButtonTime}>{timeRemaining}</Text>
                </Text>
              </>
            ) : (
              <>
                <RotateCw color="#FFF" size={24} />
                <Text style={s.spinButtonText}>SPIN THE WHEEL</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={[s.prizesCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder }]}>
          <Text style={[s.prizesTitle, { color: theme.colors.text }]}>Possible Prizes</Text>
          <View style={s.prizesGrid}>
            {PRIZE_VALUES.map((prize, idx) => {
              const prizeColor = PRIZES.find(pr => pr.label === prize.label)?.color || COLOR_PATTERN[idx % COLOR_PATTERN.length];
              return (
                <PrizeItem 
                  key={prize.label} 
                  label={prize.type === 'hero' ? 'FREE HERO' : `${prize.label} SC`} 
                  color={prizeColor} 
                  theme={theme} 
                />
              );
            })}
          </View>
        </View>
      </ScrollView>

      <Modal visible={showResultModal} transparent animationType="fade" onRequestClose={() => setShowResultModal(false)}>
        <View style={[s.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <View style={[s.resultModal, { backgroundColor: theme.colors.modalBackground }]}>
            {result?.success ? (
              <>
                <View style={[s.resultIcon, { backgroundColor: theme.colors.successLight }]}>
                  <CheckCircle color={theme.colors.success} size={48} />
                </View>
                <Text style={[s.resultTitle, { color: theme.colors.text }]}>Congratulations!</Text>
                {result.prize_type === 'sc' ? (
                  <>
                    <View style={s.resultPrize}>
                      <Coins color={theme.colors.primary} size={32} />
                      <Text style={[s.resultPrizeValue, { color: theme.colors.primary }]}>
                        +{formatNumber(result.prize_value || 0)} SC
                      </Text>
                    </View>
                    <Text style={[s.resultSubtitle, { color: theme.colors.textSecondary }]}>
                      Added to your balance
                    </Text>
                    {result.new_balance !== undefined && (
                      <Text style={[s.resultBalance, { color: theme.colors.textMuted }]}>
                        New Balance: {formatNumber(result.new_balance)} SC
                      </Text>
                    )}
                  </>
                ) : (
                  <>
                    <View style={s.resultPrize}>
                      <Gift color={theme.colors.primary} size={32} />
                      <Text style={[s.resultPrizeValue, { color: theme.colors.primary }]}>FREE HERO</Text>
                    </View>
                    <Text style={[s.resultSubtitle, { color: theme.colors.textSecondary }]}>
                      Check your heroes collection!
                    </Text>
                  </>
                )}
              </>
            ) : (
              <>
                <View style={[s.resultIcon, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                  <AlertCircle color="#EF4444" size={48} />
                </View>
                <Text style={[s.resultTitle, { color: theme.colors.text }]}>Unable to Spin</Text>
                <Text style={[s.resultSubtitle, { color: theme.colors.textSecondary }]}>
                  {result?.error || 'An error occurred'}
                </Text>
                {result?.hours_remaining && (
                  <Text style={[s.resultBalance, { color: theme.colors.textMuted }]}>
                    Please wait {result.hours_remaining.toFixed(1)} more hours
                  </Text>
                )}
              </>
            )}
            <TouchableOpacity
              onPress={() => setShowResultModal(false)}
              style={[s.resultButton, { backgroundColor: theme.colors.primary }]}
            >
              <Text style={s.resultButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const PrizeItem = ({ label, color, theme }: { label: string; color: string; theme: any }) => {
  const isFreeHero = label === 'FREE HERO';
  return (
    <View style={[s.prizeItem, { backgroundColor: color + '20', borderColor: color }]}>
      <View style={s.prizeItemContent}>
        <Text style={[s.prizeItemText, { color }]}>{label}</Text>
        {isFreeHero && (
          <Star size={18} fill="#FFD700" color="#FFA500" strokeWidth={2} style={s.prizeItemStar} />
        )}
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  infoContainer: { alignItems: 'center', marginBottom: 12, gap: 4 },
  infoText: { fontSize: 13, textAlign: 'center' },
  nextSpinText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  wheelContainer: { alignItems: 'center', marginVertical: 24, position: 'relative' },
  wheelWrapper: { width: WHEEL_SIZE, height: WHEEL_SIZE },
  pointer: {
    position: 'absolute',
    top: -10,
    left: '50%',
    marginLeft: -15,
    width: 0,
    height: 0,
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderTopWidth: 30,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#EF4444',
    zIndex: 10,
  },
  spinButton: { borderRadius: 16, overflow: 'hidden', marginBottom: 24 },
  spinButtonDisabled: { opacity: 0.6 },
  spinButtonGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 12,
  },
  spinButtonText: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  spinButtonTime: { fontSize: 18, fontWeight: '700', color: '#FFD700' },
  prizesCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginTop: 8,
  },
  prizesTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16, textAlign: 'left' },
  prizesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-start' },
  prizeItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    width: '30%',
    minWidth: 100,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prizeItemContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  prizeItemText: { fontSize: 13, fontWeight: '700' },
  prizeItemStar: { marginLeft: 4 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  resultModal: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  resultIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  resultTitle: { fontSize: 24, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  resultSubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 8 },
  resultPrize: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 16 },
  resultPrizeValue: { fontSize: 32, fontWeight: '800' },
  resultBalance: { fontSize: 12, marginTop: 8 },
  resultButton: { marginTop: 24, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  resultButtonText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});

