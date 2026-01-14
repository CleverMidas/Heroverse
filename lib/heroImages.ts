import { ImageSourcePropType } from 'react-native';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const STORAGE_URL = `${SUPABASE_URL}/storage/v1/object/public/heroes`;
const FALLBACK_IMAGE = `${STORAGE_URL}/hero_1.jpg`;

export function getHeroImageSource(imageUrl: string | null): ImageSourcePropType {
  if (!imageUrl) {
    return { uri: FALLBACK_IMAGE };
  }
  
  if (imageUrl.startsWith('http')) {
    return { uri: imageUrl };
  }
  
  return { uri: `${STORAGE_URL}/${imageUrl}` };
}

export function getHeroStorageUrl(filename: string): string {
  return `${STORAGE_URL}/${filename}`;
}
