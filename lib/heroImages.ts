import { ImageSourcePropType } from 'react-native';

const localHeroImages: Record<string, ImageSourcePropType> = {
  'hero_1': require('@/assets/heroes/hero_1.jpg'),
  'hero_2': require('@/assets/heroes/hero_2.jpg'),
  'hero_3': require('@/assets/heroes/hero_3.jpg'),
  'hero_4': require('@/assets/heroes/hero_4.jpg'),
  'hero_5': require('@/assets/heroes/hero_5.jpg'),
  'hero_6': require('@/assets/heroes/hero_6.jpg'),
  'hero_7': require('@/assets/heroes/hero_7.jpg'),
  'hero_8': require('@/assets/heroes/hero_8.jpg'),
  'hero_9': require('@/assets/heroes/hero_9.jpg'),
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
