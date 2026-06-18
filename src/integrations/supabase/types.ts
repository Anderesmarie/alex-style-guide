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
      calendar_events: {
        Row: {
          created_at: string
          date: string
          event_name: string | null
          id: string
          occasion: string | null
          outfit_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          event_name?: string | null
          id?: string
          occasion?: string | null
          outfit_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          event_name?: string | null
          id?: string
          occasion?: string | null
          outfit_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfits"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_styliste: {
        Row: {
          content: string
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          role?: string
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
          created_at: string
          date: string
          id: string
          layout_data: Json | null
          outfit_data: Json
          outfit_index: number
          saved_outfit_id: string | null
          swipe_result: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          layout_data?: Json | null
          outfit_data?: Json
          outfit_index: number
          saved_outfit_id?: string | null
          swipe_result?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          layout_data?: Json | null
          outfit_data?: Json
          outfit_index?: number
          saved_outfit_id?: string | null
          swipe_result?: string | null
          updated_at?: string
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
          is_modified: boolean | null
          item_ids: Json | null
          layout_data: Json | null
          liked: boolean
          name: string | null
          share_snapshot_url: string | null
          snapshot_url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_modified?: boolean | null
          item_ids?: Json | null
          layout_data?: Json | null
          liked?: boolean
          name?: string | null
          share_snapshot_url?: string | null
          snapshot_url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_modified?: boolean | null
          item_ids?: Json | null
          layout_data?: Json | null
          liked?: boolean
          name?: string | null
          share_snapshot_url?: string | null
          snapshot_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          beauty_hair_length: string | null
          beauty_makeup_level: string | null
          brands: Json | null
          budget: number | null
          chat_messages_today: number | null
          chat_reset_date: string | null
          colorimetry: Json | null
          colorimetry_season: string | null
          corpulence: string | null
          favorite_colors: Json | null
          id: string
          last_dressing_reminder_sent_at: string | null
          lifestyle: string | null
          makeup: string | null
          milestones_celebrated: Json | null
          morphologie: string | null
          pseudo: string | null
          silhouette: string | null
          streak_current: number | null
          streak_last_date: string | null
          streak_longest: number | null
          styles: Json | null
          styles_semaine: Json
          styles_weekend: Json
          taille: string | null
        }
        Insert: {
          beauty_hair_length?: string | null
          beauty_makeup_level?: string | null
          brands?: Json | null
          budget?: number | null
          chat_messages_today?: number | null
          chat_reset_date?: string | null
          colorimetry?: Json | null
          colorimetry_season?: string | null
          corpulence?: string | null
          favorite_colors?: Json | null
          id: string
          last_dressing_reminder_sent_at?: string | null
          lifestyle?: string | null
          makeup?: string | null
          milestones_celebrated?: Json | null
          morphologie?: string | null
          pseudo?: string | null
          silhouette?: string | null
          streak_current?: number | null
          streak_last_date?: string | null
          streak_longest?: number | null
          styles?: Json | null
          styles_semaine?: Json
          styles_weekend?: Json
          taille?: string | null
        }
        Update: {
          beauty_hair_length?: string | null
          beauty_makeup_level?: string | null
          brands?: Json | null
          budget?: number | null
          chat_messages_today?: number | null
          chat_reset_date?: string | null
          colorimetry?: Json | null
          colorimetry_season?: string | null
          corpulence?: string | null
          favorite_colors?: Json | null
          id?: string
          last_dressing_reminder_sent_at?: string | null
          lifestyle?: string | null
          makeup?: string | null
          milestones_celebrated?: Json | null
          morphologie?: string | null
          pseudo?: string | null
          silhouette?: string | null
          streak_current?: number | null
          streak_last_date?: string | null
          streak_longest?: number | null
          styles?: Json | null
          styles_semaine?: Json
          styles_weekend?: Json
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
      trip_days: {
        Row: {
          created_at: string
          date: string
          event_name: string | null
          id: string
          occasion: string
          outfit_id: string | null
          trip_id: string
        }
        Insert: {
          created_at?: string
          date: string
          event_name?: string | null
          id?: string
          occasion?: string
          outfit_id?: string | null
          trip_id: string
        }
        Update: {
          created_at?: string
          date?: string
          event_name?: string | null
          id?: string
          occasion?: string
          outfit_id?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_days_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_days_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          created_at: string
          destination: string
          end_date: string
          id: string
          start_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          destination: string
          end_date: string
          id?: string
          start_date: string
          user_id: string
        }
        Update: {
          created_at?: string
          destination?: string
          end_date?: string
          id?: string
          start_date?: string
          user_id?: string
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
          color: Json
          created_at: string | null
          fit: string | null
          id: string
          image_base64: string | null
          image_url: string | null
          length: string | null
          occasion: Json | null
          pattern: string | null
          price: number | null
          season: Json | null
          style: Json | null
          subcategory: string | null
          texture: string | null
          type: string | null
          user_id: string
        }
        Insert: {
          brand?: string | null
          category?: string | null
          color?: Json
          created_at?: string | null
          fit?: string | null
          id?: string
          image_base64?: string | null
          image_url?: string | null
          length?: string | null
          occasion?: Json | null
          pattern?: string | null
          price?: number | null
          season?: Json | null
          style?: Json | null
          subcategory?: string | null
          texture?: string | null
          type?: string | null
          user_id: string
        }
        Update: {
          brand?: string | null
          category?: string | null
          color?: Json
          created_at?: string | null
          fit?: string | null
          id?: string
          image_base64?: string | null
          image_url?: string | null
          length?: string | null
          occasion?: Json | null
          pattern?: string | null
          price?: number | null
          season?: Json | null
          style?: Json | null
          subcategory?: string | null
          texture?: string | null
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      wishlist: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          photo: string | null
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          photo?: string | null
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          photo?: string | null
          url?: string | null
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
