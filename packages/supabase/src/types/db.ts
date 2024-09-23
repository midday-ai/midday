export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bank_accounts: {
        Row: {
          account_id: string
          balance: number | null
          bank_connection_id: string | null
          base_balance: number | null
          base_currency: string | null
          created_at: string
          created_by: string
          currency: string | null
          enabled: boolean
          id: string
          manual: boolean | null
          name: string | null
          team_id: string
          type: Database["public"]["Enums"]["account_type"] | null
        }
        Insert: {
          account_id: string
          balance?: number | null
          bank_connection_id?: string | null
          base_balance?: number | null
          base_currency?: string | null
          created_at?: string
          created_by: string
          currency?: string | null
          enabled?: boolean
          id?: string
          manual?: boolean | null
          name?: string | null
          team_id: string
          type?: Database["public"]["Enums"]["account_type"] | null
        }
        Update: {
          account_id?: string
          balance?: number | null
          bank_connection_id?: string | null
          base_balance?: number | null
          base_currency?: string | null
          created_at?: string
          created_by?: string
          currency?: string | null
          enabled?: boolean
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
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          id: string
          stripe_customer_id: string | null
        }
        Insert: {
          id: string
          stripe_customer_id?: string | null
        }
        Update: {
          id?: string
          stripe_customer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          body: string | null
          created_at: string | null
          fts: unknown | null
          id: string
          metadata: Json | null
          name: string | null
          object_id: string | null
          owner_id: string | null
          parent_id: string | null
          path_tokens: string[] | null
          tag: string | null
          team_id: string | null
          title: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          fts?: unknown | null
          id?: string
          metadata?: Json | null
          name?: string | null
          object_id?: string | null
          owner_id?: string | null
          parent_id?: string | null
          path_tokens?: string[] | null
          tag?: string | null
          team_id?: string | null
          title?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string | null
          fts?: unknown | null
          id?: string
          metadata?: Json | null
          name?: string | null
          object_id?: string | null
          owner_id?: string | null
          parent_id?: string | null
          path_tokens?: string[] | null
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
      prices: {
        Row: {
          active: boolean | null
          currency: string | null
          description: string | null
          id: string
          interval: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count: number | null
          metadata: Json | null
          product_id: string | null
          trial_period_days: number | null
          type: Database["public"]["Enums"]["pricing_type"] | null
          unit_amount: number | null
        }
        Insert: {
          active?: boolean | null
          currency?: string | null
          description?: string | null
          id: string
          interval?: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count?: number | null
          metadata?: Json | null
          product_id?: string | null
          trial_period_days?: number | null
          type?: Database["public"]["Enums"]["pricing_type"] | null
          unit_amount?: number | null
        }
        Update: {
          active?: boolean | null
          currency?: string | null
          description?: string | null
          id?: string
          interval?: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count?: number | null
          metadata?: Json | null
          product_id?: string | null
          trial_period_days?: number | null
          type?: Database["public"]["Enums"]["pricing_type"] | null
          unit_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          description: string | null
          id: string
          image: string | null
          metadata: Json | null
          name: string | null
        }
        Insert: {
          active?: boolean | null
          description?: string | null
          id: string
          image?: string | null
          metadata?: Json | null
          name?: string | null
        }
        Update: {
          active?: boolean | null
          description?: string | null
          id?: string
          image?: string | null
          metadata?: Json | null
          name?: string | null
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
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at: string | null
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created: string
          current_period_end: string
          current_period_start: string
          ended_at: string | null
          id: string
          metadata: Json | null
          price_id: string | null
          quantity: number | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          trial_end: string | null
          trial_start: string | null
          user_id: string
        }
        Insert: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created?: string
          current_period_end?: string
          current_period_start?: string
          ended_at?: string | null
          id: string
          metadata?: Json | null
          price_id?: string | null
          quantity?: number | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          trial_end?: string | null
          trial_start?: string | null
          user_id: string
        }
        Update: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created?: string
          current_period_end?: string
          current_period_start?: string
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          price_id?: string | null
          quantity?: number | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          trial_end?: string | null
          trial_start?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          base_currency: string | null
          created_at: string
          document_classification: boolean | null
          email: string | null
          id: string
          inbox_email: string | null
          inbox_forwarding: boolean | null
          inbox_id: string | null
          logo_url: string | null
          name: string | null
        }
        Insert: {
          base_currency?: string | null
          created_at?: string
          document_classification?: boolean | null
          email?: string | null
          id?: string
          inbox_email?: string | null
          inbox_forwarding?: boolean | null
          inbox_id?: string | null
          logo_url?: string | null
          name?: string | null
        }
        Update: {
          base_currency?: string | null
          created_at?: string
          document_classification?: boolean | null
          email?: string | null
          id?: string
          inbox_email?: string | null
          inbox_forwarding?: boolean | null
          inbox_id?: string | null
          logo_url?: string | null
          name?: string | null
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
          description: string | null
          estimate: number | null
          id: string
          name: string
          rate: number | null
          status: Database["public"]["Enums"]["trackerStatus"]
          team_id: string | null
          project_members: Record<string, unknown> | null
          total_duration: number | null
        }
        Insert: {
          billable?: boolean | null
          created_at?: string
          currency?: string | null
          description?: string | null
          estimate?: number | null
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
          description?: string | null
          estimate?: number | null
          id?: string
          name?: string
          rate?: number | null
          status?: Database["public"]["Enums"]["trackerStatus"]
          team_id?: string | null
        }
        Relationships: [
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
          id: string
          name: string
          slug: string
          system: boolean | null
          team_id: string
          vat: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          embedding?: string | null
          id?: string
          name: string
          slug: string
          system?: boolean | null
          team_id?: string
          vat?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          embedding?: string | null
          id?: string
          name?: string
          slug?: string
          system?: boolean | null
          team_id?: string
          vat?: number | null
        }
        Relationships: [
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
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string
          account_owner: string | null
          amount: number
          assigned_id: string | null
          authorized_date: string | null
          authorized_datetime: string | null
          balance: number | null
          bank_account_id: string | null
          base_amount: number | null
          base_currency: string | null
          category: Database["public"]["Enums"]["transactionCategories"] | null
          category_id: string | null
          category_slug: string | null
          check_number: string | null
          created_at: string
          currency: string
          currency_rate: number | null
          currency_source: string | null
          date: string
          datetime: string | null
          description: string | null
          frequency: Database["public"]["Enums"]["transaction_frequency"] | null
          fts_vector: unknown | null
          id: string
          inserted_at: string | null
          internal_id: string
          iso_currency_code: string | null
          location_address: string | null
          location_city: string | null
          location_country: string | null
          location_lat: number | null
          location_lon: number | null
          location_postal_code: string | null
          location_region: string | null
          location_store_number: string | null
          logo_url: string | null
          manual: boolean | null
          merchant_entity_id: string | null
          merchant_name: string | null
          method: Database["public"]["Enums"]["transactionMethods"]
          name: string
          note: string | null
          payment_channel: string | null
          payment_meta_by_order_of: string | null
          payment_meta_payee: string | null
          payment_meta_payer: string | null
          payment_meta_payment_method: string | null
          payment_meta_payment_processor: string | null
          payment_meta_ppd_id: string | null
          payment_meta_reason: string | null
          payment_meta_reference_number: string | null
          pending: boolean | null
          pending_transaction_id: string | null
          personal_finance_category_confidence_level: string | null
          personal_finance_category_detailed: string | null
          personal_finance_category_icon_url: string | null
          personal_finance_category_primary: string | null
          recurring: boolean | null
          status: Database["public"]["Enums"]["transactionStatus"] | null
          team_id: string
          transaction_code: string | null
          transaction_id: string | null
          transaction_type: string | null
          unofficial_currency_code: string | null
          updated_at: string | null
          website: string | null
          amount_text: string | null
          calculated_vat: number | null
          is_fulfilled: boolean | null
        }
        Insert: {
          account_id: string
          account_owner?: string | null
          amount: number
          assigned_id?: string | null
          authorized_date?: string | null
          authorized_datetime?: string | null
          balance?: number | null
          bank_account_id?: string | null
          base_amount?: number | null
          base_currency?: string | null
          category?: Database["public"]["Enums"]["transactionCategories"] | null
          category_id?: string | null
          category_slug?: string | null
          check_number?: string | null
          created_at?: string
          currency: string
          currency_rate?: number | null
          currency_source?: string | null
          date: string
          datetime?: string | null
          description?: string | null
          frequency?:
            | Database["public"]["Enums"]["transaction_frequency"]
            | null
          fts_vector?: unknown | null
          id?: string
          inserted_at?: string | null
          internal_id: string
          iso_currency_code?: string | null
          location_address?: string | null
          location_city?: string | null
          location_country?: string | null
          location_lat?: number | null
          location_lon?: number | null
          location_postal_code?: string | null
          location_region?: string | null
          location_store_number?: string | null
          logo_url?: string | null
          manual?: boolean | null
          merchant_entity_id?: string | null
          merchant_name?: string | null
          method: Database["public"]["Enums"]["transactionMethods"]
          name: string
          note?: string | null
          payment_channel?: string | null
          payment_meta_by_order_of?: string | null
          payment_meta_payee?: string | null
          payment_meta_payer?: string | null
          payment_meta_payment_method?: string | null
          payment_meta_payment_processor?: string | null
          payment_meta_ppd_id?: string | null
          payment_meta_reason?: string | null
          payment_meta_reference_number?: string | null
          pending?: boolean | null
          pending_transaction_id?: string | null
          personal_finance_category_confidence_level?: string | null
          personal_finance_category_detailed?: string | null
          personal_finance_category_icon_url?: string | null
          personal_finance_category_primary?: string | null
          recurring?: boolean | null
          status?: Database["public"]["Enums"]["transactionStatus"] | null
          team_id: string
          transaction_code?: string | null
          transaction_id?: string | null
          transaction_type?: string | null
          unofficial_currency_code?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          account_id?: string
          account_owner?: string | null
          amount?: number
          assigned_id?: string | null
          authorized_date?: string | null
          authorized_datetime?: string | null
          balance?: number | null
          bank_account_id?: string | null
          base_amount?: number | null
          base_currency?: string | null
          category?: Database["public"]["Enums"]["transactionCategories"] | null
          category_id?: string | null
          category_slug?: string | null
          check_number?: string | null
          created_at?: string
          currency?: string
          currency_rate?: number | null
          currency_source?: string | null
          date?: string
          datetime?: string | null
          description?: string | null
          frequency?:
            | Database["public"]["Enums"]["transaction_frequency"]
            | null
          fts_vector?: unknown | null
          id?: string
          inserted_at?: string | null
          internal_id?: string
          iso_currency_code?: string | null
          location_address?: string | null
          location_city?: string | null
          location_country?: string | null
          location_lat?: number | null
          location_lon?: number | null
          location_postal_code?: string | null
          location_region?: string | null
          location_store_number?: string | null
          logo_url?: string | null
          manual?: boolean | null
          merchant_entity_id?: string | null
          merchant_name?: string | null
          method?: Database["public"]["Enums"]["transactionMethods"]
          name?: string
          note?: string | null
          payment_channel?: string | null
          payment_meta_by_order_of?: string | null
          payment_meta_payee?: string | null
          payment_meta_payer?: string | null
          payment_meta_payment_method?: string | null
          payment_meta_payment_processor?: string | null
          payment_meta_ppd_id?: string | null
          payment_meta_reason?: string | null
          payment_meta_reference_number?: string | null
          pending?: boolean | null
          pending_transaction_id?: string | null
          personal_finance_category_confidence_level?: string | null
          personal_finance_category_detailed?: string | null
          personal_finance_category_icon_url?: string | null
          personal_finance_category_primary?: string | null
          recurring?: boolean | null
          status?: Database["public"]["Enums"]["transactionStatus"] | null
          team_id?: string
          transaction_code?: string | null
          transaction_id?: string | null
          transaction_type?: string | null
          unofficial_currency_code?: string | null
          updated_at?: string | null
          website?: string | null
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
          billing_address: Json | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          locale: string | null
          payment_method: Json | null
          team_id: string | null
          tier: Database["public"]["Enums"]["user_tier"]
          timezone: string | null
          week_starts_on_monday: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          billing_address?: Json | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          locale?: string | null
          payment_method?: Json | null
          team_id?: string | null
          tier?: Database["public"]["Enums"]["user_tier"]
          timezone?: string | null
          week_starts_on_monday?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          billing_address?: Json | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          locale?: string | null
          payment_method?: Json | null
          team_id?: string | null
          tier?: Database["public"]["Enums"]["user_tier"]
          timezone?: string | null
          week_starts_on_monday?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
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
      [_ in never]: never
    }
    Functions: {
      amount_text: {
        Args: {
          "": unknown
        }
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
        Args: {
          t_date: string
          i_date: string
        }
        Returns: number
      }
      calculate_date_similarity: {
        Args: {
          transaction_date: string
          inbox_date: string
        }
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
        Args: {
          transaction_name: string
          inbox_name: string
        }
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
        Args: {
          target_currency: string
        }
        Returns: number
      }
      calculate_transaction_differences_v2: {
        Args: {
          p_team_id: string
        }
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
        Args: {
          "": unknown
        }
        Returns: number
      }
      classify_frequency_v2: {
        Args: {
          p_team_id: string
        }
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
        Args: {
          name: string
        }
        Returns: string
      }
      determine_transaction_frequency:
        | {
            Args: {
              p_avg_days_between: number
              p_transaction_count: number
            }
            Returns: string
          }
        | {
            Args: {
              p_avg_days_between: number
              p_transaction_count: number
              p_is_recurring: boolean
              p_latest_frequency: string
            }
            Returns: string
          }
      extract_product_names: {
        Args: {
          products_json: Json
        }
        Returns: string
      }
      find_matching_inbox_item: {
        Args: {
          input_transaction_id: string
          specific_inbox_id?: string
        }
        Returns: {
          inbox_id: string
          transaction_id: string
          transaction_name: string
          similarity_score: number
          file_name: string
        }[]
      }
      generate_hmac: {
        Args: {
          secret_key: string
          message: string
        }
        Returns: string
      }
      generate_id: {
        Args: {
          size: number
        }
        Returns: string
      }
      generate_inbox: {
        Args: {
          size: number
        }
        Returns: string
      }
      generate_inbox_fts:
        | {
            Args: {
              display_name: string
              products_json: Json
            }
            Returns: unknown
          }
        | {
            Args: {
              display_name_text: string
              product_names: string
            }
            Returns: unknown
          }
        | {
            Args: {
              display_name_text: string
              product_names: string
              amount: number
              due_date: string
            }
            Returns: unknown
          }
      get_all_transactions_by_account: {
        Args: {
          account_id: string
        }
        Returns: {
          account_id: string
          account_owner: string | null
          amount: number
          assigned_id: string | null
          authorized_date: string | null
          authorized_datetime: string | null
          balance: number | null
          bank_account_id: string | null
          base_amount: number | null
          base_currency: string | null
          category: Database["public"]["Enums"]["transactionCategories"] | null
          category_id: string | null
          category_slug: string | null
          check_number: string | null
          created_at: string
          currency: string
          currency_rate: number | null
          currency_source: string | null
          date: string
          datetime: string | null
          description: string | null
          frequency: Database["public"]["Enums"]["transaction_frequency"] | null
          fts_vector: unknown | null
          id: string
          inserted_at: string | null
          internal_id: string
          iso_currency_code: string | null
          location_address: string | null
          location_city: string | null
          location_country: string | null
          location_lat: number | null
          location_lon: number | null
          location_postal_code: string | null
          location_region: string | null
          location_store_number: string | null
          logo_url: string | null
          manual: boolean | null
          merchant_entity_id: string | null
          merchant_name: string | null
          method: Database["public"]["Enums"]["transactionMethods"]
          name: string
          note: string | null
          payment_channel: string | null
          payment_meta_by_order_of: string | null
          payment_meta_payee: string | null
          payment_meta_payer: string | null
          payment_meta_payment_method: string | null
          payment_meta_payment_processor: string | null
          payment_meta_ppd_id: string | null
          payment_meta_reason: string | null
          payment_meta_reference_number: string | null
          pending: boolean | null
          pending_transaction_id: string | null
          personal_finance_category_confidence_level: string | null
          personal_finance_category_detailed: string | null
          personal_finance_category_icon_url: string | null
          personal_finance_category_primary: string | null
          recurring: boolean | null
          status: Database["public"]["Enums"]["transactionStatus"] | null
          team_id: string
          transaction_code: string | null
          transaction_id: string | null
          transaction_type: string | null
          unofficial_currency_code: string | null
          updated_at: string | null
          website: string | null
        }[]
      }
      get_bank_account_currencies: {
        Args: {
          team_id: string
        }
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
      get_current_burn_rate: {
        Args: {
          team_id: string
          currency: string
        }
        Returns: number
      }
      get_current_burn_rate_v2: {
        Args: {
          team_id: string
          base_currency?: string
        }
        Returns: {
          currency: string
          value: number
        }[]
      }
      get_current_burn_rate_v3: {
        Args: {
          team_id: string
          base_currency?: string
        }
        Returns: {
          currency: string
          value: number
        }[]
      }
      get_current_user_team_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_daily_expenses: {
        Args: {
          team_id: string
          start_date: string
          end_date: string
          currency: string
        }
        Returns: {
          date: string
          total_expense: number
        }[]
      }
      get_equipment_and_maintenance_analysis: {
        Args: {
          team_id: string
          start_date: string
          end_date: string
          currency: string
        }
        Returns: {
          expense_type: string
          total_expense: number
          transaction_count: number
          avg_expense_per_transaction: number
        }[]
      }
      get_expense_anomalies: {
        Args: {
          team_id: string
          start_date: string
          end_date: string
          currency: string
          threshold_percentage?: number
        }
        Returns: {
          transaction_date: string
          merchant_name: string
          category_name: string
          amount: number
          avg_amount: number
          percentage_difference: number
        }[]
      }
      get_expense_breakdown_by_location: {
        Args: {
          team_id: string
          start_date: string
          end_date: string
          currency: string
        }
        Returns: {
          location_city: string
          location_region: string
          location_country: string
          total_expense: number
          transaction_count: number
        }[]
      }
      get_expense_by_personal_finance_category: {
        Args: {
          team_id: string
          start_date: string
          end_date: string
          currency: string
        }
        Returns: {
          primary_category: string
          detailed_category: string
          total_expense: number
          transaction_count: number
        }[]
      }
      get_expense_comparison: {
        Args: {
          team_id: string
          current_start_date: string
          current_end_date: string
          currency: string
        }
        Returns: {
          category_name: string
          current_period_expense: number
          previous_period_expense: number
          expense_difference: number
          percentage_change: number
        }[]
      }
      get_expense_distribution_by_day_of_week: {
        Args: {
          team_id: string
          start_date: string
          end_date: string
          currency: string
        }
        Returns: {
          day_of_week: number
          day_name: string
          total_expense: number
          transaction_count: number
        }[]
      }
      get_expense_forecast: {
        Args: {
          team_id: string
          forecast_date: string
          currency: string
          lookback_months?: number
        }
        Returns: {
          forecasted_date: string
          forecasted_expense: number
        }[]
      }
      get_expense_growth_rate: {
        Args: {
          team_id: string
          start_date: string
          end_date: string
          currency: string
          interval_type?: string
        }
        Returns: {
          period: string
          total_expense: number
          growth_rate: number
        }[]
      }
      get_expense_trends_by_time_of_day: {
        Args: {
          team_id: string
          start_date: string
          end_date: string
          currency: string
        }
        Returns: {
          hour_of_day: number
          total_expense: number
          transaction_count: number
        }[]
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
      get_expenses_by_category: {
        Args: {
          team_id: string
          start_date: string
          end_date: string
          currency: string
        }
        Returns: {
          category_name: string
          category_slug: string
          total_expense: number
        }[]
      }
      get_expenses_by_merchant: {
        Args: {
          team_id: string
          start_date: string
          end_date: string
          currency: string
          limit_count?: number
        }
        Returns: {
          merchant_name: string
          total_expense: number
          transaction_count: number
        }[]
      }
      get_expenses_by_payment_channel: {
        Args: {
          team_id: string
          start_date: string
          end_date: string
          currency: string
        }
        Returns: {
          payment_channel: string
          total_expense: number
          transaction_count: number
        }[]
      }
      get_inventory_cost_analysis: {
        Args: {
          team_id: string
          start_date: string
          end_date: string
          currency: string
        }
        Returns: {
          month: string
          total_expense: number
        }[]
      }
      get_monthly_expenses: {
        Args: {
          team_id: string
          start_date: string
          end_date: string
          currency: string
        }
        Returns: {
          month: string
          total_expense: number
        }[]
      }
      get_professional_services_analysis: {
        Args: {
          team_id: string
          start_date: string
          end_date: string
          currency: string
        }
        Returns: {
          service_type: string
          total_expense: number
          transaction_count: number
          avg_expense_per_transaction: number
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
      get_recurring_expenses: {
        Args: {
          team_id: string
          start_date: string
          end_date: string
          currency: string
          min_occurrences?: number
        }
        Returns: {
          merchant_name: string
          category_name: string
          avg_amount: number
          occurrence_count: number
        }[]
      }
      get_rent_and_utilities_analysis: {
        Args: {
          team_id: string
          start_date: string
          end_date: string
          currency: string
        }
        Returns: {
          expense_type: string
          total_expense: number
          average_monthly_expense: number
          trend_percentage: number
        }[]
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
      get_salaries_and_wages_analysis: {
        Args: {
          team_id: string
          start_date: string
          end_date: string
          currency: string
        }
        Returns: {
          expense_type: string
          total_expense: number
          average_monthly_expense: number
          employee_count: number
          avg_expense_per_employee: number
        }[]
      }
      get_shipping_logistics_analysis: {
        Args: {
          team_id: string
          start_date: string
          end_date: string
          currency: string
        }
        Returns: {
          expense_type: string
          total_expense: number
          transaction_count: number
          avg_expense_per_transaction: number
          percentage_of_total: number
        }[]
      }
      get_software_subscription_analysis: {
        Args: {
          team_id: string
          start_date: string
          end_date: string
          currency: string
        }
        Returns: {
          software_name: string
          total_expense: number
          subscription_count: number
          avg_monthly_cost: number
        }[]
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
      get_supplier_expense_analysis: {
        Args: {
          team_id: string
          start_date: string
          end_date: string
          currency: string
        }
        Returns: {
          supplier_name: string
          total_expense: number
          transaction_count: number
          avg_expense_per_transaction: number
          last_transaction_date: string
        }[]
      }
      get_top_expense_categories: {
        Args: {
          team_id: string
          start_date: string
          end_date: string
          currency: string
          limit_count?: number
        }
        Returns: {
          category_name: string
          category_slug: string
          total_expense: number
        }[]
      }
      get_total_balance: {
        Args: {
          team_id: string
          currency: string
        }
        Returns: number
      }
      get_total_balance_v2: {
        Args: {
          team_id: string
          currency: string
        }
        Returns: number
      }
      get_total_balance_v3: {
        Args: {
          team_id: string
          currency: string
        }
        Returns: number
      }
      get_weekly_expense_trends: {
        Args: {
          team_id: string
          start_date: string
          end_date: string
          currency: string
        }
        Returns: {
          week: string
          total_expense: number
          avg_daily_expense: number
        }[]
      }
      group_transactions_v2: {
        Args: {
          p_team_id: string
        }
        Returns: {
          transaction_group: string
          date: string
          team_id: string
          recurring: boolean
          frequency: Database["public"]["Enums"]["transaction_frequency"]
        }[]
      }
      gtrgm_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_in: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_options: {
        Args: {
          "": unknown
        }
        Returns: undefined
      }
      gtrgm_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      identify_similar_transactions_v2: {
        Args: {
          p_team_id: string
        }
        Returns: {
          original_transaction_name: string
          similar_transaction_name: string
          team_id: string
        }[]
      }
      identify_transaction_group: {
        Args: {
          p_name: string
          p_team_id: string
        }
        Returns: string
      }
      inbox_amount_text: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      is_fulfilled: {
        Args: {
          "": unknown
        }
        Returns: boolean
      }
      match_transaction_with_inbox: {
        Args: {
          p_transaction_id: string
          p_inbox_id?: string
        }
        Returns: {
          inbox_id: string
          transaction_id: string
          transaction_name: string
          score: number
          file_name: string
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
        Args: {
          size: number
          alphabet: string
          mask: number
          step: number
        }
        Returns: string
      }
      project_members:
        | {
            Args: {
              "": unknown
            }
            Returns: {
              id: string
              avatar_url: string
              full_name: string
            }[]
          }
        | {
            Args: {
              "": unknown
            }
            Returns: {
              id: string
              avatar_url: string
              full_name: string
            }[]
          }
      set_limit: {
        Args: {
          "": number
        }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: {
          "": string
        }
        Returns: string[]
      }
      slugify: {
        Args: {
          value: string
        }
        Returns: string
      }
      total_duration: {
        Args: {
          "": unknown
        }
        Returns: number
      }
      unaccent: {
        Args: {
          "": string
        }
        Returns: string
      }
      unaccent_init: {
        Args: {
          "": unknown
        }
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
      bank_providers: "gocardless" | "plaid" | "teller"
      bankProviders: "gocardless" | "plaid" | "teller"
      connection_status: "disconnected" | "connected" | "unknown"
      inbox_status: "processing" | "pending" | "archived" | "new" | "deleted"
      inbox_type: "invoice" | "expense"
      pricing_plan_interval: "day" | "week" | "month" | "year"
      pricing_type: "one_time" | "recurring"
      reportTypes: "profit" | "revenue" | "burn_rate" | "expense"
      subscription_status:
        | "trialing"
        | "active"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "past_due"
        | "unpaid"
        | "paused"
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
      transactionStatus: "posted" | "pending" | "excluded" | "completed"
      user_tier: "free" | "pro" | "enterprise"
    }
    CompositeTypes: {
      metrics_record: {
        date: string | null
        value: number | null
      }
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: {
          bucketid: string
          name: string
          owner: string
          metadata: Json
        }
        Returns: undefined
      }
      extension: {
        Args: {
          name: string
        }
        Returns: string
      }
      filename: {
        Args: {
          name: string
        }
        Returns: string
      }
      foldername: {
        Args: {
          name: string
        }
        Returns: string[]
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: {
          size: number
          bucket_id: string
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          prefix_param: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
        }
        Returns: {
          key: string
          id: string
          created_at: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          bucket_id: string
          prefix_param: string
          delimiter_param: string
          max_keys?: number
          start_after?: string
          next_token?: string
        }
        Returns: {
          name: string
          id: string
          metadata: Json
          updated_at: string
        }[]
      }
      operation: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      search: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  vault: {
    Tables: {
      secrets: {
        Row: {
          created_at: string
          description: string
          id: string
          key_id: string | null
          name: string | null
          nonce: string | null
          secret: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          key_id?: string | null
          name?: string | null
          nonce?: string | null
          secret: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          key_id?: string | null
          name?: string | null
          nonce?: string | null
          secret?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "secrets_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "decrypted_key"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "secrets_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "secrets_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "valid_key"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      decrypted_secrets: {
        Row: {
          created_at: string | null
          decrypted_secret: string | null
          description: string | null
          id: string | null
          key_id: string | null
          name: string | null
          nonce: string | null
          secret: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          decrypted_secret?: never
          description?: string | null
          id?: string | null
          key_id?: string | null
          name?: string | null
          nonce?: string | null
          secret?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          decrypted_secret?: never
          description?: string | null
          id?: string | null
          key_id?: string | null
          name?: string | null
          nonce?: string | null
          secret?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "secrets_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "secrets_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "decrypted_key"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "secrets_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "valid_key"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_secret: {
        Args: {
          new_secret: string
          new_name?: string
          new_description?: string
          new_key_id?: string
        }
        Returns: string
      }
      update_secret: {
        Args: {
          secret_id: string
          new_secret?: string
          new_name?: string
          new_description?: string
          new_key_id?: string
        }
        Returns: undefined
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
