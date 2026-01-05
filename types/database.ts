export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          supercash_balance: number;
          has_claimed_free_hero: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          supercash_balance?: number;
          has_claimed_free_hero?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          supercash_balance?: number;
          has_claimed_free_hero?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      hero_rarities: {
        Row: {
          id: number;
          name: string;
          tier: number;
          supercash_per_hour: number;
          color_hex: string;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          tier: number;
          supercash_per_hour: number;
          color_hex: string;
          description: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          tier?: number;
          supercash_per_hour?: number;
          color_hex?: string;
          description?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      heroes: {
        Row: {
          id: string;
          name: string;
          rarity_id: number;
          image_url: string | null;
          is_starter: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          rarity_id: number;
          image_url?: string | null;
          is_starter?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          rarity_id?: number;
          image_url?: string | null;
          is_starter?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "heroes_rarity_id_fkey";
            columns: ["rarity_id"];
            isOneToOne: false;
            referencedRelation: "hero_rarities";
            referencedColumns: ["id"];
          }
        ];
      };
      user_heroes: {
        Row: {
          id: string;
          user_id: string;
          hero_id: string;
          is_active: boolean;
          is_revealed: boolean;
          activated_at: string | null;
          last_collected_at: string | null;
          acquired_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          hero_id: string;
          is_active?: boolean;
          is_revealed?: boolean;
          activated_at?: string | null;
          last_collected_at?: string | null;
          acquired_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          hero_id?: string;
          is_active?: boolean;
          is_revealed?: boolean;
          activated_at?: string | null;
          last_collected_at?: string | null;
          acquired_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_heroes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_heroes_hero_id_fkey";
            columns: ["hero_id"];
            isOneToOne: false;
            referencedRelation: "heroes";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      calculate_pending_supercash: {
        Args: { p_user_id: string };
        Returns: number;
      };
      collect_supercash: {
        Args: { p_user_id: string };
        Returns: number;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type HeroRarity = Database['public']['Tables']['hero_rarities']['Row'];
export type Hero = Database['public']['Tables']['heroes']['Row'];
export type UserHero = Database['public']['Tables']['user_heroes']['Row'];

export type HeroWithRarity = Hero & {
  hero_rarities: HeroRarity;
};

export type UserHeroWithDetails = UserHero & {
  heroes: HeroWithRarity;
};
