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
      accounting_sync_records: {
        Row: {
          created_at: string
          error_code: string | null
          error_message: string | null
          id: string
          provider: Database["public"]["Enums"]["accounting_provider"]
          provider_entity_type: string | null
          provider_tenant_id: string
          provider_transaction_id: string | null
          status: Database["public"]["Enums"]["accounting_sync_status"]
          sync_type: Database["public"]["Enums"]["accounting_sync_type"] | null
          synced_at: string
          synced_attachment_mapping: Json
          team_id: string
          transaction_id: string
        }
        Insert: {
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          provider: Database["public"]["Enums"]["accounting_provider"]
          provider_entity_type?: string | null
          provider_tenant_id: string
          provider_transaction_id?: string | null
          status?: Database["public"]["Enums"]["accounting_sync_status"]
          sync_type?: Database["public"]["Enums"]["accounting_sync_type"] | null
          synced_at?: string
          synced_attachment_mapping?: Json
          team_id: string
          transaction_id: string
        }
        Update: {
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          provider?: Database["public"]["Enums"]["accounting_provider"]
          provider_entity_type?: string | null
          provider_tenant_id?: string
          provider_transaction_id?: string | null
          status?: Database["public"]["Enums"]["accounting_sync_status"]
          sync_type?: Database["public"]["Enums"]["accounting_sync_type"] | null
          synced_at?: string
          synced_attachment_mapping?: Json
          team_id?: string
          transaction_id?: string
        }
        Relationships: []
      }
      activities: {
        Row: {
          created_at: string
          group_id: string | null
          id: string
          last_used_at: string | null
          metadata: Json
          priority: number | null
          source: Database["public"]["Enums"]["activity_source"]
          status: Database["public"]["Enums"]["activity_status"]
          team_id: string
          type: Database["public"]["Enums"]["activity_type"]
          user_id: string | null
        }
        Insert: {
          created_at?: string
          group_id?: string | null
          id?: string
          last_used_at?: string | null
          metadata: Json
          priority?: number | null
          source: Database["public"]["Enums"]["activity_source"]
          status?: Database["public"]["Enums"]["activity_status"]
          team_id: string
          type: Database["public"]["Enums"]["activity_type"]
          user_id?: string | null
        }
        Update: {
          created_at?: string
          group_id?: string | null
          id?: string
          last_used_at?: string | null
          metadata?: Json
          priority?: number | null
          source?: Database["public"]["Enums"]["activity_source"]
          status?: Database["public"]["Enums"]["activity_status"]
          team_id?: string
          type?: Database["public"]["Enums"]["activity_type"]
          user_id?: string | null
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string
          id: string
          key_encrypted: string
          key_hash: string | null
          last_used_at: string | null
          name: string
          scopes: string[]
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          key_encrypted: string
          key_hash?: string | null
          last_used_at?: string | null
          name: string
          scopes?: string[]
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          key_encrypted?: string
          key_hash?: string | null
          last_used_at?: string | null
          name?: string
          scopes?: string[]
          team_id?: string
          user_id?: string
        }
        Relationships: []
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
        Relationships: []
      }
      bank_accounts: {
        Row: {
          account_id: string
          account_number: string | null
          account_reference: string | null
          availableBalance: number | null
          balance: number | null
          bank_connection_id: string | null
          base_currency: string | null
          baseBalance: number | null
          bic: string | null
          created_at: string
          created_by: string
          creditLimit: number | null
          currency: string | null
          enabled: boolean
          error_details: string | null
          error_retries: number | null
          iban: string | null
          id: string
          manual: boolean | null
          name: string | null
          routing_number: string | null
          sort_code: string | null
          subtype: string | null
          team_id: string
          type: Database["public"]["Enums"]["account_type"] | null
          wire_routing_number: string | null
        }
        Insert: {
          account_id: string
          account_number?: string | null
          account_reference?: string | null
          availableBalance?: number | null
          balance?: number | null
          bank_connection_id?: string | null
          base_currency?: string | null
          baseBalance?: number | null
          bic?: string | null
          created_at?: string
          created_by: string
          creditLimit?: number | null
          currency?: string | null
          enabled?: boolean
          error_details?: string | null
          error_retries?: number | null
          iban?: string | null
          id?: string
          manual?: boolean | null
          name?: string | null
          routing_number?: string | null
          sort_code?: string | null
          subtype?: string | null
          team_id: string
          type?: Database["public"]["Enums"]["account_type"] | null
          wire_routing_number?: string | null
        }
        Update: {
          account_id?: string
          account_number?: string | null
          account_reference?: string | null
          availableBalance?: number | null
          balance?: number | null
          bank_connection_id?: string | null
          base_currency?: string | null
          baseBalance?: number | null
          bic?: string | null
          created_at?: string
          created_by?: string
          creditLimit?: number | null
          currency?: string | null
          enabled?: boolean
          error_details?: string | null
          error_retries?: number | null
          iban?: string | null
          id?: string
          manual?: boolean | null
          name?: string | null
          routing_number?: string | null
          sort_code?: string | null
          subtype?: string | null
          team_id?: string
          type?: Database["public"]["Enums"]["account_type"] | null
          wire_routing_number?: string | null
        }
        Relationships: []
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
          provider: Database["public"]["Enums"]["bank_providers"]
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
          provider: Database["public"]["Enums"]["bank_providers"]
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
          provider?: Database["public"]["Enums"]["bank_providers"]
          reference_id?: string | null
          status?: Database["public"]["Enums"]["connection_status"] | null
          team_id?: string
        }
        Relationships: []
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
        Relationships: []
      }
      customers: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          billingEmail: string | null
          ceo_name: string | null
          city: string | null
          company_type: string | null
          contact: string | null
          country: string | null
          country_code: string | null
          created_at: string
          default_payment_terms: number | null
          description: string | null
          email: string
          employee_count: string | null
          enriched_at: string | null
          enrichment_status: string | null
          estimated_revenue: string | null
          external_id: string | null
          facebook_url: string | null
          finance_contact: string | null
          finance_contact_email: string | null
          fiscal_year_end: string | null
          founded_year: number | null
          fts: unknown
          funding_stage: string | null
          headquarters_location: string | null
          id: string
          industry: string | null
          instagram_url: string | null
          is_archived: boolean | null
          linkedin_url: string | null
          logo_url: string | null
          name: string
          note: string | null
          phone: string | null
          portal_enabled: boolean | null
          portal_id: string | null
          preferred_currency: string | null
          primary_language: string | null
          source: string | null
          state: string | null
          status: string | null
          team_id: string
          timezone: string | null
          token: string
          total_funding: string | null
          twitter_url: string | null
          vat_number: string | null
          website: string | null
          zip: string | null
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          billingEmail?: string | null
          ceo_name?: string | null
          city?: string | null
          company_type?: string | null
          contact?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          default_payment_terms?: number | null
          description?: string | null
          email: string
          employee_count?: string | null
          enriched_at?: string | null
          enrichment_status?: string | null
          estimated_revenue?: string | null
          external_id?: string | null
          facebook_url?: string | null
          finance_contact?: string | null
          finance_contact_email?: string | null
          fiscal_year_end?: string | null
          founded_year?: number | null
          fts?: unknown
          funding_stage?: string | null
          headquarters_location?: string | null
          id?: string
          industry?: string | null
          instagram_url?: string | null
          is_archived?: boolean | null
          linkedin_url?: string | null
          logo_url?: string | null
          name: string
          note?: string | null
          phone?: string | null
          portal_enabled?: boolean | null
          portal_id?: string | null
          preferred_currency?: string | null
          primary_language?: string | null
          source?: string | null
          state?: string | null
          status?: string | null
          team_id?: string
          timezone?: string | null
          token?: string
          total_funding?: string | null
          twitter_url?: string | null
          vat_number?: string | null
          website?: string | null
          zip?: string | null
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          billingEmail?: string | null
          ceo_name?: string | null
          city?: string | null
          company_type?: string | null
          contact?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          default_payment_terms?: number | null
          description?: string | null
          email?: string
          employee_count?: string | null
          enriched_at?: string | null
          enrichment_status?: string | null
          estimated_revenue?: string | null
          external_id?: string | null
          facebook_url?: string | null
          finance_contact?: string | null
          finance_contact_email?: string | null
          fiscal_year_end?: string | null
          founded_year?: number | null
          fts?: unknown
          funding_stage?: string | null
          headquarters_location?: string | null
          id?: string
          industry?: string | null
          instagram_url?: string | null
          is_archived?: boolean | null
          linkedin_url?: string | null
          logo_url?: string | null
          name?: string
          note?: string | null
          phone?: string | null
          portal_enabled?: boolean | null
          portal_id?: string | null
          preferred_currency?: string | null
          primary_language?: string | null
          source?: string | null
          state?: string | null
          status?: string | null
          team_id?: string
          timezone?: string | null
          token?: string
          total_funding?: string | null
          twitter_url?: string | null
          vat_number?: string | null
          website?: string | null
          zip?: string | null
        }
        Relationships: []
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
        Relationships: []
      }
      document_tag_embeddings: {
        Row: {
          embedding: string | null
          model: string
          name: string
          slug: string
        }
        Insert: {
          embedding?: string | null
          model?: string
          name: string
          slug: string
        }
        Update: {
          embedding?: string | null
          model?: string
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
        Relationships: []
      }
      documents: {
        Row: {
          body: string | null
          content: string | null
          created_at: string | null
          date: string | null
          fts: unknown
          fts_english: unknown
          fts_language: unknown
          fts_simple: unknown
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
          fts?: unknown
          fts_english?: unknown
          fts_language?: unknown
          fts_simple?: unknown
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
          fts?: unknown
          fts_english?: unknown
          fts_language?: unknown
          fts_simple?: unknown
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
        Relationships: []
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
          fts: unknown
          grouped_inbox_id: string | null
          id: string
          inbox_account_id: string | null
          invoice_number: string | null
          meta: Json | null
          reference_id: string | null
          sender_email: string | null
          size: number | null
          status: Database["public"]["Enums"]["inbox_status"] | null
          tax_amount: number | null
          tax_rate: number | null
          tax_type: string | null
          team_id: string | null
          transaction_id: string | null
          type: Database["public"]["Enums"]["inbox_type"] | null
          website: string | null
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
          fts?: unknown
          grouped_inbox_id?: string | null
          id?: string
          inbox_account_id?: string | null
          invoice_number?: string | null
          meta?: Json | null
          reference_id?: string | null
          sender_email?: string | null
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
          fts?: unknown
          grouped_inbox_id?: string | null
          id?: string
          inbox_account_id?: string | null
          invoice_number?: string | null
          meta?: Json | null
          reference_id?: string | null
          sender_email?: string | null
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
        Relationships: []
      }
      inbox_accounts: {
        Row: {
          access_token: string
          created_at: string
          email: string
          error_message: string | null
          expiry_date: string
          external_id: string
          id: string
          last_accessed: string
          provider: Database["public"]["Enums"]["inbox_account_providers"]
          refresh_token: string
          schedule_id: string | null
          status: Database["public"]["Enums"]["inbox_account_status"]
          team_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          email: string
          error_message?: string | null
          expiry_date: string
          external_id: string
          id?: string
          last_accessed: string
          provider: Database["public"]["Enums"]["inbox_account_providers"]
          refresh_token: string
          schedule_id?: string | null
          status?: Database["public"]["Enums"]["inbox_account_status"]
          team_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          email?: string
          error_message?: string | null
          expiry_date?: string
          external_id?: string
          id?: string
          last_accessed?: string
          provider?: Database["public"]["Enums"]["inbox_account_providers"]
          refresh_token?: string
          schedule_id?: string | null
          status?: Database["public"]["Enums"]["inbox_account_status"]
          team_id?: string
        }
        Relationships: []
      }
      inbox_blocklist: {
        Row: {
          created_at: string
          id: string
          team_id: string
          type: Database["public"]["Enums"]["inbox_blocklist_type"]
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          team_id: string
          type: Database["public"]["Enums"]["inbox_blocklist_type"]
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          team_id?: string
          type?: Database["public"]["Enums"]["inbox_blocklist_type"]
          value?: string
        }
        Relationships: []
      }
      inbox_embeddings: {
        Row: {
          created_at: string
          embedding: string | null
          id: string
          inbox_id: string
          model: string
          source_text: string
          team_id: string
        }
        Insert: {
          created_at?: string
          embedding?: string | null
          id?: string
          inbox_id: string
          model?: string
          source_text: string
          team_id: string
        }
        Update: {
          created_at?: string
          embedding?: string | null
          id?: string
          inbox_id?: string
          model?: string
          source_text?: string
          team_id?: string
        }
        Relationships: []
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
      invoice_products: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string | null
          description: string | null
          fts: unknown
          id: string
          isActive: boolean
          last_used_at: string | null
          name: string
          price: number | null
          tax_rate: number | null
          team_id: string
          unit: string | null
          updated_at: string | null
          usage_count: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          fts?: unknown
          id?: string
          isActive?: boolean
          last_used_at?: string | null
          name: string
          price?: number | null
          tax_rate?: number | null
          team_id: string
          unit?: string | null
          updated_at?: string | null
          usage_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          fts?: unknown
          id?: string
          isActive?: boolean
          last_used_at?: string | null
          name?: string
          price?: number | null
          tax_rate?: number | null
          team_id?: string
          unit?: string | null
          updated_at?: string | null
          usage_count?: number
        }
        Relationships: []
      }
      invoice_recurring: {
        Row: {
          amount: number | null
          bottom_block: Json | null
          consecutive_failures: number
          created_at: string
          currency: string | null
          customer_id: string | null
          customer_name: string | null
          discount: number | null
          due_date_offset: number
          end_count: number | null
          end_date: string | null
          end_type: Database["public"]["Enums"]["invoice_recurring_end_type"]
          frequency: Database["public"]["Enums"]["invoice_recurring_frequency"]
          frequency_day: number | null
          frequency_interval: number | null
          frequency_week: number | null
          from_details: Json | null
          id: string
          invoices_generated: number
          last_generated_at: string | null
          line_items: Json | null
          next_scheduled_at: string | null
          note_details: Json | null
          payment_details: Json | null
          status: Database["public"]["Enums"]["invoice_recurring_status"]
          subtotal: number | null
          tax: number | null
          team_id: string
          template: Json | null
          template_id: string | null
          timezone: string
          top_block: Json | null
          upcoming_notification_sent_at: string | null
          updated_at: string | null
          user_id: string
          vat: number | null
        }
        Insert: {
          amount?: number | null
          bottom_block?: Json | null
          consecutive_failures?: number
          created_at?: string
          currency?: string | null
          customer_id?: string | null
          customer_name?: string | null
          discount?: number | null
          due_date_offset?: number
          end_count?: number | null
          end_date?: string | null
          end_type: Database["public"]["Enums"]["invoice_recurring_end_type"]
          frequency: Database["public"]["Enums"]["invoice_recurring_frequency"]
          frequency_day?: number | null
          frequency_interval?: number | null
          frequency_week?: number | null
          from_details?: Json | null
          id?: string
          invoices_generated?: number
          last_generated_at?: string | null
          line_items?: Json | null
          next_scheduled_at?: string | null
          note_details?: Json | null
          payment_details?: Json | null
          status?: Database["public"]["Enums"]["invoice_recurring_status"]
          subtotal?: number | null
          tax?: number | null
          team_id: string
          template?: Json | null
          template_id?: string | null
          timezone: string
          top_block?: Json | null
          upcoming_notification_sent_at?: string | null
          updated_at?: string | null
          user_id: string
          vat?: number | null
        }
        Update: {
          amount?: number | null
          bottom_block?: Json | null
          consecutive_failures?: number
          created_at?: string
          currency?: string | null
          customer_id?: string | null
          customer_name?: string | null
          discount?: number | null
          due_date_offset?: number
          end_count?: number | null
          end_date?: string | null
          end_type?: Database["public"]["Enums"]["invoice_recurring_end_type"]
          frequency?: Database["public"]["Enums"]["invoice_recurring_frequency"]
          frequency_day?: number | null
          frequency_interval?: number | null
          frequency_week?: number | null
          from_details?: Json | null
          id?: string
          invoices_generated?: number
          last_generated_at?: string | null
          line_items?: Json | null
          next_scheduled_at?: string | null
          note_details?: Json | null
          payment_details?: Json | null
          status?: Database["public"]["Enums"]["invoice_recurring_status"]
          subtotal?: number | null
          tax?: number | null
          team_id?: string
          template?: Json | null
          template_id?: string | null
          timezone?: string
          top_block?: Json | null
          upcoming_notification_sent_at?: string | null
          updated_at?: string | null
          user_id?: string
          vat?: number | null
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
          include_line_item_tax: boolean | null
          include_pdf: boolean | null
          include_qr: boolean | null
          include_tax: boolean | null
          include_units: boolean | null
          include_vat: boolean | null
          invoice_no_label: string | null
          is_default: boolean | null
          issue_date_label: string | null
          line_item_tax_label: string | null
          logo_url: string | null
          name: string
          note_details: Json | null
          note_label: string | null
          payment_details: Json | null
          payment_enabled: boolean | null
          payment_label: string | null
          payment_terms_days: number | null
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
          include_line_item_tax?: boolean | null
          include_pdf?: boolean | null
          include_qr?: boolean | null
          include_tax?: boolean | null
          include_units?: boolean | null
          include_vat?: boolean | null
          invoice_no_label?: string | null
          is_default?: boolean | null
          issue_date_label?: string | null
          line_item_tax_label?: string | null
          logo_url?: string | null
          name?: string
          note_details?: Json | null
          note_label?: string | null
          payment_details?: Json | null
          payment_enabled?: boolean | null
          payment_label?: string | null
          payment_terms_days?: number | null
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
          include_line_item_tax?: boolean | null
          include_pdf?: boolean | null
          include_qr?: boolean | null
          include_tax?: boolean | null
          include_units?: boolean | null
          include_vat?: boolean | null
          invoice_no_label?: string | null
          is_default?: boolean | null
          issue_date_label?: string | null
          line_item_tax_label?: string | null
          logo_url?: string | null
          name?: string
          note_details?: Json | null
          note_label?: string | null
          payment_details?: Json | null
          payment_enabled?: boolean | null
          payment_label?: string | null
          payment_terms_days?: number | null
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
        Relationships: []
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
          fts: unknown
          id: string
          internal_note: string | null
          invoice_number: string | null
          invoice_recurring_id: string | null
          issue_date: string | null
          line_items: Json | null
          note: string | null
          note_details: Json | null
          paid_at: string | null
          payment_details: Json | null
          payment_intent_id: string | null
          recurring_sequence: number | null
          refunded_at: string | null
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
          template_id: string | null
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
          fts?: unknown
          id?: string
          internal_note?: string | null
          invoice_number?: string | null
          invoice_recurring_id?: string | null
          issue_date?: string | null
          line_items?: Json | null
          note?: string | null
          note_details?: Json | null
          paid_at?: string | null
          payment_details?: Json | null
          payment_intent_id?: string | null
          recurring_sequence?: number | null
          refunded_at?: string | null
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
          template_id?: string | null
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
          fts?: unknown
          id?: string
          internal_note?: string | null
          invoice_number?: string | null
          invoice_recurring_id?: string | null
          issue_date?: string | null
          line_items?: Json | null
          note?: string | null
          note_details?: Json | null
          paid_at?: string | null
          payment_details?: Json | null
          payment_intent_id?: string | null
          recurring_sequence?: number | null
          refunded_at?: string | null
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
          template_id?: string | null
          token?: string
          top_block?: Json | null
          updated_at?: string | null
          url?: string | null
          user_id?: string | null
          vat?: number | null
          viewed_at?: string | null
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          channel: string
          created_at: string
          enabled: boolean
          id: string
          notification_type: string
          team_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          enabled?: boolean
          id?: string
          notification_type: string
          team_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          enabled?: boolean
          id?: string
          notification_type?: string
          team_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
        Relationships: []
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
          status: string | null
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
          status?: string | null
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
          status?: string | null
          team_id?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      teams: {
        Row: {
          base_currency: string | null
          canceled_at: string | null
          country_code: string | null
          created_at: string
          document_classification: boolean | null
          email: string | null
          export_settings: Json | null
          fiscal_year_start_month: number | null
          flags: string[] | null
          id: string
          inbox_email: string | null
          inbox_forwarding: boolean | null
          inbox_id: string | null
          logo_url: string | null
          name: string | null
          plan: Database["public"]["Enums"]["plans"]
          stripe_account_id: string | null
          stripe_connect_status: string | null
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
        }
        Insert: {
          base_currency?: string | null
          canceled_at?: string | null
          country_code?: string | null
          created_at?: string
          document_classification?: boolean | null
          email?: string | null
          export_settings?: Json | null
          fiscal_year_start_month?: number | null
          flags?: string[] | null
          id?: string
          inbox_email?: string | null
          inbox_forwarding?: boolean | null
          inbox_id?: string | null
          logo_url?: string | null
          name?: string | null
          plan?: Database["public"]["Enums"]["plans"]
          stripe_account_id?: string | null
          stripe_connect_status?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
        }
        Update: {
          base_currency?: string | null
          canceled_at?: string | null
          country_code?: string | null
          created_at?: string
          document_classification?: boolean | null
          email?: string | null
          export_settings?: Json | null
          fiscal_year_start_month?: number | null
          flags?: string[] | null
          id?: string
          inbox_email?: string | null
          inbox_forwarding?: boolean | null
          inbox_id?: string | null
          logo_url?: string | null
          name?: string | null
          plan?: Database["public"]["Enums"]["plans"]
          stripe_account_id?: string | null
          stripe_connect_status?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
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
        Relationships: []
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
        Relationships: []
      }
      tracker_projects: {
        Row: {
          billable: boolean | null
          created_at: string
          currency: string | null
          customer_id: string | null
          description: string | null
          estimate: number | null
          fts: unknown
          id: string
          name: string
          rate: number | null
          status: Database["public"]["Enums"]["trackerStatus"]
          team_id: string | null
        }
        Insert: {
          billable?: boolean | null
          created_at?: string
          currency?: string | null
          customer_id?: string | null
          description?: string | null
          estimate?: number | null
          fts?: unknown
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
          fts?: unknown
          id?: string
          name?: string
          rate?: number | null
          status?: Database["public"]["Enums"]["trackerStatus"]
          team_id?: string | null
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      transaction_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
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
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          excluded?: boolean | null
          id?: string
          name: string
          parent_id?: string | null
          slug: string
          system?: boolean | null
          tax_rate?: number | null
          tax_reporting_code?: string | null
          tax_type?: string | null
          team_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
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
        }
        Relationships: []
      }
      transaction_category_embeddings: {
        Row: {
          created_at: string
          embedding: string | null
          model: string
          name: string
          system: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          embedding?: string | null
          model?: string
          name: string
          system?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          embedding?: string | null
          model?: string
          name?: string
          system?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      transaction_embeddings: {
        Row: {
          created_at: string
          embedding: string | null
          id: string
          model: string
          source_text: string
          team_id: string
          transaction_id: string
        }
        Insert: {
          created_at?: string
          embedding?: string | null
          id?: string
          model?: string
          source_text: string
          team_id: string
          transaction_id: string
        }
        Update: {
          created_at?: string
          embedding?: string | null
          id?: string
          model?: string
          source_text?: string
          team_id?: string
          transaction_id?: string
        }
        Relationships: []
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
        Relationships: []
      }
      transaction_match_suggestions: {
        Row: {
          amount_score: number | null
          confidence_score: number
          created_at: string
          currency_score: number | null
          date_score: number | null
          embedding_score: number | null
          id: string
          inbox_id: string
          match_details: Json | null
          match_type: string
          name_score: number | null
          status: string
          team_id: string
          transaction_id: string
          updated_at: string
          user_action_at: string | null
          user_id: string | null
        }
        Insert: {
          amount_score?: number | null
          confidence_score: number
          created_at?: string
          currency_score?: number | null
          date_score?: number | null
          embedding_score?: number | null
          id?: string
          inbox_id: string
          match_details?: Json | null
          match_type: string
          name_score?: number | null
          status?: string
          team_id: string
          transaction_id: string
          updated_at?: string
          user_action_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount_score?: number | null
          confidence_score?: number
          created_at?: string
          currency_score?: number | null
          date_score?: number | null
          embedding_score?: number | null
          id?: string
          inbox_id?: string
          match_details?: Json | null
          match_type?: string
          name_score?: number | null
          status?: string
          team_id?: string
          transaction_id?: string
          updated_at?: string
          user_action_at?: string | null
          user_id?: string | null
        }
        Relationships: []
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
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          assigned_id: string | null
          balance: number | null
          bank_account_id: string | null
          base_currency: string | null
          baseAmount: number | null
          category_slug: string | null
          counterparty_name: string | null
          created_at: string
          currency: string
          date: string
          description: string | null
          enrichment_completed: boolean | null
          frequency: Database["public"]["Enums"]["transaction_frequency"] | null
          fts_vector: unknown
          id: string
          internal: boolean | null
          internal_id: string
          manual: boolean | null
          merchant_name: string | null
          method: Database["public"]["Enums"]["transactionMethods"]
          name: string
          note: string | null
          notified: boolean | null
          recurring: boolean | null
          status: Database["public"]["Enums"]["transactionStatus"] | null
          tax_amount: number | null
          tax_rate: number | null
          tax_type: string | null
          team_id: string
        }
        Insert: {
          amount: number
          assigned_id?: string | null
          balance?: number | null
          bank_account_id?: string | null
          base_currency?: string | null
          baseAmount?: number | null
          category_slug?: string | null
          counterparty_name?: string | null
          created_at?: string
          currency: string
          date: string
          description?: string | null
          enrichment_completed?: boolean | null
          frequency?:
            | Database["public"]["Enums"]["transaction_frequency"]
            | null
          fts_vector?: unknown
          id?: string
          internal?: boolean | null
          internal_id: string
          manual?: boolean | null
          merchant_name?: string | null
          method: Database["public"]["Enums"]["transactionMethods"]
          name: string
          note?: string | null
          notified?: boolean | null
          recurring?: boolean | null
          status?: Database["public"]["Enums"]["transactionStatus"] | null
          tax_amount?: number | null
          tax_rate?: number | null
          tax_type?: string | null
          team_id: string
        }
        Update: {
          amount?: number
          assigned_id?: string | null
          balance?: number | null
          bank_account_id?: string | null
          base_currency?: string | null
          baseAmount?: number | null
          category_slug?: string | null
          counterparty_name?: string | null
          created_at?: string
          currency?: string
          date?: string
          description?: string | null
          enrichment_completed?: boolean | null
          frequency?:
            | Database["public"]["Enums"]["transaction_frequency"]
            | null
          fts_vector?: unknown
          id?: string
          internal?: boolean | null
          internal_id?: string
          manual?: boolean | null
          merchant_name?: string | null
          method?: Database["public"]["Enums"]["transactionMethods"]
          name?: string
          note?: string | null
          notified?: boolean | null
          recurring?: boolean | null
          status?: Database["public"]["Enums"]["transactionStatus"] | null
          tax_amount?: number | null
          tax_rate?: number | null
          tax_type?: string | null
          team_id?: string
        }
        Relationships: []
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
        Relationships: []
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
          timezone_auto_sync: boolean | null
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
          timezone_auto_sync?: boolean | null
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
          timezone_auto_sync?: boolean | null
          week_starts_on_monday?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      extract_product_names: { Args: { products_json: Json }; Returns: string }
      generate_id: { Args: { size: number }; Returns: string }
      generate_inbox: { Args: { size: number }; Returns: string }
      generate_inbox_fts: {
        Args: { display_name_text: string; product_names: string }
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
      accounting_provider: "xero" | "quickbooks" | "fortnox"
      accounting_sync_status: "synced" | "failed" | "pending" | "partial"
      accounting_sync_type: "auto" | "manual"
      activity_source: "system" | "user"
      activity_status: "unread" | "read" | "archived"
      activity_type:
        | "transactions_enriched"
        | "transactions_created"
        | "invoice_paid"
        | "inbox_new"
        | "inbox_auto_matched"
        | "inbox_needs_review"
        | "inbox_cross_currency_matched"
        | "invoice_overdue"
        | "invoice_sent"
        | "inbox_match_confirmed"
        | "invoice_refunded"
        | "recurring_series_started"
        | "recurring_series_completed"
        | "recurring_series_paused"
        | "recurring_invoice_upcoming"
        | "document_uploaded"
        | "document_processed"
        | "invoice_duplicated"
        | "invoice_scheduled"
        | "invoice_reminder_sent"
        | "invoice_cancelled"
        | "invoice_created"
        | "draft_invoice_created"
        | "tracker_entry_created"
        | "tracker_project_created"
        | "transactions_categorized"
        | "transactions_assigned"
        | "transaction_attachment_created"
        | "transaction_category_created"
        | "transactions_exported"
        | "customer_created"
      bank_providers: "gocardless" | "plaid" | "teller" | "enablebanking"
      connection_status: "disconnected" | "connected" | "unknown"
      document_processing_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
      inbox_account_providers: "gmail" | "outlook"
      inbox_account_status: "connected" | "disconnected"
      inbox_blocklist_type: "email" | "domain"
      inbox_status:
        | "processing"
        | "pending"
        | "archived"
        | "new"
        | "analyzing"
        | "suggested_match"
        | "no_match"
        | "done"
        | "deleted"
      inbox_type: "invoice" | "expense"
      invoice_delivery_type: "create" | "create_and_send" | "scheduled"
      invoice_recurring_end_type: "never" | "on_date" | "after_count"
      invoice_recurring_frequency:
        | "weekly"
        | "biweekly"
        | "monthly_date"
        | "monthly_weekday"
        | "monthly_last_day"
        | "quarterly"
        | "semi_annual"
        | "annual"
        | "custom"
      invoice_recurring_status: "active" | "paused" | "completed" | "canceled"
      invoice_size: "a4" | "letter"
      invoice_status:
        | "draft"
        | "overdue"
        | "paid"
        | "unpaid"
        | "canceled"
        | "scheduled"
        | "refunded"
      plans: "trial" | "starter" | "pro"
      reportTypes:
        | "profit"
        | "revenue"
        | "burn_rate"
        | "expense"
        | "monthly_revenue"
        | "revenue_forecast"
        | "runway"
        | "category_expenses"
      subscription_status: "active" | "past_due"
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
        | "exported"
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
      account_type: [
        "depository",
        "credit",
        "other_asset",
        "loan",
        "other_liability",
      ],
      accounting_provider: ["xero", "quickbooks", "fortnox"],
      accounting_sync_status: ["synced", "failed", "pending", "partial"],
      accounting_sync_type: ["auto", "manual"],
      activity_source: ["system", "user"],
      activity_status: ["unread", "read", "archived"],
      activity_type: [
        "transactions_enriched",
        "transactions_created",
        "invoice_paid",
        "inbox_new",
        "inbox_auto_matched",
        "inbox_needs_review",
        "inbox_cross_currency_matched",
        "invoice_overdue",
        "invoice_sent",
        "inbox_match_confirmed",
        "invoice_refunded",
        "recurring_series_started",
        "recurring_series_completed",
        "recurring_series_paused",
        "recurring_invoice_upcoming",
        "document_uploaded",
        "document_processed",
        "invoice_duplicated",
        "invoice_scheduled",
        "invoice_reminder_sent",
        "invoice_cancelled",
        "invoice_created",
        "draft_invoice_created",
        "tracker_entry_created",
        "tracker_project_created",
        "transactions_categorized",
        "transactions_assigned",
        "transaction_attachment_created",
        "transaction_category_created",
        "transactions_exported",
        "customer_created",
      ],
      bank_providers: ["gocardless", "plaid", "teller", "enablebanking"],
      connection_status: ["disconnected", "connected", "unknown"],
      document_processing_status: [
        "pending",
        "processing",
        "completed",
        "failed",
      ],
      inbox_account_providers: ["gmail", "outlook"],
      inbox_account_status: ["connected", "disconnected"],
      inbox_blocklist_type: ["email", "domain"],
      inbox_status: [
        "processing",
        "pending",
        "archived",
        "new",
        "analyzing",
        "suggested_match",
        "no_match",
        "done",
        "deleted",
      ],
      inbox_type: ["invoice", "expense"],
      invoice_delivery_type: ["create", "create_and_send", "scheduled"],
      invoice_recurring_end_type: ["never", "on_date", "after_count"],
      invoice_recurring_frequency: [
        "weekly",
        "biweekly",
        "monthly_date",
        "monthly_weekday",
        "monthly_last_day",
        "quarterly",
        "semi_annual",
        "annual",
        "custom",
      ],
      invoice_recurring_status: ["active", "paused", "completed", "canceled"],
      invoice_size: ["a4", "letter"],
      invoice_status: [
        "draft",
        "overdue",
        "paid",
        "unpaid",
        "canceled",
        "scheduled",
        "refunded",
      ],
      plans: ["trial", "starter", "pro"],
      reportTypes: [
        "profit",
        "revenue",
        "burn_rate",
        "expense",
        "monthly_revenue",
        "revenue_forecast",
        "runway",
        "category_expenses",
      ],
      subscription_status: ["active", "past_due"],
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
        "exported",
      ],
    },
  },
} as const
