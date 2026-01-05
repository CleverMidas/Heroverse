import { ImageSourcePropType } from 'react-native';

const localHeroImages: Record<string, ImageSourcePropType> = {
  'hero_1': require('@/assets/hero_1.png'),
  'hero_2a': require('@/assets/hero_2a.png'),
  'heroverse_hero3': require('@/assets/heroverse_hero3.png'),
};

export function getHeroImageSource(imageUrl: string | null): ImageSourcePropType {
  if (!imageUrl) {
    return { uri: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=400' };
  }

  if (imageUrl.startsWith('local:')) {
    const localKey = imageUrl.replace('local:', '');
    if (localHeroImages[localKey]) {
      return localHeroImages[localKey];
    }
  }

  return { uri: imageUrl };
}
