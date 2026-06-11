// このファイルは Supabase MCP の generate_typescript_types で自動生成したものです。
// スキーマを変更したら再生成して差し替えてください。
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
      ai_feedback: {
        Row: {
          commentary: string
          created_at: string
          id: number
          scores_by_category: Json
          submission_id: number
        }
        Insert: {
          commentary: string
          created_at?: string
          id?: never
          scores_by_category: Json
          submission_id: number
        }
        Update: {
          commentary?: string
          created_at?: string
          id?: never
          scores_by_category?: Json
          submission_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_feedback_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "recent_submission_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_feedback_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "review_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          created_at: string
          id: number
          is_read: boolean
          pr_url: string
          read_at: string | null
          title: string
        }
        Insert: {
          created_at?: string
          id?: never
          is_read?: boolean
          pr_url: string
          read_at?: string | null
          title: string
        }
        Update: {
          created_at?: string
          id?: never
          is_read?: boolean
          pr_url?: string
          read_at?: string | null
          title?: string
        }
        Relationships: []
      }
      checklist_items: {
        Row: {
          active: boolean
          category: string
          id: number
          label: string
        }
        Insert: {
          active?: boolean
          category: string
          id?: never
          label: string
        }
        Update: {
          active?: boolean
          category?: string
          id?: never
          label?: string
        }
        Relationships: []
      }
      exercises: {
        Row: {
          created_at: string
          diff_content: string
          id: number
          pr_url: string | null
          source_type: string
          title: string
        }
        Insert: {
          created_at?: string
          diff_content: string
          id?: never
          pr_url?: string | null
          source_type: string
          title: string
        }
        Update: {
          created_at?: string
          diff_content?: string
          id?: never
          pr_url?: string | null
          source_type?: string
          title?: string
        }
        Relationships: []
      }
      model_review_comments: {
        Row: {
          author: string
          body: string
          exercise_id: number
          file_path: string
          id: number
          line_no: number | null
        }
        Insert: {
          author: string
          body: string
          exercise_id: number
          file_path: string
          id?: never
          line_no?: number | null
        }
        Update: {
          author?: string
          body?: string
          exercise_id?: number
          file_path?: string
          id?: never
          line_no?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "model_review_comments_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercise_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_review_comments_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      review_comments: {
        Row: {
          body: string
          checklist_item_id: number | null
          file_path: string
          id: number
          line_no: number
          submission_id: number
        }
        Insert: {
          body: string
          checklist_item_id?: number | null
          file_path: string
          id?: never
          line_no: number
          submission_id: number
        }
        Update: {
          body?: string
          checklist_item_id?: number | null
          file_path?: string
          id?: never
          line_no?: number
          submission_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "review_comments_checklist_item_id_fkey"
            columns: ["checklist_item_id"]
            isOneToOne: false
            referencedRelation: "checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_comments_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "recent_submission_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_comments_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "review_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      review_submissions: {
        Row: {
          duration_min: number | null
          exercise_id: number
          id: number
          self_score: number | null
          submitted_at: string
        }
        Insert: {
          duration_min?: number | null
          exercise_id: number
          id?: never
          self_score?: number | null
          submitted_at?: string
        }
        Update: {
          duration_min?: number | null
          exercise_id?: number
          id?: never
          self_score?: number | null
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_submissions_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercise_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_submissions_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          key: string
          value: string
        }
        Insert: {
          key: string
          value: string
        }
        Update: {
          key?: string
          value?: string
        }
        Relationships: []
      }
      study_logs: {
        Row: {
          exercise_id: number | null
          id: number
          memo: string | null
          studied_on: string
          submission_id: number | null
        }
        Insert: {
          exercise_id?: number | null
          id?: never
          memo?: string | null
          studied_on: string
          submission_id?: number | null
        }
        Update: {
          exercise_id?: number | null
          id?: never
          memo?: string | null
          studied_on?: string
          submission_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "study_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercise_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_logs_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "recent_submission_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_logs_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "review_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      exercise_list_view: {
        Row: {
          created_at: string | null
          id: number | null
          last_submitted_at: string | null
          model_comment_count: number | null
          pr_url: string | null
          source_type: string | null
          submission_count: number | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number | null
          last_submitted_at?: never
          model_comment_count?: never
          pr_url?: string | null
          source_type?: string | null
          submission_count?: never
          title?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number | null
          last_submitted_at?: never
          model_comment_count?: never
          pr_url?: string | null
          source_type?: string | null
          submission_count?: never
          title?: string | null
        }
        Relationships: []
      }
      recent_submission_view: {
        Row: {
          comment_count: number | null
          duration_min: number | null
          exercise_id: number | null
          id: number | null
          self_score: number | null
          submitted_at: string | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_submissions_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercise_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_submissions_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      review_comment_view: {
        Row: {
          body: string | null
          category: string | null
          checklist_item_id: number | null
          checklist_label: string | null
          file_path: string | null
          id: number | null
          line_no: number | null
          submission_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "review_comments_checklist_item_id_fkey"
            columns: ["checklist_item_id"]
            isOneToOne: false
            referencedRelation: "checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_comments_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "recent_submission_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_comments_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "review_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      studied_dates_view: {
        Row: {
          studied_on: string | null
        }
        Relationships: []
      }
      study_log_view: {
        Row: {
          duration_min: number | null
          exercise_id: number | null
          id: number | null
          memo: string | null
          self_score: number | null
          studied_on: string | null
          submission_id: number | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "study_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercise_list_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_logs_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "recent_submission_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_logs_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "review_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_study_days_view: {
        Row: {
          days: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_github_exercise: {
        Args: {
          p_diff: string
          p_model_comments: Json
          p_pr_url: string
          p_title: string
        }
        Returns: number
      }
      submit_review: {
        Args: {
          p_comments: Json
          p_duration_min: number
          p_exercise_id: number
          p_memo: string
          p_self_score: number
        }
        Returns: number
      }
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
