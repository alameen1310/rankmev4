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
      ai_summary_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          file_name: string | null
          file_url: string | null
          id: string
          status: string | null
          summary_text: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          status?: string | null
          summary_text?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          status?: string | null
          summary_text?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_summary_jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: number
          name: string
          requirement_type: string | null
          requirement_value: number | null
          tier: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: number
          name: string
          requirement_type?: string | null
          requirement_value?: number | null
          tier?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: number
          name?: string
          requirement_type?: string | null
          requirement_value?: number | null
          tier?: string | null
        }
        Relationships: []
      }
      battle_answers: {
        Row: {
          answered_at: string | null
          battle_id: string | null
          id: string
          is_correct: boolean | null
          points_earned: number | null
          question_id: number | null
          selected_answer: string | null
          time_spent: number | null
          user_id: string | null
        }
        Insert: {
          answered_at?: string | null
          battle_id?: string | null
          id?: string
          is_correct?: boolean | null
          points_earned?: number | null
          question_id?: number | null
          selected_answer?: string | null
          time_spent?: number | null
          user_id?: string | null
        }
        Update: {
          answered_at?: string | null
          battle_id?: string | null
          id?: string
          is_correct?: boolean | null
          points_earned?: number | null
          question_id?: number | null
          selected_answer?: string | null
          time_spent?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "battle_answers_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "battles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      battle_live_state: {
        Row: {
          battle_id: string
          current_question: number | null
          question_start_time: string | null
          status_data: Json | null
          updated_at: string | null
        }
        Insert: {
          battle_id: string
          current_question?: number | null
          question_start_time?: string | null
          status_data?: Json | null
          updated_at?: string | null
        }
        Update: {
          battle_id?: string
          current_question?: number | null
          question_start_time?: string | null
          status_data?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "battle_live_state_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: true
            referencedRelation: "battles"
            referencedColumns: ["id"]
          },
        ]
      }
      battle_participants: {
        Row: {
          answers_correct: number | null
          battle_id: string
          correct_answers: number | null
          finished_at: string | null
          id: string | null
          joined_at: string | null
          ready: boolean | null
          ready_at: string | null
          score: number | null
          status: string | null
          total_time: number | null
          user_id: string
        }
        Insert: {
          answers_correct?: number | null
          battle_id: string
          correct_answers?: number | null
          finished_at?: string | null
          id?: string | null
          joined_at?: string | null
          ready?: boolean | null
          ready_at?: string | null
          score?: number | null
          status?: string | null
          total_time?: number | null
          user_id: string
        }
        Update: {
          answers_correct?: number | null
          battle_id?: string
          correct_answers?: number | null
          finished_at?: string | null
          id?: string | null
          joined_at?: string | null
          ready?: boolean | null
          ready_at?: string | null
          score?: number | null
          status?: string | null
          total_time?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "battle_participants_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "battles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      battle_questions: {
        Row: {
          battle_id: string
          order_index: number
          question_id: number
        }
        Insert: {
          battle_id: string
          order_index: number
          question_id: number
        }
        Update: {
          battle_id?: string
          order_index?: number
          question_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "battle_questions_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "battles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      battles: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_private: boolean | null
          mode: string | null
          room_code: string | null
          started_at: string | null
          status: string | null
          subject_id: number | null
          time_per_question: number | null
          total_questions: number | null
          updated_at: string | null
          winner_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_private?: boolean | null
          mode?: string | null
          room_code?: string | null
          started_at?: string | null
          status?: string | null
          subject_id?: number | null
          time_per_question?: number | null
          total_questions?: number | null
          updated_at?: string | null
          winner_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_private?: boolean | null
          mode?: string | null
          room_code?: string | null
          started_at?: string | null
          status?: string | null
          subject_id?: number | null
          time_per_question?: number | null
          total_questions?: number | null
          updated_at?: string | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "battles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battles_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battles_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_streaks: {
        Row: {
          created_at: string | null
          id: string
          points_earned: number | null
          streak_date: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          points_earned?: number | null
          streak_date: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          points_earned?: number | null
          streak_date?: string
          user_id?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          created_at: string | null
          duration: number | null
          file_name: string | null
          file_size: number | null
          gif_url: string | null
          height: number | null
          id: string
          is_read: boolean | null
          media_url: string | null
          message: string
          message_type: string | null
          receiver_id: string
          sender_id: string
          status: string | null
          thumbnail_url: string | null
          width: number | null
        }
        Insert: {
          created_at?: string | null
          duration?: number | null
          file_name?: string | null
          file_size?: number | null
          gif_url?: string | null
          height?: number | null
          id?: string
          is_read?: boolean | null
          media_url?: string | null
          message: string
          message_type?: string | null
          receiver_id: string
          sender_id: string
          status?: string | null
          thumbnail_url?: string | null
          width?: number | null
        }
        Update: {
          created_at?: string | null
          duration?: number | null
          file_name?: string | null
          file_size?: number | null
          gif_url?: string | null
          height?: number | null
          id?: string
          is_read?: boolean | null
          media_url?: string | null
          message?: string
          message_type?: string | null
          receiver_id?: string
          sender_id?: string
          status?: string | null
          thumbnail_url?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_requests: {
        Row: {
          created_at: string | null
          from_user_id: string
          id: string
          responded_at: string | null
          status: string | null
          to_user_id: string
        }
        Insert: {
          created_at?: string | null
          from_user_id: string
          id?: string
          responded_at?: string | null
          status?: string | null
          to_user_id: string
        }
        Update: {
          created_at?: string | null
          from_user_id?: string
          id?: string
          responded_at?: string | null
          status?: string | null
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friend_requests_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_requests_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          created_at: string | null
          friend_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          friend_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          friend_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_entries: {
        Row: {
          created_at: string | null
          id: number
          period: string
          points: number | null
          profile_id: string
          rank: number | null
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          period: string
          points?: number | null
          profile_id: string
          rank?: number | null
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          period?: string
          points?: number | null
          profile_id?: string
          rank?: number | null
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_entries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          message_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          message_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          message_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "direct_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string | null
          read: boolean | null
          title: string | null
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string | null
          read?: boolean | null
          title?: string | null
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string | null
          read?: boolean | null
          title?: string | null
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          accuracy: number | null
          avatar_url: string | null
          country: string | null
          created_at: string | null
          current_streak: number | null
          display_name: string | null
          id: string
          last_active_date: string | null
          longest_streak: number | null
          tier: string | null
          total_correct_answers: number | null
          total_points: number | null
          total_questions_answered: number | null
          total_quizzes_completed: number | null
          updated_at: string | null
          username: string | null
          weekly_points: number | null
        }
        Insert: {
          accuracy?: number | null
          avatar_url?: string | null
          country?: string | null
          created_at?: string | null
          current_streak?: number | null
          display_name?: string | null
          id: string
          last_active_date?: string | null
          longest_streak?: number | null
          tier?: string | null
          total_correct_answers?: number | null
          total_points?: number | null
          total_questions_answered?: number | null
          total_quizzes_completed?: number | null
          updated_at?: string | null
          username?: string | null
          weekly_points?: number | null
        }
        Update: {
          accuracy?: number | null
          avatar_url?: string | null
          country?: string | null
          created_at?: string | null
          current_streak?: number | null
          display_name?: string | null
          id?: string
          last_active_date?: string | null
          longest_streak?: number | null
          tier?: string | null
          total_correct_answers?: number | null
          total_points?: number | null
          total_questions_answered?: number | null
          total_quizzes_completed?: number | null
          updated_at?: string | null
          username?: string | null
          weekly_points?: number | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_answer: string
          created_at: string | null
          difficulty: string | null
          explanation: string | null
          id: number
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          points_value: number | null
          question_text: string
          subject_id: number | null
        }
        Insert: {
          correct_answer: string
          created_at?: string | null
          difficulty?: string | null
          explanation?: string | null
          id?: number
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          points_value?: number | null
          question_text: string
          subject_id?: number | null
        }
        Update: {
          correct_answer?: string
          created_at?: string | null
          difficulty?: string | null
          explanation?: string | null
          id?: number
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          points_value?: number | null
          question_text?: string
          subject_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_results: {
        Row: {
          accuracy: number
          average_time: number
          completed_at: string | null
          correct_answers: number
          id: string
          perfect_streak: number | null
          subject: string
          total_points: number
          total_questions: number
          user_id: string
        }
        Insert: {
          accuracy: number
          average_time: number
          completed_at?: string | null
          correct_answers: number
          id?: string
          perfect_streak?: number | null
          subject: string
          total_points: number
          total_questions: number
          user_id: string
        }
        Update: {
          accuracy?: number
          average_time?: number
          completed_at?: string | null
          correct_answers?: number
          id?: string
          perfect_streak?: number | null
          subject?: string
          total_points?: number
          total_questions?: number
          user_id?: string
        }
        Relationships: []
      }
      quiz_sessions: {
        Row: {
          accuracy: number | null
          completed_at: string | null
          correct_answers: number | null
          created_at: string | null
          id: string
          score: number | null
          subject_id: number | null
          subject_name: string | null
          time_taken: number | null
          total_questions: number | null
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          completed_at?: string | null
          correct_answers?: number | null
          created_at?: string | null
          id?: string
          score?: number | null
          subject_id?: number | null
          subject_name?: string | null
          time_taken?: number | null
          total_questions?: number | null
          user_id: string
        }
        Update: {
          accuracy?: number | null
          completed_at?: string | null
          correct_answers?: number | null
          created_at?: string | null
          id?: string
          score?: number | null
          subject_id?: number | null
          subject_name?: string | null
          time_taken?: number | null
          total_questions?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_sessions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: number
          name: string
          question_count: number | null
          slug: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: number
          name: string
          question_count?: number | null
          slug: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: number
          name?: string
          question_count?: number | null
          slug?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_answers: {
        Row: {
          answered_at: string | null
          id: number
          is_correct: boolean | null
          points_earned: number | null
          question_id: number | null
          selected_answer: string | null
          session_id: string
          time_spent: number | null
        }
        Insert: {
          answered_at?: string | null
          id?: number
          is_correct?: boolean | null
          points_earned?: number | null
          question_id?: number | null
          selected_answer?: string | null
          session_id: string
          time_spent?: number | null
        }
        Update: {
          answered_at?: string | null
          id?: number
          is_correct?: boolean | null
          points_earned?: number | null
          question_id?: number | null
          selected_answer?: string | null
          session_id?: string
          time_spent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_answers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: number
          earned_at: string | null
          user_id: string
        }
        Insert: {
          badge_id: number
          earned_at?: string | null
          user_id: string
        }
        Update: {
          badge_id?: number
          earned_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          created_at: string | null
          high_score: number | null
          id: string
          last_played_at: string | null
          questions_attempted: number | null
          questions_correct: number | null
          subject: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          high_score?: number | null
          id?: string
          last_played_at?: string | null
          questions_attempted?: number | null
          questions_correct?: number | null
          subject: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          high_score?: number | null
          id?: string
          last_played_at?: string | null
          questions_attempted?: number | null
          questions_correct?: number | null
          subject?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_and_award_badges: {
        Args: { user_uuid: string }
        Returns: undefined
      }
      get_user_rank: {
        Args: { user_uuid: string }
        Returns: {
          percentile: number
          rank: number
          total_points: number
        }[]
      }
      increment_user_points: {
        Args: {
          p_increment_quizzes: number
          p_points_to_add: number
          p_user_id: string
          p_weekly_points_to_add: number
        }
        Returns: undefined
      }
      recalculate_leaderboard_ranks: { Args: never; Returns: undefined }
      update_battle_score: {
        Args: {
          battle_id_param: string
          correct_to_add: number
          points_to_add: number
          time_to_add: number
          user_id_param: string
        }
        Returns: undefined
      }
      update_user_streak: { Args: { user_uuid: string }; Returns: undefined }
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
