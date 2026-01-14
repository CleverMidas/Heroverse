import { useState, useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet, ImageSourcePropType, ImageStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';

interface SkeletonImageProps {
  source: ImageSourcePropType;
  style: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain';
}

export function SkeletonImage({ source, style, resizeMode = 'cover' }: SkeletonImageProps) {
  const [loaded, setLoaded] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const { theme } = useTheme();

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.5, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    if (!loaded) pulse.start();
    return () => pulse.stop();
  }, [loaded, pulseAnim]);

  return (
    <View style={[style as any, { backgroundColor: theme.colors.surface, overflow: 'hidden' }]}>
      {!loaded && (
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.textMuted, opacity: pulseAnim }]}>
          <LinearGradient colors={['transparent', 'rgba(255,255,255,0.1)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
      )}
      <Image source={source} style={[s.img, !loaded && s.hidden]} resizeMode={resizeMode} onLoad={() => setLoaded(true)} />
    </View>
  );
}

const s = StyleSheet.create({
  img: { width: '100%', height: '100%' },
  hidden: { position: 'absolute', opacity: 0 },
});
