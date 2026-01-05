import { ImageSourcePropType } from 'react-native';

const localHeroImages: Record<string, ImageSourcePropType> = {
  'hero_1': require('@/assets/hero_1.png'),
  'hero_2': require('@/assets/hero_2.png'),
  'hero_3': require('@/assets/hero_3.png'),
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
