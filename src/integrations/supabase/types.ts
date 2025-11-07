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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      alpha_applications: {
        Row: {
          admin_notes: string | null
          created_at: string
          current_tools: string | null
          email: string
          full_name: string
          id: string
          platform_preferences: string[] | null
          status: Database["public"]["Enums"]["alpha_status"]
          updated_at: string
          use_case: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          current_tools?: string | null
          email: string
          full_name: string
          id?: string
          platform_preferences?: string[] | null
          status?: Database["public"]["Enums"]["alpha_status"]
          updated_at?: string
          use_case: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          current_tools?: string | null
          email?: string
          full_name?: string
          id?: string
          platform_preferences?: string[] | null
          status?: Database["public"]["Enums"]["alpha_status"]
          updated_at?: string
          use_case?: string
        }
        Relationships: []
      }
      bulk_discovery_jobs: {
        Row: {
          actual_cost: number | null
          completed_at: string | null
          created_at: string
          created_by: string
          error_message: string | null
          estimated_cost: number | null
          failed_discoveries: number
          id: string
          processed_services: number
          progress_data: Json | null
          started_at: string | null
          status: string
          successful_discoveries: number
          total_services: number
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          error_message?: string | null
          estimated_cost?: number | null
          failed_discoveries?: number
          id?: string
          processed_services?: number
          progress_data?: Json | null
          started_at?: string | null
          status?: string
          successful_discoveries?: number
          total_services?: number
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          error_message?: string | null
          estimated_cost?: number | null
          failed_discoveries?: number
          id?: string
          processed_services?: number
          progress_data?: Json | null
          started_at?: string | null
          status?: string
          successful_discoveries?: number
          total_services?: number
          updated_at?: string
        }
        Relationships: []
      }
      contact_discovery_failures: {
        Row: {
          created_at: string
          error_code: string | null
          error_message: string | null
          failure_type: string
          http_status_codes: Json | null
          id: string
          service_id: string
          suggested_action: string | null
          urls_tried: string[] | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          failure_type: string
          http_status_codes?: Json | null
          id?: string
          service_id: string
          suggested_action?: string | null
          urls_tried?: string[] | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          failure_type?: string
          http_status_codes?: Json | null
          id?: string
          service_id?: string
          suggested_action?: string | null
          urls_tried?: string[] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_discovery_failures_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      deletion_requests: {
        Row: {
          completed_at: string | null
          contact_email: string | null
          created_at: string
          id: string
          identifier_used_id: string | null
          identifier_used_type:
            | Database["public"]["Enums"]["identifier_type"]
            | null
          identifier_used_value: string | null
          method: string | null
          notes: string | null
          request_body: Json | null
          request_type: string
          response_data: Json | null
          service_id: string | null
          service_name: string
          status: string
          updated_at: string
          user_id: string
          verification_notes: string | null
          verification_required: boolean | null
        }
        Insert: {
          completed_at?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          identifier_used_id?: string | null
          identifier_used_type?:
            | Database["public"]["Enums"]["identifier_type"]
            | null
          identifier_used_value?: string | null
          method?: string | null
          notes?: string | null
          request_body?: Json | null
          request_type: string
          response_data?: Json | null
          service_id?: string | null
          service_name: string
          status?: string
          updated_at?: string
          user_id: string
          verification_notes?: string | null
          verification_required?: boolean | null
        }
        Update: {
          completed_at?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          identifier_used_id?: string | null
          identifier_used_type?:
            | Database["public"]["Enums"]["identifier_type"]
            | null
          identifier_used_value?: string | null
          method?: string | null
          notes?: string | null
          request_body?: Json | null
          request_type?: string
          response_data?: Json | null
          service_id?: string | null
          service_name?: string
          status?: string
          updated_at?: string
          user_id?: string
          verification_notes?: string | null
          verification_required?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "deletion_requests_identifier_used_id_fkey"
            columns: ["identifier_used_id"]
            isOneToOne: false
            referencedRelation: "user_identifiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deletion_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      email_analytics: {
        Row: {
          created_at: string
          email_address: string
          email_id: string
          email_subject: string | null
          event_type: Database["public"]["Enums"]["email_event_type"]
          id: string
          ip_address: string | null
          link_url: string | null
          metadata: Json | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email_address: string
          email_id: string
          email_subject?: string | null
          event_type: Database["public"]["Enums"]["email_event_type"]
          id?: string
          ip_address?: string | null
          link_url?: string | null
          metadata?: Json | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email_address?: string
          email_id?: string
          email_subject?: string | null
          event_type?: Database["public"]["Enums"]["email_event_type"]
          id?: string
          ip_address?: string | null
          link_url?: string | null
          metadata?: Json | null
          user_agent?: string | null
        }
        Relationships: []
      }
      email_preferences: {
        Row: {
          created_at: string
          email: string
          email_frequency: string
          id: string
          token: string
          unsubscribed: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          email_frequency?: string
          id?: string
          token?: string
          unsubscribed?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          email_frequency?: string
          id?: string
          token?: string
          unsubscribed?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      gmail_connections: {
        Row: {
          access_token: string
          access_token_encrypted: string | null
          created_at: string
          email: string
          id: string
          refresh_token: string
          refresh_token_encrypted: string | null
          token_expires_at: string
          tokens_encrypted: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          access_token_encrypted?: string | null
          created_at?: string
          email: string
          id?: string
          refresh_token: string
          refresh_token_encrypted?: string | null
          token_expires_at: string
          tokens_encrypted?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          access_token_encrypted?: string | null
          created_at?: string
          email?: string
          id?: string
          refresh_token?: string
          refresh_token_encrypted?: string | null
          token_expires_at?: string
          tokens_encrypted?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      manual_contact_submissions: {
        Row: {
          contact_type: string
          created_at: string
          id: string
          notes: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          service_id: string
          status: string
          submitted_by: string
          updated_at: string
          value: string
        }
        Insert: {
          contact_type: string
          created_at?: string
          id?: string
          notes?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_id: string
          status?: string
          submitted_by: string
          updated_at?: string
          value: string
        }
        Update: {
          contact_type?: string
          created_at?: string
          id?: string
          notes?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_id?: string
          status?: string
          submitted_by?: string
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "manual_contact_submissions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      privacy_contacts: {
        Row: {
          added_by: string
          confidence: string
          contact_type: string
          created_at: string
          id: string
          last_validated_at: string | null
          mx_validated: boolean | null
          reasoning: string | null
          service_id: string | null
          source_url: string | null
          updated_at: string
          value: string
          verified: boolean
        }
        Insert: {
          added_by: string
          confidence: string
          contact_type: string
          created_at?: string
          id?: string
          last_validated_at?: string | null
          mx_validated?: boolean | null
          reasoning?: string | null
          service_id?: string | null
          source_url?: string | null
          updated_at?: string
          value: string
          verified?: boolean
        }
        Update: {
          added_by?: string
          confidence?: string
          contact_type?: string
          created_at?: string
          id?: string
          last_validated_at?: string | null
          mx_validated?: boolean | null
          reasoning?: string | null
          service_id?: string | null
          source_url?: string | null
          updated_at?: string
          value?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "privacy_contacts_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      request_templates: {
        Row: {
          body_template: string
          created_at: string
          id: string
          is_active: boolean | null
          jurisdiction: string | null
          legal_citations: string[] | null
          name: string
          requires_fields: string[] | null
          subject_template: string | null
          template_type: string
          updated_at: string
        }
        Insert: {
          body_template: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          jurisdiction?: string | null
          legal_citations?: string[] | null
          name: string
          requires_fields?: string[] | null
          subject_template?: string | null
          template_type: string
          updated_at?: string
        }
        Update: {
          body_template?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          jurisdiction?: string | null
          legal_citations?: string[] | null
          name?: string
          requires_fields?: string[] | null
          subject_template?: string | null
          template_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_catalog: {
        Row: {
          category: string | null
          ccpa_compliant: boolean | null
          contact_quality_score: number | null
          contact_verified: boolean | null
          created_at: string
          deletion_difficulty: string | null
          deletion_instructions: Json | null
          deletion_method: string | null
          deletion_url: string | null
          domain: string
          gdpr_compliant: boolean | null
          homepage_url: string | null
          id: string
          justdelete_me_url: string | null
          last_verified_at: string | null
          logo_url: string | null
          name: string
          privacy_email: string | null
          privacy_form_url: string | null
          requires_2fa: boolean | null
        }
        Insert: {
          category?: string | null
          ccpa_compliant?: boolean | null
          contact_quality_score?: number | null
          contact_verified?: boolean | null
          created_at?: string
          deletion_difficulty?: string | null
          deletion_instructions?: Json | null
          deletion_method?: string | null
          deletion_url?: string | null
          domain: string
          gdpr_compliant?: boolean | null
          homepage_url?: string | null
          id?: string
          justdelete_me_url?: string | null
          last_verified_at?: string | null
          logo_url?: string | null
          name: string
          privacy_email?: string | null
          privacy_form_url?: string | null
          requires_2fa?: boolean | null
        }
        Update: {
          category?: string | null
          ccpa_compliant?: boolean | null
          contact_quality_score?: number | null
          contact_verified?: boolean | null
          created_at?: string
          deletion_difficulty?: string | null
          deletion_instructions?: Json | null
          deletion_method?: string | null
          deletion_url?: string | null
          domain?: string
          gdpr_compliant?: boolean | null
          homepage_url?: string | null
          id?: string
          justdelete_me_url?: string | null
          last_verified_at?: string | null
          logo_url?: string | null
          name?: string
          privacy_email?: string | null
          privacy_form_url?: string | null
          requires_2fa?: boolean | null
        }
        Relationships: []
      }
      service_submissions: {
        Row: {
          admin_notes: string | null
          created_at: string
          domain: string
          email_from: string
          id: string
          occurrence_count: number
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          suggested_category: string | null
          suggested_name: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          domain: string
          email_from: string
          id?: string
          occurrence_count?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          suggested_category?: string | null
          suggested_name: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          domain?: string
          email_from?: string
          id?: string
          occurrence_count?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          suggested_category?: string | null
          suggested_name?: string
          user_id?: string
        }
        Relationships: []
      }
      unmatched_domains: {
        Row: {
          domain: string
          email_from: string
          first_seen_at: string
          id: string
          occurrence_count: number
          user_id: string
          user_label: string | null
        }
        Insert: {
          domain: string
          email_from: string
          first_seen_at?: string
          id?: string
          occurrence_count?: number
          user_id: string
          user_label?: string | null
        }
        Update: {
          domain?: string
          email_from?: string
          first_seen_at?: string
          id?: string
          occurrence_count?: number
          user_id?: string
          user_label?: string | null
        }
        Relationships: []
      }
      user_authorizations: {
        Row: {
          authorized_at: string
          consent_version: string
          created_at: string
          id: string
          ip_address: string | null
          jurisdiction: string | null
          revoked_at: string | null
          signature_data: Json | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          authorized_at?: string
          consent_version?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          jurisdiction?: string | null
          revoked_at?: string | null
          signature_data?: Json | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          authorized_at?: string
          consent_version?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          jurisdiction?: string | null
          revoked_at?: string | null
          signature_data?: Json | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_identifiers: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          source: string
          type: Database["public"]["Enums"]["identifier_type"]
          updated_at: string
          user_id: string
          value: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          source?: string
          type: Database["public"]["Enums"]["identifier_type"]
          updated_at?: string
          user_id: string
          value: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          source?: string
          type?: Database["public"]["Enums"]["identifier_type"]
          updated_at?: string
          user_id?: string
          value?: string
          verified?: boolean
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_services: {
        Row: {
          deletion_notes: string | null
          deletion_requested_at: string | null
          deletion_status: string | null
          discovered_at: string
          first_seen_date: string | null
          last_scanned_at: string
          marked_for_deletion: boolean | null
          service_id: string
          user_id: string
        }
        Insert: {
          deletion_notes?: string | null
          deletion_requested_at?: string | null
          deletion_status?: string | null
          discovered_at?: string
          first_seen_date?: string | null
          last_scanned_at?: string
          marked_for_deletion?: boolean | null
          service_id: string
          user_id: string
        }
        Update: {
          deletion_notes?: string | null
          deletion_requested_at?: string | null
          deletion_status?: string | null
          discovered_at?: string
          first_seen_date?: string | null
          last_scanned_at?: string
          marked_for_deletion?: boolean | null
          service_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      email_analytics_summary: {
        Row: {
          click_rate: number | null
          open_rate: number | null
          total_bounced: number | null
          total_clicked: number | null
          total_complained: number | null
          total_delivered: number | null
          total_opened: number | null
          total_sent: number | null
          unique_clicks: number | null
          unique_opens: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_email_analytics_summary: {
        Args: never
        Returns: {
          click_rate: number
          open_rate: number
          total_bounced: number
          total_clicked: number
          total_complained: number
          total_delivered: number
          total_opened: number
          total_sent: number
          unique_clicks: number
          unique_opens: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_authorized_agent: { Args: { user_uuid: string }; Returns: boolean }
    }
    Enums: {
      alpha_status: "pending" | "approved" | "rejected"
      app_role: "admin" | "user"
      email_event_type:
        | "sent"
        | "delivered"
        | "delivery_delayed"
        | "complained"
        | "bounced"
        | "opened"
        | "clicked"
        | "unsubscribed"
      identifier_type: "email" | "phone" | "username" | "other"
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
      alpha_status: ["pending", "approved", "rejected"],
      app_role: ["admin", "user"],
      email_event_type: [
        "sent",
        "delivered",
        "delivery_delayed",
        "complained",
        "bounced",
        "opened",
        "clicked",
        "unsubscribed",
      ],
      identifier_type: ["email", "phone", "username", "other"],
    },
  },
} as const
