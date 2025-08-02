export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      api_keys: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          key_encrypted: string
          key_hash: string | null
          last_used_at: string | null
          name: string | null
          scopes: string[]
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          key_encrypted: string
          key_hash?: string | null
          last_used_at?: string | null
          name?: string | null
          scopes: string[]
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          key_encrypted?: string
          key_hash?: string | null
          last_used_at?: string | null
          name?: string | null
          scopes?: string[]
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_limits_metrics"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "api_keys_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      apps: {
        Row: {
          app_id: string
          config: Json | null
          created_at: string | null
          created_by: string | null
          id: string
          settings: Json | null
          team_id: string | null
        }
        Insert: {
          app_id: string
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          settings?: Json | null
          team_id?: string | null
        }
        Update: {
          app_id?: string
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          settings?: Json | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "apps_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integrations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_limits_metrics"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "integrations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_id: string
          account_reference: string | null
          balance: number | null
          bank_connection_id: string | null
          base_balance: number | null
          base_currency: string | null
          created_at: string
          created_by: string
          currency: string | null
          enabled: boolean
          error_details: string | null
          error_retries: number | null
          id: string
          manual: boolean | null
          name: string | null
          team_id: string
          type: Database["public"]["Enums"]["account_type"] | null
        }
        Insert: {
          account_id: string
          account_reference?: string | null
          balance?: number | null
          bank_connection_id?: string | null
          base_balance?: number | null
          base_currency?: string | null
          created_at?: string
          created_by: string
          currency?: string | null
          enabled?: boolean
          error_details?: string | null
          error_retries?: number | null
          id?: string
          manual?: boolean | null
          name?: string | null
          team_id: string
          type?: Database["public"]["Enums"]["account_type"] | null
        }
        Update: {
          account_id?: string
          account_reference?: string | null
          balance?: number | null
          bank_connection_id?: string | null
          base_balance?: number | null
          base_currency?: string | null
          created_at?: string
          created_by?: string
          currency?: string | null
          enabled?: boolean
          error_details?: string | null
          error_retries?: number | null
          id?: string
          manual?: boolean | null
          name?: string | null
          team_id?: string
          type?: Database["public"]["Enums"]["account_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_bank_connection_id_fkey"
            columns: ["bank_connection_id"]
            isOneToOne: false
            referencedRelation: "bank_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_accounts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_bank_accounts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_limits_metrics"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "public_bank_accounts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_connections: {
        Row: {
          access_token: string | null
          created_at: string
          enrollment_id: string | null
          error_details: string | null
          error_retries: number | null
          expires_at: string | null
          id: string
          institution_id: string
          last_accessed: string | null
          logo_url: string | null
          name: string
          provider: Database["public"]["Enums"]["bank_providers"] | null
          reference_id: string | null
          status: Database["public"]["Enums"]["connection_status"] | null
          team_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          enrollment_id?: string | null
          error_details?: string | null
          error_retries?: number | null
          expires_at?: string | null
          id?: string
          institution_id: string
          last_accessed?: string | null
          logo_url?: string | null
          name: string
          provider?: Database["public"]["Enums"]["bank_providers"] | null
          reference_id?: string | null
          status?: Database["public"]["Enums"]["connection_status"] | null
          team_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          enrollment_id?: string | null
          error_details?: string | null
          error_retries?: number | null
          expires_at?: string | null
          id?: string
          institution_id?: string
          last_accessed?: string | null
          logo_url?: string | null
          name?: string
          provider?: Database["public"]["Enums"]["bank_providers"] | null
          reference_id?: string | null
          status?: Database["public"]["Enums"]["connection_status"] | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_connections_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_limits_metrics"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "bank_connections_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_tags: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          tag_id: string
          team_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          tag_id: string
          team_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          tag_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_tags_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_tags_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_limits_metrics"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "customer_tags_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          billing_email: string | null
          city: string | null
          contact: string | null
          country: string | null
          country_code: string | null
          created_at: string
          email: string
          fts: unknown | null
          id: string
          name: string
          note: string | null
          phone: string | null
          state: string | null
          team_id: string
          token: string
          vat_number: string | null
          website: string | null
          zip: string | null
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          billing_email?: string | null
          city?: string | null
          contact?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          email: string
          fts?: unknown | null
          id?: string
          name: string
          note?: string | null
          phone?: string | null
          state?: string | null
          team_id?: string
          token?: string
          vat_number?: string | null
          website?: string | null
          zip?: string | null
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          billing_email?: string | null
          city?: string | null
          contact?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          email?: string
          fts?: unknown | null
          id?: string
          name?: string
          note?: string | null
          phone?: string | null
          state?: string | null
          team_id?: string
          token?: string
          vat_number?: string | null
          website?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_limits_metrics"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "customers_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      document_tag_assignments: {
        Row: {
          document_id: string
          tag_id: string
          team_id: string
        }
        Insert: {
          document_id: string
          tag_id: string
          team_id: string
        }
        Update: {
          document_id?: string
          tag_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_tag_assignments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "document_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_tag_assignments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_limits_metrics"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "document_tag_assignments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      document_tag_embeddings: {
        Row: {
          embedding: string | null
          name: string
          slug: string
        }
        Insert: {
          embedding?: string | null
          name: string
          slug: string
        }
        Update: {
          embedding?: string | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      document_tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          team_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          team_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_tags_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_limits_metrics"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "document_tags_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          body: string | null
          content: string | null
          created_at: string | null
          date: string | null
          fts: unknown | null
          fts_english: unknown | null
          fts_language: unknown | null
          fts_simple: unknown | null
          id: string
          language: string | null
          metadata: Json | null
          name: string | null
          object_id: string | null
          owner_id: string | null
          parent_id: string | null
          path_tokens: string[] | null
          processing_status:
            | Database["public"]["Enums"]["document_processing_status"]
            | null
          summary: string | null
          tag: string | null
          team_id: string | null
          title: string | null
        }
        Insert: {
          body?: string | null
          content?: string | null
          created_at?: string | null
          date?: string | null
          fts?: unknown | null
          fts_english?: unknown | null
          fts_language?: unknown | null
          fts_simple?: unknown | null
          id?: string
          language?: string | null
          metadata?: Json | null
          name?: string | null
          object_id?: string | null
          owner_id?: string | null
          parent_id?: string | null
          path_tokens?: string[] | null
          processing_status?:
            | Database["public"]["Enums"]["document_processing_status"]
            | null
          summary?: string | null
          tag?: string | null
          team_id?: string | null
          title?: string | null
        }
        Update: {
          body?: string | null
          content?: string | null
          created_at?: string | null
          date?: string | null
          fts?: unknown | null
          fts_english?: unknown | null
          fts_language?: unknown | null
          fts_simple?: unknown | null
          id?: string
          language?: string | null
          metadata?: Json | null
          name?: string | null
          object_id?: string | null
          owner_id?: string | null
          parent_id?: string | null
          path_tokens?: string[] | null
          processing_status?:
            | Database["public"]["Enums"]["document_processing_status"]
            | null
          summary?: string | null
          tag?: string | null
          team_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storage_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_limits_metrics"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "storage_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_rates: {
        Row: {
          base: string | null
          id: string
          rate: number | null
          target: string | null
          updated_at: string | null
        }
        Insert: {
          base?: string | null
          id?: string
          rate?: number | null
          target?: string | null
          updated_at?: string | null
        }
        Update: {
          base?: string | null
          id?: string
          rate?: number | null
          target?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      inbox: {
        Row: {
          amount: number | null
          attachment_id: string | null
          base_amount: number | null
          base_currency: string | null
          content_type: string | null
          created_at: string
          currency: string | null
          date: string | null
          description: string | null
          display_name: string | null
          file_name: string | null
          file_path: string[] | null
          forwarded_to: string | null
          fts: unknown | null
          id: string
          meta: Json | null
          reference_id: string | null
          size: number | null
          status: Database["public"]["Enums"]["inbox_status"] | null
          tax_amount: number | null
          tax_rate: number | null
          tax_type: string | null
          team_id: string | null
          transaction_id: string | null
          type: Database["public"]["Enums"]["inbox_type"] | null
          website: string | null
          inbox_amount_text: string | null
        }
        Insert: {
          amount?: number | null
          attachment_id?: string | null
          base_amount?: number | null
          base_currency?: string | null
          content_type?: string | null
          created_at?: string
          currency?: string | null
          date?: string | null
          description?: string | null
          display_name?: string | null
          file_name?: string | null
          file_path?: string[] | null
          forwarded_to?: string | null
          fts?: unknown | null
          id?: string
          meta?: Json | null
          reference_id?: string | null
          size?: number | null
          status?: Database["public"]["Enums"]["inbox_status"] | null
          tax_amount?: number | null
          tax_rate?: number | null
          tax_type?: string | null
          team_id?: string | null
          transaction_id?: string | null
          type?: Database["public"]["Enums"]["inbox_type"] | null
          website?: string | null
        }
        Update: {
          amount?: number | null
          attachment_id?: string | null
          base_amount?: number | null
          base_currency?: string | null
          content_type?: string | null
          created_at?: string
          currency?: string | null
          date?: string | null
          description?: string | null
          display_name?: string | null
          file_name?: string | null
          file_path?: string[] | null
          forwarded_to?: string | null
          fts?: unknown | null
          id?: string
          meta?: Json | null
          reference_id?: string | null
          size?: number | null
          status?: Database["public"]["Enums"]["inbox_status"] | null
          tax_amount?: number | null
          tax_rate?: number | null
          tax_type?: string | null
          team_id?: string | null
          transaction_id?: string | null
          type?: Database["public"]["Enums"]["inbox_type"] | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inbox_attachment_id_fkey"
            columns: ["attachment_id"]
            isOneToOne: false
            referencedRelation: "transaction_attachments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_inbox_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_limits_metrics"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "public_inbox_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_inbox_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      inbox_accounts: {
        Row: {
          access_token: string
          created_at: string
          email: string
          expiry_date: string
          external_id: string
          id: string
          last_accessed: string
          provider:
            | Database["public"]["Enums"]["inbox_account_providers"]
            | null
          refresh_token: string
          schedule_id: string | null
          team_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          email: string
          expiry_date: string
          external_id: string
          id?: string
          last_accessed: string
          provider?:
            | Database["public"]["Enums"]["inbox_account_providers"]
            | null
          refresh_token: string
          schedule_id?: string | null
          team_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          email?: string
          expiry_date?: string
          external_id?: string
          id?: string
          last_accessed?: string
          provider?:
            | Database["public"]["Enums"]["inbox_account_providers"]
            | null
          refresh_token?: string
          schedule_id?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbox_accounts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_limits_metrics"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "inbox_accounts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_comments: {
        Row: {
          created_at: string
          id: string
        }
        Insert: {
          created_at?: string
          id?: string
        }
        Update: {
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      invoice_templates: {
        Row: {
          created_at: string
          currency: string | null
          customer_label: string | null
          date_format: string | null
          delivery_type: Database["public"]["Enums"]["invoice_delivery_type"]
          description_label: string | null
          discount_label: string | null
          due_date_label: string | null
          from_details: Json | null
          from_label: string | null
          id: string
          include_decimals: boolean | null
          include_discount: boolean | null
          include_pdf: boolean | null
          include_qr: boolean | null
          include_tax: boolean | null
          include_units: boolean | null
          include_vat: boolean | null
          invoice_no_label: string | null
          issue_date_label: string | null
          logo_url: string | null
          note_label: string | null
          payment_details: Json | null
          payment_label: string | null
          price_label: string | null
          quantity_label: string | null
          send_copy: boolean | null
          size: Database["public"]["Enums"]["invoice_size"] | null
          subtotal_label: string | null
          tax_label: string | null
          tax_rate: number | null
          team_id: string
          title: string | null
          total_label: string | null
          total_summary_label: string | null
          vat_label: string | null
          vat_rate: number | null
        }
        Insert: {
          created_at?: string
          currency?: string | null
          customer_label?: string | null
          date_format?: string | null
          delivery_type?: Database["public"]["Enums"]["invoice_delivery_type"]
          description_label?: string | null
          discount_label?: string | null
          due_date_label?: string | null
          from_details?: Json | null
          from_label?: string | null
          id?: string
          include_decimals?: boolean | null
          include_discount?: boolean | null
          include_pdf?: boolean | null
          include_qr?: boolean | null
          include_tax?: boolean | null
          include_units?: boolean | null
          include_vat?: boolean | null
          invoice_no_label?: string | null
          issue_date_label?: string | null
          logo_url?: string | null
          note_label?: string | null
          payment_details?: Json | null
          payment_label?: string | null
          price_label?: string | null
          quantity_label?: string | null
          send_copy?: boolean | null
          size?: Database["public"]["Enums"]["invoice_size"] | null
          subtotal_label?: string | null
          tax_label?: string | null
          tax_rate?: number | null
          team_id: string
          title?: string | null
          total_label?: string | null
          total_summary_label?: string | null
          vat_label?: string | null
          vat_rate?: number | null
        }
        Update: {
          created_at?: string
          currency?: string | null
          customer_label?: string | null
          date_format?: string | null
          delivery_type?: Database["public"]["Enums"]["invoice_delivery_type"]
          description_label?: string | null
          discount_label?: string | null
          due_date_label?: string | null
          from_details?: Json | null
          from_label?: string | null
          id?: string
          include_decimals?: boolean | null
          include_discount?: boolean | null
          include_pdf?: boolean | null
          include_qr?: boolean | null
          include_tax?: boolean | null
          include_units?: boolean | null
          include_vat?: boolean | null
          invoice_no_label?: string | null
          issue_date_label?: string | null
          logo_url?: string | null
          note_label?: string | null
          payment_details?: Json | null
          payment_label?: string | null
          price_label?: string | null
          quantity_label?: string | null
          send_copy?: boolean | null
          size?: Database["public"]["Enums"]["invoice_size"] | null
          subtotal_label?: string | null
          tax_label?: string | null
          tax_rate?: number | null
          team_id?: string
          title?: string | null
          total_label?: string | null
          total_summary_label?: string | null
          vat_label?: string | null
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_settings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "team_limits_metrics"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "invoice_settings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number | null
          bottom_block: Json | null
          company_datails: Json | null
          created_at: string
          currency: string | null
          customer_details: Json | null
          customer_id: string | null
          customer_name: string | null
          discount: number | null
          due_date: string | null
          file_path: string[] | null
          file_size: number | null
          from_details: Json | null
          fts: unknown | null
          id: string
          internal_note: string | null
          invoice_number: string | null
          issue_date: string | null
          line_items: Json | null
          note: string | null
          note_details: Json | null
          paid_at: string | null
          payment_details: Json | null
          reminder_sent_at: string | null
          scheduled_at: string | null
          scheduled_job_id: string | null
          sent_at: string | null
          sent_to: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number | null
          tax: number | null
          team_id: string
          template: Json | null
          token: string
          top_block: Json | null
          updated_at: string | null
          url: string | null
          user_id: string | null
          vat: number | null
          viewed_at: string | null
        }
        Insert: {
          amount?: number | null
          bottom_block?: Json | null
          company_datails?: Json | null
          created_at?: string
          currency?: string | null
          customer_details?: Json | null
          customer_id?: string | null
          customer_name?: string | null
          discount?: number | null
          due_date?: string | null
          file_path?: string[] | null
          file_size?: number | null
          from_details?: Json | null
          fts?: unknown | null
          id?: string
          internal_note?: string | null
          invoice_number?: string | null
          issue_date?: string | null
          line_items?: Json | null
          note?: string | null
          note_details?: Json | null
          paid_at?: string | null
          payment_details?: Json | null
          reminder_sent_at?: string | null
          scheduled_at?: string | null
          scheduled_job_id?: string | null
          sent_at?: string | null
          sent_to?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number | null
          tax?: number | null
          team_id: string
          template?: Json | null
          token?: string
          top_block?: Json | null
          updated_at?: string | null
          url?: string | null
          user_id?: string | null
          vat?: number | null
          viewed_at?: string | null
        }
        Update: {
          amount?: number | null
          bottom_block?: Json | null
          company_datails?: Json | null
          created_at?: string
          currency?: string | null
          customer_details?: Json | null
          customer_id?: string | null
          customer_name?: string | null
          discount?: number | null
          due_date?: string | null
          file_path?: string[] | null
          file_size?: number | null
          from_details?: Json | null
          fts?: unknown | null
          id?: string
          internal_note?: string | null
          invoice_number?: string | null
          issue_date?: string | null
          line_items?: Json | null
          note?: string | null
          note_details?: Json | null
          paid_at?: string | null
          payment_details?: Json | null
          reminder_sent_at?: string | null
          scheduled_at?: string | null
          scheduled_job_id?: string | null
          sent_at?: string | null
          sent_to?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number | null
          tax?: number | null
          team_id?: string
          template?: Json | null
          token?: string
          top_block?: Json | null
          updated_at?: string | null
          url?: string | null
          user_id?: string | null
          vat?: number | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_limits_metrics"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "invoices_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_access_tokens: {
        Row: {
          application_id: string
          created_at: string
          expires_at: string
          id: string
          last_used_at: string | null
          refresh_token: string | null
          refresh_token_expires_at: string | null
          revoked: boolean | null
          revoked_at: string | null
          scopes: string[]
          team_id: string
          token: string
          user_id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          expires_at: string
          id?: string
          last_used_at?: string | null
          refresh_token?: string | null
          refresh_token_expires_at?: string | null
          revoked?: boolean | null
          revoked_at?: string | null
          scopes: string[]
          team_id: string
          token: string
          user_id: string
        }
        Update: {
          application_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          last_used_at?: string | null
          refresh_token?: string | null
          refresh_token_expires_at?: string | null
          revoked?: boolean | null
          revoked_at?: string | null
          scopes?: string[]
          team_id?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_access_tokens_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "oauth_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_access_tokens_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_limits_metrics"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "oauth_access_tokens_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_access_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_applications: {
        Row: {
          active: boolean | null
          client_id: string
          client_secret: string
          created_at: string
          created_by: string
          description: string | null
          developer_name: string | null
          id: string
          install_url: string | null
          is_public: boolean | null
          logo_url: string | null
          name: string
          overview: string | null
          redirect_uris: string[]
          scopes: string[]
          screenshots: string[] | null
          slug: string
          status: Database["public"]["Enums"]["approval_status"] | null
          team_id: string
          updated_at: string
          website: string | null
        }
        Insert: {
          active?: boolean | null
          client_id: string
          client_secret: string
          created_at?: string
          created_by: string
          description?: string | null
          developer_name?: string | null
          id?: string
          install_url?: string | null
          is_public?: boolean | null
          logo_url?: string | null
          name: string
          overview?: string | null
          redirect_uris: string[]
          scopes?: string[]
          screenshots?: string[] | null
          slug: string
          status?: Database["public"]["Enums"]["approval_status"] | null
          team_id: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          active?: boolean | null
          client_id?: string
          client_secret?: string
          created_at?: string
          created_by?: string
          description?: string | null
          developer_name?: string | null
          id?: string
          install_url?: string | null
          is_public?: boolean | null
          logo_url?: string | null
          name?: string
          overview?: string | null
          redirect_uris?: string[]
          scopes?: string[]
          screenshots?: string[] | null
          slug?: string
          status?: Database["public"]["Enums"]["approval_status"] | null
          team_id?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oauth_applications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_applications_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_limits_metrics"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "oauth_applications_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_authorization_codes: {
        Row: {
          application_id: string
          code: string
          code_challenge: string | null
          code_challenge_method: string | null
          created_at: string
          expires_at: string
          id: string
          redirect_uri: string
          scopes: string[]
          team_id: string
          used: boolean | null
          user_id: string
        }
        Insert: {
          application_id: string
          code: string
          code_challenge?: string | null
          code_challenge_method?: string | null
          created_at?: string
          expires_at: string
          id?: string
          redirect_uri: string
          scopes: string[]
          team_id: string
          used?: boolean | null
          user_id: string
        }
        Update: {
          application_id?: string
          code?: string
          code_challenge?: string | null
          code_challenge_method?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          redirect_uri?: string
          scopes?: string[]
          team_id?: string
          used?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_authorization_codes_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "oauth_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_authorization_codes_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_limits_metrics"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "oauth_authorization_codes_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_authorization_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string | null
          expire_at: string | null
          from: string | null
          id: string
          link_id: string | null
          short_link: string | null
          team_id: string | null
          to: string | null
          type: Database["public"]["Enums"]["reportTypes"] | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string | null
          expire_at?: string | null
          from?: string | null
          id?: string
          link_id?: string | null
          short_link?: string | null
          team_id?: string | null
          to?: string | null
          type?: Database["public"]["Enums"]["reportTypes"] | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string | null
          expire_at?: string | null
          from?: string | null
          id?: string
          link_id?: string | null
          short_link?: string | null
          team_id?: string | null
          to?: string | null
          type?: Database["public"]["Enums"]["reportTypes"] | null
        }
        Relationships: [
          {
            foreignKeyName: "public_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_limits_metrics"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "reports_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      short_links: {
        Row: {
          created_at: string
          expires_at: string | null
          file_name: string | null
          id: string
          mime_type: string | null
          short_id: string
          size: number | null
          team_id: string
          type: string | null
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          file_name?: string | null
          id?: string
          mime_type?: string | null
          short_id: string
          size?: number | null
          team_id: string
          type?: string | null
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          file_name?: string | null
          id?: string
          mime_type?: string | null
          short_id?: string
          size?: number | null
          team_id?: string
          type?: string | null
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "short_links_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_limits_metrics"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "short_links_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "short_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          team_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          team_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_limits_metrics"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "tags_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          base_currency: string | null
          canceled_at: string | null
          country_code: string | null
          created_at: string
          document_classification: boolean | null
          email: string | null
          flags: string[] | null
          id: string
          inbox_email: string | null
          inbox_forwarding: boolean | null
          inbox_id: string | null
          logo_url: string | null
          name: string | null
          plan: Database["public"]["Enums"]["plans"]
        }
        Insert: {
          base_currency?: string | null
          canceled_at?: string | null
          country_code?: string | null
          created_at?: string
          document_classification?: boolean | null
          email?: string | null
          flags?: string[] | null
          id?: string
          inbox_email?: string | null
          inbox_forwarding?: boolean | null
          inbox_id?: string | null
          logo_url?: string | null
          name?: string | null
          plan?: Database["public"]["Enums"]["plans"]
        }
        Update: {
          base_currency?: string | null
          canceled_at?: string | null
          country_code?: string | null
          created_at?: string
          document_classification?: boolean | null
          email?: string | null
          flags?: string[] | null
          id?: string
          inbox_email?: string | null
          inbox_forwarding?: boolean | null
          inbox_id?: string | null
          logo_url?: string | null
          name?: string | null
          plan?: Database["public"]["Enums"]["plans"]
        }
        Relationships: []
      }
      tracker_entries: {
        Row: {
          assigned_id: string | null
          billed: boolean | null
          created_at: string
          currency: string | null
          date: string | null
          description: string | null
          duration: number | null
          id: string
          project_id: string | null
          rate: number | null
          start: string | null
          stop: string | null
          team_id: string | null
          project_members: Record<string, unknown> | null
        }
        Insert: {
          assigned_id?: string | null
          billed?: boolean | null
          created_at?: string
          currency?: string | null
          date?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          project_id?: string | null
          rate?: number | null
          start?: string | null
          stop?: string | null
          team_id?: string | null
        }
        Update: {
          assigned_id?: string | null
          billed?: boolean | null
          created_at?: string
          currency?: string | null
          date?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          project_id?: string | null
          rate?: number | null
          start?: string | null
          stop?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tracker_entries_assigned_id_fkey"
            columns: ["assigned_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracker_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tracker_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracker_entries_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_limits_metrics"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "tracker_entries_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      tracker_project_tags: {
        Row: {
          created_at: string
          id: string
          tag_id: string
          team_id: string
          tracker_project_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          tag_id: string
          team_id: string
          tracker_project_id: string
        }
        Update: {
          created_at?: string
          id?: string
          tag_id?: string
          team_id?: string
          tracker_project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tags_tracker_project_id_fkey"
            columns: ["tracker_project_id"]
            isOneToOne: false
            referencedRelation: "tracker_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracker_project_tags_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_limits_metrics"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "tracker_project_tags_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      tracker_projects: {
        Row: {
          billable: boolean | null
          created_at: string
          currency: string | null
          customer_id: string | null
          description: string | null
          estimate: number | null
          fts: unknown | null
          id: string
          name: string
          rate: number | null
          status: Database["public"]["Enums"]["trackerStatus"]
          team_id: string | null
          get_assigned_users_for_project: Json | null
          get_project_total_amount: number | null
          project_members: Record<string, unknown> | null
          total_duration: number | null
        }
        Insert: {
          billable?: boolean | null
          created_at?: string
          currency?: string | null
          customer_id?: string | null
          description?: string | null
          estimate?: number | null
          fts?: unknown | null
          id?: string
          name: string
          rate?: number | null
          status?: Database["public"]["Enums"]["trackerStatus"]
          team_id?: string | null
        }
        Update: {
          billable?: boolean | null
          created_at?: string
          currency?: string | null
          customer_id?: string | null
          description?: string | null
          estimate?: number | null
          fts?: unknown | null
          id?: string
          name?: string
          rate?: number | null
          status?: Database["public"]["Enums"]["trackerStatus"]
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tracker_projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracker_projects_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_limits_metrics"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "tracker_projects_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      tracker_reports: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          link_id: string | null
          project_id: string | null
          short_link: string | null
          team_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          link_id?: string | null
          project_id?: string | null
          short_link?: string | null
          team_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          link_id?: string | null
          project_id?: string | null
          short_link?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_tracker_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_tracker_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tracker_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracker_reports_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_limits_metrics"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "tracker_reports_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_attachments: {
        Row: {
          created_at: string
          id: string
          name: string | null
          path: string[] | null
          size: number | null
          team_id: string | null
          transaction_id: string | null
          type: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          path?: string[] | null
          size?: number | null
          team_id?: string | null
          transaction_id?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          path?: string[] | null
          size?: number | null
          team_id?: string | null
          transaction_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_transaction_attachments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_limits_metrics"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "public_transaction_attachments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_transaction_attachments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          embedding: string | null
          excluded: boolean | null
          id: string
          name: string
          parent_id: string | null
          slug: string
          system: boolean | null
          tax_rate: number | null
          tax_reporting_code: string | null
          tax_type: string | null
          team_id: string
          vat: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          embedding?: string | null
          excluded?: boolean | null
          id?: string
          name: string
          parent_id?: string | null
          slug: string
          system?: boolean | null
          tax_rate?: number | null
          tax_reporting_code?: string | null
          tax_type?: string | null
          team_id?: string
          vat?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          embedding?: string | null
          excluded?: boolean | null
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
          system?: boolean | null
          tax_rate?: number | null
          tax_reporting_code?: string | null
          tax_type?: string | null
          team_id?: string
          vat?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "transaction_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_categories_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_limits_metrics"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "transaction_categories_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_enrichments: {
        Row: {
          category_slug: string | null
          created_at: string
          id: string
          name: string | null
          system: boolean | null
          team_id: string | null
        }
        Insert: {
          category_slug?: string | null
          created_at?: string
          id?: string
          name?: string | null
          system?: boolean | null
          team_id?: string | null
        }
        Update: {
          category_slug?: string | null
          created_at?: string
          id?: string
          name?: string | null
          system?: boolean | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_enrichments_category_slug_team_id_fkey"
            columns: ["category_slug", "team_id"]
            isOneToOne: false
            referencedRelation: "transaction_categories"
            referencedColumns: ["slug", "team_id"]
          },
          {
            foreignKeyName: "transaction_enrichments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_limits_metrics"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "transaction_enrichments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_tags: {
        Row: {
          created_at: string
          id: string
          tag_id: string
          team_id: string
          transaction_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          tag_id: string
          team_id: string
          transaction_id: string
        }
        Update: {
          created_at?: string
          id?: string
          tag_id?: string
          team_id?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_tags_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_limits_metrics"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "transaction_tags_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_tags_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          assigned_id: string | null
          balance: number | null
          bank_account_id: string | null
          base_amount: number | null
          base_currency: string | null
          category: Database["public"]["Enums"]["transactionCategories"] | null
          category_slug: string | null
          counterparty_name: string | null
          created_at: string
          currency: string
          date: string
          description: string | null
          frequency: Database["public"]["Enums"]["transaction_frequency"] | null
          fts_vector: unknown | null
          id: string
          internal: boolean | null
          internal_id: string
          manual: boolean | null
          method: Database["public"]["Enums"]["transactionMethods"]
          name: string
          note: string | null
          notified: boolean | null
          recurring: boolean | null
          status: Database["public"]["Enums"]["transactionStatus"] | null
          tax_rate: number | null
          tax_type: string | null
          team_id: string
          amount_text: string | null
          calculated_vat: number | null
          is_fulfilled: boolean | null
        }
        Insert: {
          amount: number
          assigned_id?: string | null
          balance?: number | null
          bank_account_id?: string | null
          base_amount?: number | null
          base_currency?: string | null
          category?: Database["public"]["Enums"]["transactionCategories"] | null
          category_slug?: string | null
          counterparty_name?: string | null
          created_at?: string
          currency: string
          date: string
          description?: string | null
          frequency?:
            | Database["public"]["Enums"]["transaction_frequency"]
            | null
          fts_vector?: unknown | null
          id?: string
          internal?: boolean | null
          internal_id: string
          manual?: boolean | null
          method: Database["public"]["Enums"]["transactionMethods"]
          name: string
          note?: string | null
          notified?: boolean | null
          recurring?: boolean | null
          status?: Database["public"]["Enums"]["transactionStatus"] | null
          tax_rate?: number | null
          tax_type?: string | null
          team_id: string
        }
        Update: {
          amount?: number
          assigned_id?: string | null
          balance?: number | null
          bank_account_id?: string | null
          base_amount?: number | null
          base_currency?: string | null
          category?: Database["public"]["Enums"]["transactionCategories"] | null
          category_slug?: string | null
          counterparty_name?: string | null
          created_at?: string
          currency?: string
          date?: string
          description?: string | null
          frequency?:
            | Database["public"]["Enums"]["transaction_frequency"]
            | null
          fts_vector?: unknown | null
          id?: string
          internal?: boolean | null
          internal_id?: string
          manual?: boolean | null
          method?: Database["public"]["Enums"]["transactionMethods"]
          name?: string
          note?: string | null
          notified?: boolean | null
          recurring?: boolean | null
          status?: Database["public"]["Enums"]["transactionStatus"] | null
          tax_rate?: number | null
          tax_type?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_transactions_assigned_id_fkey"
            columns: ["assigned_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_transactions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_limits_metrics"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "public_transactions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_slug_team_id_fkey"
            columns: ["category_slug", "team_id"]
            isOneToOne: false
            referencedRelation: "transaction_categories"
            referencedColumns: ["slug", "team_id"]
          },
        ]
      }
      user_invites: {
        Row: {
          code: string | null
          created_at: string
          email: string | null
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["teamRoles"] | null
          team_id: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          email?: string | null
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["teamRoles"] | null
          team_id?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          email?: string | null
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["teamRoles"] | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_user_invites_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_limits_metrics"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "public_user_invites_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          date_format: string | null
          email: string | null
          full_name: string | null
          id: string
          locale: string | null
          team_id: string | null
          time_format: number | null
          timezone: string | null
          timezone_auto_sync: boolean
          week_starts_on_monday: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          date_format?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          locale?: string | null
          team_id?: string | null
          time_format?: number | null
          timezone?: string | null
          timezone_auto_sync?: boolean
          week_starts_on_monday?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          date_format?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          locale?: string | null
          team_id?: string | null
          time_format?: number | null
          timezone?: string | null
          timezone_auto_sync?: boolean
          week_starts_on_monday?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "users_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_limits_metrics"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "users_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      users_on_team: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["teamRoles"] | null
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["teamRoles"] | null
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["teamRoles"] | null
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_on_team_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_limits_metrics"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "users_on_team_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_on_team_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      team_limits_metrics: {
        Row: {
          inbox_created_this_month: number | null
          invoices_created_this_month: number | null
          number_of_bank_connections: number | null
          number_of_users: number | null
          team_id: string | null
          total_document_size: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      amount_text: {
        Args: { "": Database["public"]["Tables"]["transactions"]["Row"] }
        Returns: string
      }
      calculate_amount_similarity: {
        Args: {
          transaction_currency: string
          inbox_currency: string
          transaction_amount: number
          inbox_amount: number
        }
        Returns: number
      }
      calculate_base_amount_score: {
        Args: {
          transaction_base_currency: string
          inbox_base_currency: string
          transaction_base_amount: number
          inbox_base_amount: number
        }
        Returns: number
      }
      calculate_date_proximity_score: {
        Args: { t_date: string; i_date: string }
        Returns: number
      }
      calculate_date_similarity: {
        Args: { transaction_date: string; inbox_date: string }
        Returns: number
      }
      calculate_match_score: {
        Args: {
          t_record: Record<string, unknown>
          i_record: Record<string, unknown>
        }
        Returns: number
      }
      calculate_name_similarity_score: {
        Args: { transaction_name: string; inbox_name: string }
        Returns: number
      }
      calculate_overall_similarity: {
        Args: {
          transaction_record: Record<string, unknown>
          inbox_record: Record<string, unknown>
        }
        Returns: number
      }
      calculate_total_sum: {
        Args: { target_currency: string }
        Returns: number
      }
      calculate_total_sum2: {
        Args: { target_currency: string }
        Returns: number
      }
      calculate_transaction_differences_v2: {
        Args: { p_team_id: string }
        Returns: {
          transaction_group: string
          date: string
          team_id: string
          recurring: boolean
          frequency: Database["public"]["Enums"]["transaction_frequency"]
          days_diff: number
        }[]
      }
      calculate_transaction_frequency: {
        Args: {
          p_transaction_group: string
          p_team_id: string
          p_new_date: string
        }
        Returns: {
          avg_days_between: number
          transaction_count: number
          is_recurring: boolean
          latest_frequency: string
        }[]
      }
      calculated_vat: {
        Args: { "": Database["public"]["Tables"]["transactions"]["Row"] }
        Returns: number
      }
      classify_frequency_v2: {
        Args: { p_team_id: string }
        Returns: {
          transaction_group: string
          team_id: string
          transaction_count: number
          avg_days_between: number
          stddev_days_between: number
          frequency: Database["public"]["Enums"]["transaction_frequency"]
        }[]
      }
      create_team: {
        Args: { name: string }
        Returns: string
      }
      create_team_v2: {
        Args: { name: string; currency?: string }
        Returns: string
      }
      determine_transaction_frequency: {
        Args:
          | { p_avg_days_between: number; p_transaction_count: number }
          | {
              p_avg_days_between: number
              p_transaction_count: number
              p_is_recurring: boolean
              p_latest_frequency: string
            }
        Returns: string
      }
      extract_product_names: {
        Args: { products_json: Json }
        Returns: string
      }
      find_matching_inbox_item: {
        Args: { input_transaction_id: string; specific_inbox_id?: string }
        Returns: {
          inbox_id: string
          transaction_id: string
          transaction_name: string
          similarity_score: number
          file_name: string
        }[]
      }
      generate_hmac: {
        Args: { secret_key: string; message: string }
        Returns: string
      }
      generate_id: {
        Args: { size: number }
        Returns: string
      }
      generate_inbox: {
        Args: { size: number }
        Returns: string
      }
      generate_inbox_fts: {
        Args:
          | { display_name: string; products_json: Json }
          | { display_name_text: string; product_names: string }
          | {
              display_name_text: string
              product_names: string
              amount: number
              due_date: string
            }
        Returns: unknown
      }
      get_all_transactions_by_account: {
        Args: { account_id: string }
        Returns: {
          amount: number
          assigned_id: string | null
          balance: number | null
          bank_account_id: string | null
          base_amount: number | null
          base_currency: string | null
          category: Database["public"]["Enums"]["transactionCategories"] | null
          category_slug: string | null
          counterparty_name: string | null
          created_at: string
          currency: string
          date: string
          description: string | null
          frequency: Database["public"]["Enums"]["transaction_frequency"] | null
          fts_vector: unknown | null
          id: string
          internal: boolean | null
          internal_id: string
          manual: boolean | null
          method: Database["public"]["Enums"]["transactionMethods"]
          name: string
          note: string | null
          notified: boolean | null
          recurring: boolean | null
          status: Database["public"]["Enums"]["transactionStatus"] | null
          tax_rate: number | null
          tax_type: string | null
          team_id: string
        }[]
      }
      get_assigned_users_for_project: {
        Args: { "": Database["public"]["Tables"]["tracker_projects"]["Row"] }
        Returns: Json
      }
      get_bank_account_currencies: {
        Args: { team_id: string }
        Returns: {
          currency: string
        }[]
      }
      get_burn_rate: {
        Args: {
          team_id: string
          date_from: string
          date_to: string
          currency: string
        }
        Returns: {
          date: string
          value: number
        }[]
      }
      get_burn_rate_v2: {
        Args: {
          team_id: string
          date_from: string
          date_to: string
          base_currency?: string
        }
        Returns: {
          date: string
          value: number
          currency: string
        }[]
      }
      get_burn_rate_v3: {
        Args: {
          team_id: string
          date_from: string
          date_to: string
          base_currency?: string
        }
        Returns: {
          date: string
          value: number
          currency: string
        }[]
      }
      get_burn_rate_v4: {
        Args: {
          team_id: string
          date_from: string
          date_to: string
          base_currency?: string
        }
        Returns: {
          date: string
          value: number
          currency: string
        }[]
      }
      get_current_burn_rate: {
        Args: { team_id: string; currency: string }
        Returns: number
      }
      get_current_burn_rate_v2: {
        Args: { team_id: string; base_currency?: string }
        Returns: {
          currency: string
          value: number
        }[]
      }
      get_current_burn_rate_v3: {
        Args: { team_id: string; base_currency?: string }
        Returns: {
          currency: string
          value: number
        }[]
      }
      get_current_user_team_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_customer_name: {
        Args: { customer_id: string }
        Returns: string
      }
      get_expenses: {
        Args: {
          team_id: string
          date_from: string
          date_to: string
          base_currency?: string
        }
        Returns: {
          date: string
          value: number
          recurring_value: number
          currency: string
        }[]
      }
      get_invoice_count: {
        Args: {
          customer_record: Database["public"]["Tables"]["customers"]["Row"]
        }
        Returns: number
      }
      get_invoice_summary: {
        Args: {
          team_id: string
          status?: Database["public"]["Enums"]["invoice_status"]
        }
        Returns: {
          currency: string
          total_amount: number
          invoice_count: number
        }[]
      }
      get_next_invoice_number: {
        Args: { team_id: string }
        Returns: string
      }
      get_payment_score: {
        Args: { team_id: string }
        Returns: {
          score: number
          payment_status: string
        }[]
      }
      get_profit: {
        Args: {
          team_id: string
          date_from: string
          date_to: string
          currency: string
        }
        Returns: {
          date: string
          value: number
        }[]
      }
      get_profit_v2: {
        Args: {
          team_id: string
          date_from: string
          date_to: string
          base_currency?: string
        }
        Returns: {
          date: string
          value: number
          currency: string
        }[]
      }
      get_profit_v3: {
        Args: {
          team_id: string
          date_from: string
          date_to: string
          base_currency?: string
        }
        Returns: {
          date: string
          value: number
          currency: string
        }[]
      }
      get_profit_v4: {
        Args: {
          team_id: string
          date_from: string
          date_to: string
          base_currency?: string
        }
        Returns: {
          date: string
          value: number
          currency: string
        }[]
      }
      get_project_assigned_users_count: {
        Args: {
          tracker_project_record: Database["public"]["Tables"]["tracker_projects"]["Row"]
        }
        Returns: number
      }
      get_project_count: {
        Args: {
          customer_record: Database["public"]["Tables"]["customers"]["Row"]
        }
        Returns: number
      }
      get_project_total_amount: {
        Args: { "": Database["public"]["Tables"]["tracker_projects"]["Row"] }
        Returns: number
      }
      get_revenue: {
        Args: {
          team_id: string
          date_from: string
          date_to: string
          currency: string
        }
        Returns: {
          date: string
          value: number
        }[]
      }
      get_revenue_v2: {
        Args: {
          team_id: string
          date_from: string
          date_to: string
          base_currency?: string
        }
        Returns: {
          date: string
          value: number
          currency: string
        }[]
      }
      get_revenue_v3: {
        Args: {
          team_id: string
          date_from: string
          date_to: string
          base_currency?: string
        }
        Returns: {
          date: string
          value: number
          currency: string
        }[]
      }
      get_runway: {
        Args: {
          team_id: string
          date_from: string
          date_to: string
          currency: string
        }
        Returns: number
      }
      get_runway_v2: {
        Args: {
          team_id: string
          date_from: string
          date_to: string
          base_currency?: string
        }
        Returns: number
      }
      get_runway_v3: {
        Args: {
          team_id: string
          date_from: string
          date_to: string
          base_currency?: string
        }
        Returns: number
      }
      get_runway_v4: {
        Args: {
          team_id: string
          date_from: string
          date_to: string
          base_currency?: string
        }
        Returns: number
      }
      get_spending: {
        Args: {
          team_id: string
          date_from: string
          date_to: string
          currency_target: string
        }
        Returns: {
          name: string
          slug: string
          amount: number
          currency: string
          color: string
          percentage: number
        }[]
      }
      get_spending_v2: {
        Args: {
          team_id: string
          date_from: string
          date_to: string
          base_currency?: string
        }
        Returns: {
          name: string
          slug: string
          amount: number
          currency: string
          color: string
          percentage: number
        }[]
      }
      get_spending_v3: {
        Args: {
          team_id: string
          date_from: string
          date_to: string
          base_currency?: string
        }
        Returns: {
          name: string
          slug: string
          amount: number
          currency: string
          color: string
          percentage: number
        }[]
      }
      get_spending_v4: {
        Args: {
          team_id: string
          date_from: string
          date_to: string
          base_currency?: string
        }
        Returns: {
          name: string
          slug: string
          amount: number
          currency: string
          color: string
          percentage: number
        }[]
      }
      get_team_bank_accounts_balances: {
        Args: { team_id: string }
        Returns: {
          id: string
          currency: string
          balance: number
          name: string
          logo_url: string
        }[]
      }
      get_team_limits_metrics: {
        Args: { input_team_id: string }
        Returns: {
          team_id: string
          total_document_size: number
          number_of_users: number
          number_of_bank_connections: number
          invoices_created_this_month: number
          inbox_created_this_month: number
        }[]
      }
      get_total_balance: {
        Args: { team_id: string; currency: string }
        Returns: number
      }
      get_total_balance_v2: {
        Args: { team_id: string; currency: string }
        Returns: number
      }
      get_total_balance_v3: {
        Args: { team_id: string; currency: string }
        Returns: number
      }
      get_transactions_amount_full_range_data: {
        Args: { team_id: string; amount_type?: string }
        Returns: {
          amount: number
          currency: string
        }[]
      }
      get_transactions_amount_range_data: {
        Args: { team_id: string; amount_type?: string }
        Returns: {
          id: string
          amount: number
        }[]
      }
      global_search: {
        Args: {
          p_search_term: string
          p_team_id: string
          p_search_lang?: string
          p_limit?: number
          p_items_per_table_limit?: number
          p_relevance_threshold?: number
        }
        Returns: {
          id: string
          type: string
          relevance: number
          created_at: string
          data: Json
        }[]
      }
      global_semantic_search: {
        Args: {
          team_id: string
          search_term?: string
          start_date?: string
          end_date?: string
          types?: string[]
          amount?: number
          amount_min?: number
          amount_max?: number
          status?: string
          currency?: string
          language?: string
          due_date_start?: string
          due_date_end?: string
          max_results?: number
          items_per_table_limit?: number
        }
        Returns: {
          id: string
          type: string
          relevance: number
          created_at: string
          data: Json
        }[]
      }
      group_transactions_v2: {
        Args: { p_team_id: string }
        Returns: {
          transaction_group: string
          date: string
          team_id: string
          recurring: boolean
          frequency: Database["public"]["Enums"]["transaction_frequency"]
        }[]
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      identify_similar_transactions_v2: {
        Args: { p_team_id: string }
        Returns: {
          original_transaction_name: string
          similar_transaction_name: string
          team_id: string
        }[]
      }
      identify_transaction_group: {
        Args: { p_name: string; p_team_id: string }
        Returns: string
      }
      inbox_amount_text: {
        Args: { "": Database["public"]["Tables"]["inbox"]["Row"] }
        Returns: string
      }
      is_customer_tagged: {
        Args: {
          customer_record: Database["public"]["Tables"]["customers"]["Row"]
        }
        Returns: boolean
      }
      is_fulfilled: {
        Args: { "": Database["public"]["Tables"]["transactions"]["Row"] }
        Returns: boolean
      }
      is_project_tagged: {
        Args: {
          project: Database["public"]["Tables"]["tracker_projects"]["Row"]
        }
        Returns: boolean
      }
      is_transaction_tagged: {
        Args: {
          transaction: Database["public"]["Tables"]["transactions"]["Row"]
        }
        Returns: boolean
      }
      match_similar_documents_by_title: {
        Args: {
          source_document_id: string
          p_team_id: string
          match_threshold: number
          match_count: number
        }
        Returns: {
          id: string
          name: string
          metadata: Json
          path_tokens: string[]
          tag: string
          title: string
          summary: string
          title_similarity: number
        }[]
      }
      match_transactions_to_inbox: {
        Args: {
          p_team_id: string
          p_inbox_id: string
          p_max_results?: number
          p_min_confidence_score?: number
        }
        Returns: {
          transaction_id: string
          name: string
          transaction_amount: number
          transaction_currency: string
          transaction_date: string
          name_score: number
          amount_score: number
          currency_score: number
          date_score: number
          confidence_score: number
        }[]
      }
      nanoid: {
        Args: {
          size?: number
          alphabet?: string
          additionalbytesfactor?: number
        }
        Returns: string
      }
      nanoid_optimized: {
        Args: { size: number; alphabet: string; mask: number; step: number }
        Returns: string
      }
      project_members: {
        Args:
          | { "": Database["public"]["Tables"]["tracker_entries"]["Row"] }
          | { "": Database["public"]["Tables"]["tracker_projects"]["Row"] }
        Returns: {
          id: string
          avatar_url: string
          full_name: string
        }[]
      }
      search_transactions: {
        Args: {
          team_id: string
          inbox_id?: string
          query?: string
          max_results?: number
        }
        Returns: {
          transaction_id: string
          name: string
          transaction_amount: number
          transaction_currency: string
          transaction_date: string
          name_score: number
          amount_score: number
          currency_score: number
          date_score: number
          confidence_score: number
        }[]
      }
      search_transactions_direct: {
        Args: { p_team_id: string; p_query: string; p_max_results?: number }
        Returns: {
          transaction_id: string
          name: string
          transaction_amount: number
          transaction_currency: string
          transaction_date: string
          name_score: number
          amount_score: number
          currency_score: number
          date_score: number
          confidence_score: number
        }[]
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      slugify: {
        Args: { value: string }
        Returns: string
      }
      total_duration: {
        Args: { "": Database["public"]["Tables"]["tracker_projects"]["Row"] }
        Returns: number
      }
      unaccent: {
        Args: { "": string }
        Returns: string
      }
      unaccent_init: {
        Args: { "": unknown }
        Returns: unknown
      }
    }
    Enums: {
      account_type:
        | "depository"
        | "credit"
        | "other_asset"
        | "loan"
        | "other_liability"
      approval_status: "draft" | "pending" | "approved" | "rejected"
      bank_providers:
        | "gocardless"
        | "plaid"
        | "teller"
        | "enablebanking"
        | "pluggy"
      bankProviders: "gocardless" | "plaid" | "teller"
      connection_status: "disconnected" | "connected" | "unknown"
      document_processing_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
      inbox_account_providers: "gmail"
      inbox_status:
        | "processing"
        | "pending"
        | "archived"
        | "new"
        | "deleted"
        | "done"
      inbox_type: "invoice" | "expense"
      invoice_delivery_type: "create" | "create_and_send" | "scheduled"
      invoice_size: "a4" | "letter"
      invoice_status:
        | "draft"
        | "overdue"
        | "paid"
        | "unpaid"
        | "canceled"
        | "scheduled"
      plans: "trial" | "starter" | "pro"
      reportTypes: "profit" | "revenue" | "burn_rate" | "expense"
      teamRoles: "owner" | "member"
      trackerStatus: "in_progress" | "completed"
      transaction_frequency:
        | "weekly"
        | "biweekly"
        | "monthly"
        | "semi_monthly"
        | "annually"
        | "irregular"
        | "unknown"
      transactionCategories:
        | "travel"
        | "office_supplies"
        | "meals"
        | "software"
        | "rent"
        | "income"
        | "equipment"
        | "transfer"
        | "internet_and_telephone"
        | "facilities_expenses"
        | "activity"
        | "uncategorized"
        | "taxes"
        | "other"
        | "salary"
        | "fees"
      transactionMethods:
        | "payment"
        | "card_purchase"
        | "card_atm"
        | "transfer"
        | "other"
        | "unknown"
        | "ach"
        | "interest"
        | "deposit"
        | "wire"
        | "fee"
      transactionStatus:
        | "posted"
        | "pending"
        | "excluded"
        | "completed"
        | "archived"
    }
    CompositeTypes: {
      metrics_record: {
        date: string | null
        value: number | null
      }
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
      account_type: [
        "depository",
        "credit",
        "other_asset",
        "loan",
        "other_liability",
      ],
      approval_status: ["draft", "pending", "approved", "rejected"],
      bank_providers: [
        "gocardless",
        "plaid",
        "teller",
        "enablebanking",
        "pluggy",
      ],
      bankProviders: ["gocardless", "plaid", "teller"],
      connection_status: ["disconnected", "connected", "unknown"],
      document_processing_status: [
        "pending",
        "processing",
        "completed",
        "failed",
      ],
      inbox_account_providers: ["gmail"],
      inbox_status: [
        "processing",
        "pending",
        "archived",
        "new",
        "deleted",
        "done",
      ],
      inbox_type: ["invoice", "expense"],
      invoice_delivery_type: ["create", "create_and_send", "scheduled"],
      invoice_size: ["a4", "letter"],
      invoice_status: [
        "draft",
        "overdue",
        "paid",
        "unpaid",
        "canceled",
        "scheduled",
      ],
      plans: ["trial", "starter", "pro"],
      reportTypes: ["profit", "revenue", "burn_rate", "expense"],
      teamRoles: ["owner", "member"],
      trackerStatus: ["in_progress", "completed"],
      transaction_frequency: [
        "weekly",
        "biweekly",
        "monthly",
        "semi_monthly",
        "annually",
        "irregular",
        "unknown",
      ],
      transactionCategories: [
        "travel",
        "office_supplies",
        "meals",
        "software",
        "rent",
        "income",
        "equipment",
        "transfer",
        "internet_and_telephone",
        "facilities_expenses",
        "activity",
        "uncategorized",
        "taxes",
        "other",
        "salary",
        "fees",
      ],
      transactionMethods: [
        "payment",
        "card_purchase",
        "card_atm",
        "transfer",
        "other",
        "unknown",
        "ach",
        "interest",
        "deposit",
        "wire",
        "fee",
      ],
      transactionStatus: [
        "posted",
        "pending",
        "excluded",
        "completed",
        "archived",
      ],
    },
  },
} as const
