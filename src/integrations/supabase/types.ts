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
      analytics_events: {
        Row: {
          created_at: string
          event: string
          id: string
          properties: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          properties?: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          properties?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      broker_scan_results: {
        Row: {
          broker_id: string
          created_at: string
          error_message: string | null
          expires_at: string | null
          id: string
          match_confidence: number | null
          opted_out_at: string | null
          profile_url: string | null
          scanned_at: string | null
          screenshot_url: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          broker_id: string
          created_at?: string
          error_message?: string | null
          expires_at?: string | null
          id?: string
          match_confidence?: number | null
          opted_out_at?: string | null
          profile_url?: string | null
          scanned_at?: string | null
          screenshot_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          broker_id?: string
          created_at?: string
          error_message?: string | null
          expires_at?: string | null
          id?: string
          match_confidence?: number | null
          opted_out_at?: string | null
          profile_url?: string | null
          scanned_at?: string | null
          screenshot_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "broker_scan_results_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "data_brokers"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_scans: {
        Row: {
          clean_count: number | null
          completed_at: string | null
          created_at: string
          error_count: number | null
          found_count: number | null
          id: string
          scanned_count: number | null
          started_at: string | null
          status: string
          total_brokers: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          clean_count?: number | null
          completed_at?: string | null
          created_at?: string
          error_count?: number | null
          found_count?: number | null
          id?: string
          scanned_count?: number | null
          started_at?: string | null
          status?: string
          total_brokers?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          clean_count?: number | null
          completed_at?: string | null
          created_at?: string
          error_count?: number | null
          found_count?: number | null
          id?: string
          scanned_count?: number | null
          started_at?: string | null
          status?: string
          total_brokers?: number | null
          updated_at?: string
          user_id?: string
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
      challenge_participants: {
        Row: {
          challenge_id: string
          current_score: number | null
          id: string
          joined_at: string
          rank: number | null
          starting_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          current_score?: number | null
          id?: string
          joined_at?: string
          rank?: number | null
          starting_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          current_score?: number | null
          id?: string
          joined_at?: string
          rank?: number | null
          starting_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          challenge_type: string
          created_at: string
          description: string
          end_date: string | null
          id: string
          is_active: boolean
          name: string
          prize_description: string | null
          rules: Json
          start_date: string
        }
        Insert: {
          challenge_type: string
          created_at?: string
          description: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          name: string
          prize_description?: string | null
          rules?: Json
          start_date?: string
        }
        Update: {
          challenge_type?: string
          created_at?: string
          description?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          name?: string
          prize_description?: string | null
          rules?: Json
          start_date?: string
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
      data_brokers: {
        Row: {
          created_at: string
          id: string
          instructions: string | null
          is_active: boolean | null
          logo_url: string | null
          name: string
          opt_out_difficulty: string | null
          opt_out_time_estimate: string | null
          opt_out_url: string | null
          priority: string
          requires_captcha: boolean | null
          requires_id: boolean | null
          requires_phone: boolean | null
          search_url: string | null
          slug: string
          updated_at: string
          website: string
        }
        Insert: {
          created_at?: string
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          opt_out_difficulty?: string | null
          opt_out_time_estimate?: string | null
          opt_out_url?: string | null
          priority?: string
          requires_captcha?: boolean | null
          requires_id?: boolean | null
          requires_phone?: boolean | null
          search_url?: string | null
          slug: string
          updated_at?: string
          website: string
        }
        Update: {
          created_at?: string
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          opt_out_difficulty?: string | null
          opt_out_time_estimate?: string | null
          opt_out_url?: string | null
          priority?: string
          requires_captcha?: boolean | null
          requires_id?: boolean | null
          requires_phone?: boolean | null
          search_url?: string | null
          slug?: string
          updated_at?: string
          website?: string
        }
        Relationships: []
      }
      deletion_requests: {
        Row: {
          completed_at: string | null
          contact_email: string | null
          created_at: string
          days_to_response: number | null
          follow_up_count: number | null
          id: string
          identifier_used_id: string | null
          identifier_used_type:
            | Database["public"]["Enums"]["identifier_type"]
            | null
          identifier_used_value: string | null
          last_follow_up_at: string | null
          method: string | null
          notes: string | null
          request_body: Json | null
          request_type: string
          response_data: Json | null
          response_notes: string | null
          response_received_at: string | null
          response_type: string | null
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
          days_to_response?: number | null
          follow_up_count?: number | null
          id?: string
          identifier_used_id?: string | null
          identifier_used_type?:
            | Database["public"]["Enums"]["identifier_type"]
            | null
          identifier_used_value?: string | null
          last_follow_up_at?: string | null
          method?: string | null
          notes?: string | null
          request_body?: Json | null
          request_type: string
          response_data?: Json | null
          response_notes?: string | null
          response_received_at?: string | null
          response_type?: string | null
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
          days_to_response?: number | null
          follow_up_count?: number | null
          id?: string
          identifier_used_id?: string | null
          identifier_used_type?:
            | Database["public"]["Enums"]["identifier_type"]
            | null
          identifier_used_value?: string | null
          last_follow_up_at?: string | null
          method?: string | null
          notes?: string | null
          request_body?: Json | null
          request_type?: string
          response_data?: Json | null
          response_notes?: string | null
          response_received_at?: string | null
          response_type?: string | null
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
      discovery_metrics: {
        Row: {
          attempt_timeouts: number | null
          build_sha: string | null
          build_ver: string | null
          cache_hit: boolean | null
          confidence: string | null
          created_at: string
          domain: string
          error_code: string | null
          hit_in_top5: boolean | null
          id: string
          lang: string | null
          method_used: string
          policy_type: string | null
          prefill_supported: boolean | null
          request_id: string | null
          score: number | null
          status_map: Json | null
          success: boolean
          t2_success: boolean | null
          t2_time_ms: number | null
          t2_used: boolean | null
          time_ms: number
          urls_considered: number | null
          urls_considered_top5: number | null
          vendor: string | null
        }
        Insert: {
          attempt_timeouts?: number | null
          build_sha?: string | null
          build_ver?: string | null
          cache_hit?: boolean | null
          confidence?: string | null
          created_at?: string
          domain: string
          error_code?: string | null
          hit_in_top5?: boolean | null
          id?: string
          lang?: string | null
          method_used?: string
          policy_type?: string | null
          prefill_supported?: boolean | null
          request_id?: string | null
          score?: number | null
          status_map?: Json | null
          success: boolean
          t2_success?: boolean | null
          t2_time_ms?: number | null
          t2_used?: boolean | null
          time_ms: number
          urls_considered?: number | null
          urls_considered_top5?: number | null
          vendor?: string | null
        }
        Update: {
          attempt_timeouts?: number | null
          build_sha?: string | null
          build_ver?: string | null
          cache_hit?: boolean | null
          confidence?: string | null
          created_at?: string
          domain?: string
          error_code?: string | null
          hit_in_top5?: boolean | null
          id?: string
          lang?: string | null
          method_used?: string
          policy_type?: string | null
          prefill_supported?: boolean | null
          request_id?: string | null
          score?: number | null
          status_map?: Json | null
          success?: boolean
          t2_success?: boolean | null
          t2_time_ms?: number | null
          t2_used?: boolean | null
          time_ms?: number
          urls_considered?: number | null
          urls_considered_top5?: number | null
          vendor?: string | null
        }
        Relationships: []
      }
      discovery_quarantine: {
        Row: {
          attempts: number
          created_at: string
          domain: string
          last_error: string | null
          reason: string
          until_at: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          domain: string
          last_error?: string | null
          reason: string
          until_at: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          domain?: string
          last_error?: string | null
          reason?: string
          until_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      discovery_quarantine_overrides: {
        Row: {
          actor: string
          created_at: string
          domain: string
          id: string
          reason: string
        }
        Insert: {
          actor: string
          created_at?: string
          domain: string
          id?: string
          reason: string
        }
        Update: {
          actor?: string
          created_at?: string
          domain?: string
          id?: string
          reason?: string
        }
        Relationships: []
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
      email_connections: {
        Row: {
          access_token: string
          access_token_encrypted: string | null
          account_label: string | null
          created_at: string
          email: string
          id: string
          is_primary: boolean | null
          provider: Database["public"]["Enums"]["email_provider"]
          provider_user_id: string | null
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
          account_label?: string | null
          created_at?: string
          email: string
          id?: string
          is_primary?: boolean | null
          provider?: Database["public"]["Enums"]["email_provider"]
          provider_user_id?: string | null
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
          account_label?: string | null
          created_at?: string
          email?: string
          id?: string
          is_primary?: boolean | null
          provider?: Database["public"]["Enums"]["email_provider"]
          provider_user_id?: string | null
          refresh_token?: string
          refresh_token_encrypted?: string | null
          token_expires_at?: string
          tokens_encrypted?: boolean | null
          updated_at?: string
          user_id?: string
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
      employee_scans: {
        Row: {
          created_at: string
          department: string | null
          employee_email: string
          employee_name: string | null
          high_risk_services: number | null
          id: string
          last_scanned_at: string | null
          organization_id: string
          risk_score: number | null
          scan_status: string | null
          services_found: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          department?: string | null
          employee_email: string
          employee_name?: string | null
          high_risk_services?: number | null
          id?: string
          last_scanned_at?: string | null
          organization_id: string
          risk_score?: number | null
          scan_status?: string | null
          services_found?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          department?: string | null
          employee_email?: string
          employee_name?: string | null
          high_risk_services?: number | null
          id?: string
          last_scanned_at?: string | null
          organization_id?: string
          risk_score?: number | null
          scan_status?: string | null
          services_found?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_scans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      enterprise_leads: {
        Row: {
          company: string
          created_at: string
          email: string
          employees: string | null
          id: string
          message: string | null
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          company: string
          created_at?: string
          email: string
          employees?: string | null
          id?: string
          message?: string | null
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          company?: string
          created_at?: string
          email?: string
          employees?: string | null
          id?: string
          message?: string | null
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      golden_runs: {
        Row: {
          build_sha: string | null
          build_ver: string | null
          created_at: string
          id: string
          median_ms_g10: number | null
          median_ms_g25: number | null
          pass_rate_g10: number | null
          pass_rate_g25: number | null
        }
        Insert: {
          build_sha?: string | null
          build_ver?: string | null
          created_at?: string
          id?: string
          median_ms_g10?: number | null
          median_ms_g25?: number | null
          pass_rate_g10?: number | null
          pass_rate_g25?: number | null
        }
        Update: {
          build_sha?: string | null
          build_ver?: string | null
          created_at?: string
          id?: string
          median_ms_g10?: number | null
          median_ms_g25?: number | null
          pass_rate_g10?: number | null
          pass_rate_g25?: number | null
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
      offboarding_reports: {
        Row: {
          completed_at: string | null
          created_at: string
          department: string | null
          employee_email: string
          employee_name: string | null
          employee_scan_id: string | null
          generated_by: string
          high_priority_count: number | null
          id: string
          low_priority_count: number | null
          medium_priority_count: number | null
          organization_id: string
          report_data: Json | null
          services_to_revoke: Json | null
          status: string | null
          termination_date: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          department?: string | null
          employee_email: string
          employee_name?: string | null
          employee_scan_id?: string | null
          generated_by: string
          high_priority_count?: number | null
          id?: string
          low_priority_count?: number | null
          medium_priority_count?: number | null
          organization_id: string
          report_data?: Json | null
          services_to_revoke?: Json | null
          status?: string | null
          termination_date?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          department?: string | null
          employee_email?: string
          employee_name?: string | null
          employee_scan_id?: string | null
          generated_by?: string
          high_priority_count?: number | null
          id?: string
          low_priority_count?: number | null
          medium_priority_count?: number | null
          organization_id?: string
          report_data?: Json | null
          services_to_revoke?: Json | null
          status?: string | null
          termination_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offboarding_reports_employee_scan_id_fkey"
            columns: ["employee_scan_id"]
            isOneToOne: false
            referencedRelation: "employee_scans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offboarding_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_scan_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          failed_scans: number | null
          id: string
          initiated_by: string
          organization_id: string
          scanned_employees: number | null
          started_at: string | null
          status: string | null
          total_employees: number | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          failed_scans?: number | null
          id?: string
          initiated_by: string
          organization_id: string
          scanned_employees?: number | null
          started_at?: string | null
          status?: string | null
          total_employees?: number | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          failed_scans?: number | null
          id?: string
          initiated_by?: string
          organization_id?: string
          scanned_employees?: number | null
          started_at?: string | null
          status?: string | null
          total_employees?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_scan_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          invited_at: string | null
          invited_by: string | null
          joined_at: string | null
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          billing_email: string | null
          created_at: string
          employee_count: string | null
          id: string
          industry: string | null
          logo_url: string | null
          max_seats: number | null
          name: string
          slug: string
          stripe_customer_id: string | null
          subscription_status: string | null
          subscription_tier: string | null
          updated_at: string
        }
        Insert: {
          billing_email?: string | null
          created_at?: string
          employee_count?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          max_seats?: number | null
          name: string
          slug: string
          stripe_customer_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string
        }
        Update: {
          billing_email?: string | null
          created_at?: string
          employee_count?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          max_seats?: number | null
          name?: string
          slug?: string
          stripe_customer_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string
        }
        Relationships: []
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
      probe_cache_sitemap: {
        Row: {
          domain: string
          fetched_at: string
          urls: Json
        }
        Insert: {
          domain: string
          fetched_at?: string
          urls: Json
        }
        Update: {
          domain?: string
          fetched_at?: string
          urls?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          last_auto_rescan_at: string | null
          last_email_scan_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          last_auto_rescan_at?: string | null
          last_email_scan_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          last_auto_rescan_at?: string | null
          last_email_scan_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      public_results: {
        Row: {
          conversion_count: number | null
          created_at: string | null
          insights: Json
          risk_level: string
          risk_score: number
          service_count: number
          share_id: string
          top_categories: Json
          user_id: string
          view_count: number | null
        }
        Insert: {
          conversion_count?: number | null
          created_at?: string | null
          insights?: Json
          risk_level: string
          risk_score: number
          service_count: number
          share_id?: string
          top_categories?: Json
          user_id: string
          view_count?: number | null
        }
        Update: {
          conversion_count?: number | null
          created_at?: string | null
          insights?: Json
          risk_level?: string
          risk_score?: number
          service_count?: number
          share_id?: string
          top_categories?: Json
          user_id?: string
          view_count?: number | null
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string | null
          id: string
          max_uses: number | null
          updated_at: string
          user_id: string
          uses_count: number
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          updated_at?: string
          user_id: string
          uses_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          updated_at?: string
          user_id?: string
          uses_count?: number
        }
        Relationships: []
      }
      referral_conversions: {
        Row: {
          converted_at: string
          id: string
          referral_code_id: string | null
          referred_user_id: string
          referrer_user_id: string | null
          reward_granted_at: string | null
          reward_type: string | null
        }
        Insert: {
          converted_at?: string
          id?: string
          referral_code_id?: string | null
          referred_user_id: string
          referrer_user_id?: string | null
          reward_granted_at?: string | null
          reward_type?: string | null
        }
        Update: {
          converted_at?: string
          id?: string
          referral_code_id?: string | null
          referred_user_id?: string
          referrer_user_id?: string | null
          reward_granted_at?: string | null
          reward_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_conversions_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
        ]
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
      risk_score_history: {
        Row: {
          created_at: string
          id: string
          level: string
          old_accounts_count: number
          recorded_at: string
          score: number
          sensitive_accounts_count: number
          total_accounts: number
          unmatched_domains_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          level: string
          old_accounts_count?: number
          recorded_at?: string
          score: number
          sensitive_accounts_count?: number
          total_accounts?: number
          unmatched_domains_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: string
          old_accounts_count?: number
          recorded_at?: string
          score?: number
          sensitive_accounts_count?: number
          total_accounts?: number
          unmatched_domains_count?: number
          user_id?: string
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
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          deletion_count_this_period: number
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          deletion_count_this_period?: number
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          deletion_count_this_period?: number
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      t2_retries: {
        Row: {
          attempts: number
          created_at: string
          domain: string
          id: number
          last_error: string | null
          next_run_at: string
          policy_type: string | null
          reason: Database["public"]["Enums"]["retry_reason"]
          request_id: string | null
          result_url: string | null
          seed_url: string | null
          status: string
          t2_time_ms: number | null
          updated_at: string
          vendor: string | null
        }
        Insert: {
          attempts?: number
          created_at?: string
          domain: string
          id?: number
          last_error?: string | null
          next_run_at?: string
          policy_type?: string | null
          reason: Database["public"]["Enums"]["retry_reason"]
          request_id?: string | null
          result_url?: string | null
          seed_url?: string | null
          status?: string
          t2_time_ms?: number | null
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          attempts?: number
          created_at?: string
          domain?: string
          id?: number
          last_error?: string | null
          next_run_at?: string
          policy_type?: string | null
          reason?: Database["public"]["Enums"]["retry_reason"]
          request_id?: string | null
          result_url?: string | null
          seed_url?: string | null
          status?: string
          t2_time_ms?: number | null
          updated_at?: string
          vendor?: string | null
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
          discovered_from_connection_id: string | null
          discovery_source: string | null
          first_seen_date: string | null
          last_scanned_at: string
          marked_for_deletion: boolean | null
          reappeared_at: string | null
          service_id: string
          user_id: string
        }
        Insert: {
          deletion_notes?: string | null
          deletion_requested_at?: string | null
          deletion_status?: string | null
          discovered_at?: string
          discovered_from_connection_id?: string | null
          discovery_source?: string | null
          first_seen_date?: string | null
          last_scanned_at?: string
          marked_for_deletion?: boolean | null
          reappeared_at?: string | null
          service_id: string
          user_id: string
        }
        Update: {
          deletion_notes?: string | null
          deletion_requested_at?: string | null
          deletion_status?: string | null
          discovered_at?: string
          discovered_from_connection_id?: string | null
          discovery_source?: string | null
          first_seen_date?: string | null
          last_scanned_at?: string
          marked_for_deletion?: boolean | null
          reappeared_at?: string | null
          service_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_services_discovered_from_connection_id_fkey"
            columns: ["discovered_from_connection_id"]
            isOneToOne: false
            referencedRelation: "email_connections"
            referencedColumns: ["id"]
          },
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
      discovery_alerts_24h: {
        Row: {
          p95_ms_24h: number | null
          pass_rate_24h: number | null
          top_errors_24h: Json | null
        }
        Relationships: []
      }
      discovery_metrics_summary: {
        Row: {
          avg_ms: number | null
          day: string | null
          html_count: number | null
          p50_ms: number | null
          p95_ms: number | null
          pass_rate: number | null
          pdf_count: number | null
          total_requests: number | null
          unique_domains: number | null
        }
        Relationships: []
      }
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
      probe_metrics_dashboard: {
        Row: {
          day: string | null
          n: number | null
          p50_ms: number | null
          p95_ms: number | null
          pass_rate: number | null
          precision_at_5: number | null
          vendors: Json | null
        }
        Relationships: []
      }
    }
    Functions: {
      discovery_quarantine_cleanup: {
        Args: { max_age_days?: number }
        Returns: {
          deleted_count: number
          remaining_active: number
        }[]
      }
      discovery_quarantine_override: {
        Args: { p_actor: string; p_domain: string; p_reason: string }
        Returns: {
          domain: string
          removed: boolean
        }[]
      }
      generate_referral_code: { Args: never; Returns: string }
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
      get_remaining_deletions: { Args: { p_user_id: string }; Returns: number }
      get_user_subscription_tier: {
        Args: { p_user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_deletion_count: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      is_authorized_agent: { Args: { user_uuid: string }; Returns: boolean }
      is_org_admin: {
        Args: { org_id: string; user_uuid: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { org_id: string; user_uuid: string }
        Returns: boolean
      }
      public_status_snapshot: { Args: never; Returns: Json }
      reset_monthly_deletion_counts: { Args: never; Returns: undefined }
      t2_queue_summary: {
        Args: never
        Returns: {
          n: number
          status: string
        }[]
      }
      use_referral_code: { Args: { p_code: string }; Returns: Json }
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
      email_provider: "gmail" | "outlook"
      identifier_type: "email" | "phone" | "username" | "other"
      org_role: "owner" | "admin" | "member"
      retry_reason:
        | "bot_protection"
        | "no_policy_found"
        | "pdf_only"
        | "captcha"
        | "other"
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
      email_provider: ["gmail", "outlook"],
      identifier_type: ["email", "phone", "username", "other"],
      org_role: ["owner", "admin", "member"],
      retry_reason: [
        "bot_protection",
        "no_policy_found",
        "pdf_only",
        "captcha",
        "other",
      ],
    },
  },
} as const
