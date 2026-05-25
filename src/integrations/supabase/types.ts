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
      certificates: {
        Row: {
          certificate_uid: string
          event_id: string
          id: string
          issued_at: string | null
          performance_score: number | null
          role: string
          user_id: string
        }
        Insert: {
          certificate_uid: string
          event_id: string
          id?: string
          issued_at?: string | null
          performance_score?: number | null
          role: string
          user_id: string
        }
        Update: {
          certificate_uid?: string
          event_id?: string
          id?: string
          issued_at?: string | null
          performance_score?: number | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          description: string | null
          event_date: string | null
          expected_footfall: number | null
          id: string
          itemized_budget: Json | null
          organizer_id: string
          sponsor_kanban_enabled: boolean | null
          status: Database["public"]["Enums"]["event_status"] | null
          themes: Json | null
          title: string
          total_budget: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          expected_footfall?: number | null
          id?: string
          itemized_budget?: Json | null
          organizer_id: string
          sponsor_kanban_enabled?: boolean | null
          status?: Database["public"]["Enums"]["event_status"] | null
          themes?: Json | null
          title: string
          total_budget?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          expected_footfall?: number | null
          id?: string
          itemized_budget?: Json | null
          organizer_id?: string
          sponsor_kanban_enabled?: boolean | null
          status?: Database["public"]["Enums"]["event_status"] | null
          themes?: Json | null
          title?: string
          total_budget?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          event_id: string | null
          id: string
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          event_id?: string | null
          id?: string
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          event_id?: string | null
          id?: string
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizer_profiles: {
        Row: {
          id: string
          org_name: string | null
          org_type: string | null
          past_events_count: number | null
          profile_id: string
          target_audience: Json | null
        }
        Insert: {
          id?: string
          org_name?: string | null
          org_type?: string | null
          past_events_count?: number | null
          profile_id: string
          target_audience?: Json | null
        }
        Update: {
          id?: string
          org_name?: string | null
          org_type?: string | null
          past_events_count?: number | null
          profile_id?: string
          target_audience?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "organizer_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      participant_profiles: {
        Row: {
          designation: string | null
          github_url: string | null
          id: string
          interests: Json | null
          linkedin_url: string | null
          profile_id: string
        }
        Insert: {
          designation?: string | null
          github_url?: string | null
          id?: string
          interests?: Json | null
          linkedin_url?: string | null
          profile_id: string
        }
        Update: {
          designation?: string | null
          github_url?: string | null
          id?: string
          interests?: Json | null
          linkedin_url?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "participant_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_scores: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          rated_by: string | null
          score: number
          volunteer_id: string
          xp_awarded: number | null
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          rated_by?: string | null
          score: number
          volunteer_id: string
          xp_awarded?: number | null
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          rated_by?: string | null
          score?: number
          volunteer_id?: string
          xp_awarded?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_scores_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_scores_rated_by_fkey"
            columns: ["rated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_scores_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          hashtags: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          hashtags?: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          hashtags?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          xp?: number
        }
        Relationships: []
      }
      registrations: {
        Row: {
          checked_in: boolean | null
          created_at: string | null
          event_id: string
          id: string
          participant_id: string
          qr_code: string
        }
        Insert: {
          checked_in?: boolean | null
          created_at?: string | null
          event_id: string
          id?: string
          participant_id: string
          qr_code: string
        }
        Update: {
          checked_in?: boolean | null
          created_at?: string | null
          event_id?: string
          id?: string
          participant_id?: string
          qr_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_profiles: {
        Row: {
          budget_range: string | null
          company_name: string | null
          id: string
          industry: string | null
          primary_goal: Json | null
          profile_id: string
        }
        Insert: {
          budget_range?: string | null
          company_name?: string | null
          id?: string
          industry?: string | null
          primary_goal?: Json | null
          profile_id: string
        }
        Update: {
          budget_range?: string | null
          company_name?: string | null
          id?: string
          industry?: string | null
          primary_goal?: Json | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsorships: {
        Row: {
          created_at: string | null
          custom_package: Json | null
          event_id: string
          id: string
          signed: boolean | null
          sponsor_id: string
          status: Database["public"]["Enums"]["app_status"] | null
          tier: string | null
        }
        Insert: {
          created_at?: string | null
          custom_package?: Json | null
          event_id: string
          id?: string
          signed?: boolean | null
          sponsor_id: string
          status?: Database["public"]["Enums"]["app_status"] | null
          tier?: string | null
        }
        Update: {
          created_at?: string | null
          custom_package?: Json | null
          event_id?: string
          id?: string
          signed?: boolean | null
          sponsor_id?: string
          status?: Database["public"]["Enums"]["app_status"] | null
          tier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsorships_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsorships_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string | null
          event_id: string
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          title: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          event_id: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title: string
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          event_id?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_applications: {
        Row: {
          availability: Json | null
          created_at: string | null
          dietary: Json | null
          emergency_contact: string | null
          event_id: string
          id: string
          is_lead: boolean | null
          preferred_dept: string | null
          role_type: string | null
          status: Database["public"]["Enums"]["app_status"] | null
          tshirt_size: string | null
          volunteer_id: string
          whatsapp: string | null
          why_volunteer: string | null
        }
        Insert: {
          availability?: Json | null
          created_at?: string | null
          dietary?: Json | null
          emergency_contact?: string | null
          event_id: string
          id?: string
          is_lead?: boolean | null
          preferred_dept?: string | null
          role_type?: string | null
          status?: Database["public"]["Enums"]["app_status"] | null
          tshirt_size?: string | null
          volunteer_id: string
          whatsapp?: string | null
          why_volunteer?: string | null
        }
        Update: {
          availability?: Json | null
          created_at?: string | null
          dietary?: Json | null
          emergency_contact?: string | null
          event_id?: string
          id?: string
          is_lead?: boolean | null
          preferred_dept?: string | null
          role_type?: string | null
          status?: Database["public"]["Enums"]["app_status"] | null
          tshirt_size?: string | null
          volunteer_id?: string
          whatsapp?: string | null
          why_volunteer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_applications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_applications_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_profiles: {
        Row: {
          college: string | null
          experience_level: string | null
          id: string
          profile_id: string
          skills: Json | null
          year: string | null
        }
        Insert: {
          college?: string | null
          experience_level?: string | null
          id?: string
          profile_id: string
          skills?: Json | null
          year?: string | null
        }
        Update: {
          college?: string | null
          experience_level?: string | null
          id?: string
          profile_id?: string
          skills?: Json | null
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "organizer" | "volunteer" | "sponsor" | "participant"
      app_status: "pending" | "approved" | "rejected"
      event_status: "draft" | "published" | "completed"
      task_status: "todo" | "in_progress" | "done"
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
    Enums: {
      app_role: ["organizer", "volunteer", "sponsor", "participant"],
      app_status: ["pending", "approved", "rejected"],
      event_status: ["draft", "published", "completed"],
      task_status: ["todo", "in_progress", "done"],
    },
  },
} as const
