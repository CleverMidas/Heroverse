export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type TransactionType = 'send' | 'receive' | 'collect' | 'mystery_box' | 'referral_bonus' | 'daily_bonus' | 'quest_reward' | 'admin_bonus' | 'daily_spin';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; username: string | null; supercash_balance: number; has_claimed_free_hero: boolean; referral_code: string | null; referred_by: string | null; referral_bonus_claimed: boolean; last_spin_at: string | null; created_at: string; updated_at: string; };
        Insert: { id: string; username?: string | null; supercash_balance?: number; has_claimed_free_hero?: boolean; referral_code?: string | null; referred_by?: string | null; referral_bonus_claimed?: boolean; last_spin_at?: string | null; created_at?: string; updated_at?: string; };
        Update: { id?: string; username?: string | null; supercash_balance?: number; has_claimed_free_hero?: boolean; referral_code?: string | null; referred_by?: string | null; referral_bonus_claimed?: boolean; last_spin_at?: string | null; created_at?: string; updated_at?: string; };
        Relationships: [];
      };
      hero_rarities: {
        Row: { id: number; name: string; tier: number; supercash_per_hour: number; color_hex: string; description: string; created_at: string; };
        Insert: { id?: number; name: string; tier: number; supercash_per_hour: number; color_hex: string; description: string; created_at?: string; };
        Update: { id?: number; name?: string; tier?: number; supercash_per_hour?: number; color_hex?: string; description?: string; created_at?: string; };
        Relationships: [];
      };
      heroes: {
        Row: { id: string; name: string; rarity_id: number; image_url: string | null; is_starter: boolean; created_at: string; };
        Insert: { id?: string; name: string; rarity_id: number; image_url?: string | null; is_starter?: boolean; created_at?: string; };
        Update: { id?: string; name?: string; rarity_id?: number; image_url?: string | null; is_starter?: boolean; created_at?: string; };
        Relationships: [{ foreignKeyName: "heroes_rarity_id_fkey"; columns: ["rarity_id"]; isOneToOne: false; referencedRelation: "hero_rarities"; referencedColumns: ["id"]; }];
      };
      user_heroes: {
        Row: { id: string; user_id: string; hero_id: string; is_active: boolean; is_revealed: boolean; activated_at: string | null; last_collected_at: string | null; acquired_at: string; power_level: number; last_power_update: string; };
        Insert: { id?: string; user_id: string; hero_id: string; is_active?: boolean; is_revealed?: boolean; activated_at?: string | null; last_collected_at?: string | null; acquired_at?: string; power_level?: number; last_power_update?: string; };
        Update: { id?: string; user_id?: string; hero_id?: string; is_active?: boolean; is_revealed?: boolean; activated_at?: string | null; last_collected_at?: string | null; acquired_at?: string; power_level?: number; last_power_update?: string; };
        Relationships: [{ foreignKeyName: "user_heroes_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"]; }, { foreignKeyName: "user_heroes_hero_id_fkey"; columns: ["hero_id"]; isOneToOne: false; referencedRelation: "heroes"; referencedColumns: ["id"]; }];
      };
      transactions: {
        Row: { id: string; user_id: string; type: TransactionType; amount: number; balance_after: number; description: string | null; related_user_id: string | null; related_username: string | null; metadata: Json; created_at: string; };
        Insert: { id?: string; user_id: string; type: TransactionType; amount: number; balance_after: number; description?: string | null; related_user_id?: string | null; related_username?: string | null; metadata?: Json; created_at?: string; };
        Update: { id?: string; user_id?: string; type?: TransactionType; amount?: number; balance_after?: number; description?: string | null; related_user_id?: string | null; related_username?: string | null; metadata?: Json; created_at?: string; };
        Relationships: [{ foreignKeyName: "transactions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"]; }];
      };
    };
    Views: { [_ in never]: never; };
    Functions: { calculate_pending_supercash: { Args: { p_user_id: string }; Returns: number; }; collect_supercash: { Args: { p_user_id: string }; Returns: number; }; };
    Enums: { [_ in never]: never; };
    CompositeTypes: { [_ in never]: never; };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type HeroRarity = Database['public']['Tables']['hero_rarities']['Row'];
export type Hero = Database['public']['Tables']['heroes']['Row'];
export type UserHero = Database['public']['Tables']['user_heroes']['Row'];
export type HeroWithRarity = Hero & { hero_rarities: HeroRarity; };
export type UserHeroWithDetails = UserHero & { heroes: HeroWithRarity; };

export type StackedHero = {
  hero_id: string;
  hero: HeroWithRarity;
  count: number;
  activeCount: number;
  totalEarningRate: number;
  isAnyActive: boolean;
  isAnyRevealed: boolean;
  instances: UserHeroWithDetails[];
  primaryInstance: UserHeroWithDetails;
  totalPower: number;
  activePower: number;
};

export type Transaction = Database['public']['Tables']['transactions']['Row'];
