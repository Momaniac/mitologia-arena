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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      bets: {
        Row: {
          amount: number
          columns: Json
          created_at: string
          game_id: string
          id: string
          order: Json
          round: number
          team_id: string
          tombola: string
        }
        Insert: {
          amount: number
          columns: Json
          created_at?: string
          game_id: string
          id?: string
          order: Json
          round: number
          team_id: string
          tombola: string
        }
        Update: {
          amount?: number
          columns?: Json
          created_at?: string
          game_id?: string
          id?: string
          order?: Json
          round?: number
          team_id?: string
          tombola?: string
        }
        Relationships: [
          {
            foreignKeyName: "bets_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bets_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      game_private: {
        Row: {
          game_id: string
          seed: number
          tombola_a: Json
          tombola_b: Json
          updated_at: string
        }
        Insert: {
          game_id: string
          seed: number
          tombola_a?: Json
          tombola_b?: Json
          updated_at?: string
        }
        Update: {
          game_id?: string
          seed?: number
          tombola_a?: Json
          tombola_b?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_private_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: true
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          bet_totals: Json | null
          board: Json
          code: string
          created_at: string
          current_draw: Json | null
          final_scores: Json | null
          host_uid: string
          id: string
          last_result: Json | null
          mode: string
          phase: string
          round: number
          settings: Json
          status: string
          updated_at: string
        }
        Insert: {
          bet_totals?: Json | null
          board?: Json
          code: string
          created_at?: string
          current_draw?: Json | null
          final_scores?: Json | null
          host_uid: string
          id?: string
          last_result?: Json | null
          mode?: string
          phase?: string
          round?: number
          settings?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          bet_totals?: Json | null
          board?: Json
          code?: string
          created_at?: string
          current_draw?: Json | null
          final_scores?: Json | null
          host_uid?: string
          id?: string
          last_result?: Json | null
          mode?: string
          phase?: string
          round?: number
          settings?: Json
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      players: {
        Row: {
          auth_uid: string
          connected: boolean
          game_id: string
          id: string
          joined_at: string
          name: string
          team_id: string | null
        }
        Insert: {
          auth_uid: string
          connected?: boolean
          game_id: string
          id?: string
          joined_at?: string
          name: string
          team_id?: string | null
        }
        Update: {
          auth_uid?: string
          connected?: boolean
          game_id?: string
          id?: string
          joined_at?: string
          name?: string
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "players_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      round_history: {
        Row: {
          created_at: string
          game_id: string
          id: string
          payload: Json
          round: number
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          payload: Json
          round: number
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          payload?: Json
          round?: number
        }
        Relationships: [
          {
            foreignKeyName: "round_history_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      team_secrets: {
        Row: {
          coins: number
          combination: Json | null
          condition: Json | null
          game_id: string
          hand: Json
          team_id: string
        }
        Insert: {
          coins?: number
          combination?: Json | null
          condition?: Json | null
          game_id: string
          hand?: Json
          team_id: string
        }
        Update: {
          coins?: number
          combination?: Json | null
          condition?: Json | null
          game_id?: string
          hand?: Json
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_secrets_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_secrets_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          bet_submitted: boolean
          created_at: string
          game_id: string
          id: string
          name: string
          representative: string | null
          revealed_card_id: string | null
          score: number
        }
        Insert: {
          bet_submitted?: boolean
          created_at?: string
          game_id: string
          id?: string
          name: string
          representative?: string | null
          revealed_card_id?: string | null
          score?: number
        }
        Update: {
          bet_submitted?: boolean
          created_at?: string
          game_id?: string
          id?: string
          name?: string
          representative?: string | null
          revealed_card_id?: string | null
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "teams_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_game_host: { Args: { g: string }; Returns: boolean }
      is_game_participant: { Args: { g: string }; Returns: boolean }
      join_game: {
        Args: { p_code: string; p_name: string }
        Returns: {
          game_id: string
          player_id: string
        }[]
      }
      my_team_id: { Args: { g: string }; Returns: string }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
