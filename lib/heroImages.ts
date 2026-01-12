import { ImageSourcePropType } from 'react-native';

const FALLBACK_IMAGE = 'https://jwacklfxfscwcmlzmcqa.supabase.co/storage/v1/object/public/heroes/hero_1.jpg';

export function getHeroImageSource(imageUrl: string | null): ImageSourcePropType {
  return { uri: imageUrl || FALLBACK_IMAGE };
}
