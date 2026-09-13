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
  public: {
    Tables: {
      daily_answers: {
        Row: {
          created_at: string
          id: string
          option_id: string
          question_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_id: string
          question_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_answers_option_belongs_to_question"
            columns: ["option_id", "question_id"]
            isOneToOne: false
            referencedRelation: "daily_options"
            referencedColumns: ["id", "question_id"]
          },
          {
            foreignKeyName: "daily_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "daily_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_options: {
        Row: {
          apparently_feedback: string | null
          created_at: string
          id: string
          label: string
          personality_effects: Json
          position: number
          question_id: string
          updated_at: string
        }
        Insert: {
          apparently_feedback?: string | null
          created_at?: string
          id?: string
          label: string
          personality_effects?: Json
          position: number
          question_id: string
          updated_at?: string
        }
        Update: {
          apparently_feedback?: string | null
          created_at?: string
          id?: string
          label?: string
          personality_effects?: Json
          position?: number
          question_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "daily_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_questions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          approved_content_version: string | null
          category: string
          created_at: string
          id: string
          prompt: string
          published_for: string | null
          review_note: string | null
          scheduled_for: string | null
          sort_order: number
          status: Database["public"]["Enums"]["daily_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          approved_content_version?: string | null
          category: string
          created_at?: string
          id?: string
          prompt: string
          published_for?: string | null
          review_note?: string | null
          scheduled_for?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["daily_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          approved_content_version?: string | null
          category?: string
          created_at?: string
          id?: string
          prompt?: string
          published_for?: string | null
          review_note?: string | null
          scheduled_for?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["daily_status"]
          updated_at?: string
        }
        Relationships: []
      }
      personality_evidence: {
        Row: {
          answer_snapshot: string
          category: string
          created_at: string
          dimension: string
          effect: number
          id: string
          question_snapshot: string
          source_id: string
          source_type: string
          user_id: string
        }
        Insert: {
          answer_snapshot: string
          category: string
          created_at?: string
          dimension: string
          effect: number
          id?: string
          question_snapshot: string
          source_id: string
          source_type: string
          user_id: string
        }
        Update: {
          answer_snapshot?: string
          category?: string
          created_at?: string
          dimension?: string
          effect?: number
          id?: string
          question_snapshot?: string
          source_id?: string
          source_type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age_range: string | null
          created_at: string
          gender: string | null
          onboarding_completed_at: string | null
          preferred_name: string | null
          self_perception: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age_range?: string | null
          created_at?: string
          gender?: string | null
          onboarding_completed_at?: string | null
          preferred_name?: string | null
          self_perception?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age_range?: string | null
          created_at?: string
          gender?: string | null
          onboarding_completed_at?: string | null
          preferred_name?: string | null
          self_perception?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_results: {
        Row: {
          completed_at: string
          created_at: string
          id: string
          mix: Json | null
          percent: number
          quiz_id: string
          result_id: string
          result_title: string
          score: number
          traits: string[]
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          id?: string
          mix?: Json | null
          percent: number
          quiz_id: string
          result_id: string
          result_title: string
          score: number
          traits?: string[]
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          id?: string
          mix?: Json | null
          percent?: number
          quiz_id?: string
          result_id?: string
          result_title?: string
          score?: number
          traits?: string[]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_daily_distribution: {
        Args: { p_question_id: string }
        Returns: {
          answer_count: number
          option_id: string
          percent: number
          total_answers: number
        }[]
      }
    }
    Enums: {
      daily_status:
        | "Idea"
        | "Draft"
        | "ReadyForReview"
        | "Approved"
        | "Scheduled"
        | "Live"
        | "Archived"
        | "NeedsRevision"
        | "Rejected"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      daily_status: [
        "Idea",
        "Draft",
        "ReadyForReview",
        "Approved",
        "Scheduled",
        "Live",
        "Archived",
        "NeedsRevision",
        "Rejected",
      ],
    },
  },
} as const
