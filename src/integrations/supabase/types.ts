export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      avatar: {
        Row: {
          brow_color: string | null
          brow_shape: string | null
          extras: Json | null
          eye_color: string | null
          eye_shape: string | null
          face_shape: string | null
          hair_color: string | null
          hair_style: string | null
          id: string
          lips_color: string | null
          lips_shape: string | null
          nose_shape: string | null
          skin: string | null
          user_id: string
        }
        Insert: {
          brow_color?: string | null
          brow_shape?: string | null
          extras?: Json | null
          eye_color?: string | null
          eye_shape?: string | null
          face_shape?: string | null
          hair_color?: string | null
          hair_style?: string | null
          id?: string
          lips_color?: string | null
          lips_shape?: string | null
          nose_shape?: string | null
          skin?: string | null
          user_id: string
        }
        Update: {
          brow_color?: string | null
          brow_shape?: string | null
          extras?: Json | null
          eye_color?: string | null
          eye_shape?: string | null
          face_shape?: string | null
          hair_color?: string | null
          hair_style?: string | null
          id?: string
          lips_color?: string | null
          lips_shape?: string | null
          nose_shape?: string | null
          skin?: string | null
          user_id?: string
        }
        Relationships: []
      }
      daily_counter: {
        Row: {
          count: number | null
          date: string
          user_id: string
        }
        Insert: {
          count?: number | null
          date: string
          user_id: string
        }
        Update: {
          count?: number | null
          date?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_outfits: {
        Row: {
          date: string
          results: Json
          user_id: string
        }
        Insert: {
          date: string
          results?: Json
          user_id: string
        }
        Update: {
          date?: string
          results?: Json
          user_id?: string
        }
        Relationships: []
      }
      last_outfit: {
        Row: {
          item_ids: Json | null
          user_id: string
        }
        Insert: {
          item_ids?: Json | null
          user_id: string
        }
        Update: {
          item_ids?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      outfits: {
        Row: {
          created_at: string | null
          id: string
          item_ids: Json | null
          name: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_ids?: Json | null
          name?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item_ids?: Json | null
          name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          brands: Json | null
          budget: number | null
          colorimetry_season: string | null
          corpulence: string | null
          favorite_colors: Json | null
          id: string
          lifestyle: string | null
          makeup: string | null
          morphologie: string | null
          pseudo: string | null
          silhouette: string | null
          styles: Json | null
          taille: string | null
        }
        Insert: {
          brands?: Json | null
          budget?: number | null
          colorimetry_season?: string | null
          corpulence?: string | null
          favorite_colors?: Json | null
          id: string
          lifestyle?: string | null
          makeup?: string | null
          morphologie?: string | null
          pseudo?: string | null
          silhouette?: string | null
          styles?: Json | null
          taille?: string | null
        }
        Update: {
          brands?: Json | null
          budget?: number | null
          colorimetry_season?: string | null
          corpulence?: string | null
          favorite_colors?: Json | null
          id?: string
          lifestyle?: string | null
          makeup?: string | null
          morphologie?: string | null
          pseudo?: string | null
          silhouette?: string | null
          styles?: Json | null
          taille?: string | null
        }
        Relationships: []
      }
      rejected_outfits: {
        Row: {
          created_at: string | null
          id: string
          item_ids: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_ids?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          item_ids?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          bloquee_jusqua: string | null
          created_at: string | null
          derniere_utilisation: string | null
          id: string
          item_ids: Json | null
          nb_fois_portee: number | null
          reaction: string | null
          user_id: string | null
        }
        Insert: {
          bloquee_jusqua?: string | null
          created_at?: string | null
          derniere_utilisation?: string | null
          id?: string
          item_ids?: Json | null
          nb_fois_portee?: number | null
          reaction?: string | null
          user_id?: string | null
        }
        Update: {
          bloquee_jusqua?: string | null
          created_at?: string | null
          derniere_utilisation?: string | null
          id?: string
          item_ids?: Json | null
          nb_fois_portee?: number | null
          reaction?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      wardrobe: {
        Row: {
          brand: string | null
          category: string | null
          color: string | null
          created_at: string | null
          id: string
          image_base64: string | null
          occasion: Json | null
          price: number | null
          season: Json | null
          style: Json | null
          subcategory: string | null
          type: string | null
          user_id: string
        }
        Insert: {
          brand?: string | null
          category?: string | null
          color?: string | null
          created_at?: string | null
          id?: string
          image_base64?: string | null
          occasion?: Json | null
          price?: number | null
          season?: Json | null
          style?: Json | null
          subcategory?: string | null
          type?: string | null
          user_id: string
        }
        Update: {
          brand?: string | null
          category?: string | null
          color?: string | null
          created_at?: string | null
          id?: string
          image_base64?: string | null
          occasion?: Json | null
          price?: number | null
          season?: Json | null
          style?: Json | null
          subcategory?: string | null
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
