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
          bank_connection_id: string | null
          created_at: string
          created_by: string
          currency: string
          enabled: boolean
          id: string
          last_accessed: string | null
          name: string | null
          team_id: string
        }
        Insert: {
          account_id: string
          bank_connection_id?: string | null
          created_at?: string
          created_by: string
          currency: string
          enabled?: boolean
          id?: string
          last_accessed?: string | null
          name?: string | null
          team_id: string
        }
        Update: {
          account_id?: string
          bank_connection_id?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          enabled?: boolean
          id?: string
          last_accessed?: string | null
          name?: string | null
          team_id?: string
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
            foreignKeyName: "bank_accounts_bank_connection_id_fkey"
            columns: ["bank_connection_id"]
            isOneToOne: false
            referencedRelation: "decrypted_bank_connections"
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
          expires_at: string | null
          id: string
          institution_id: string
          logo_url: string | null
          name: string
          provider: Database["public"]["Enums"]["bank_providers"] | null
          team_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          enrollment_id?: string | null
          expires_at?: string | null
          id?: string
          institution_id: string
          logo_url?: string | null
          name: string
          provider?: Database["public"]["Enums"]["bank_providers"] | null
          team_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          enrollment_id?: string | null
          expires_at?: string | null
          id?: string
          institution_id?: string
          logo_url?: string | null
          name?: string
          provider?: Database["public"]["Enums"]["bank_providers"] | null
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
      inbox: {
        Row: {
          amount: number | null
          archived: boolean | null
          attachment_id: string | null
          content_type: string | null
          created_at: string
          currency: string | null
          due_date: string | null
          email: string | null
          file_name: string | null
          file_path: string[] | null
          forwarded_to: string | null
          id: string
          issuer_name: string | null
          name: string | null
          read: boolean | null
          size: number | null
          subject: string | null
          team_id: string | null
          transaction_id: string | null
          trash: boolean | null
        }
        Insert: {
          amount?: number | null
          archived?: boolean | null
          attachment_id?: string | null
          content_type?: string | null
          created_at?: string
          currency?: string | null
          due_date?: string | null
          email?: string | null
          file_name?: string | null
          file_path?: string[] | null
          forwarded_to?: string | null
          id?: string
          issuer_name?: string | null
          name?: string | null
          read?: boolean | null
          size?: number | null
          subject?: string | null
          team_id?: string | null
          transaction_id?: string | null
          trash?: boolean | null
        }
        Update: {
          amount?: number | null
          archived?: boolean | null
          attachment_id?: string | null
          content_type?: string | null
          created_at?: string
          currency?: string | null
          due_date?: string | null
          email?: string | null
          file_name?: string | null
          file_path?: string[] | null
          forwarded_to?: string | null
          id?: string
          issuer_name?: string | null
          name?: string | null
          read?: boolean | null
          size?: number | null
          subject?: string | null
          team_id?: string | null
          transaction_id?: string | null
          trash?: boolean | null
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
            referencedRelation: "decrypted_transactions"
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
      reports: {
        Row: {
          created_at: string
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
            foreignKeyName: "reports_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          email: string | null
          id: string
          inbox_email: string | null
          inbox_id: string | null
          logo_url: string | null
          name: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          inbox_email?: string | null
          inbox_id?: string | null
          logo_url?: string | null
          name?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          inbox_email?: string | null
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
          id: string
          link_id: string | null
          project_id: string | null
          short_link: string | null
          team_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          link_id?: string | null
          project_id?: string | null
          short_link?: string | null
          team_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          link_id?: string | null
          project_id?: string | null
          short_link?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_tracker_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tracker_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_tracker_reports_team_id_fkey"
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
            referencedRelation: "decrypted_transactions"
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
      transaction_enrichments: {
        Row: {
          category: Database["public"]["Enums"]["transactionCategories"] | null
          created_at: string
          created_by: string | null
          id: string
          name: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["transactionCategories"] | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["transactionCategories"] | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_enrichments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
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
          category: Database["public"]["Enums"]["transactionCategories"] | null
          created_at: string
          currency: string
          currency_rate: number | null
          currency_source: string | null
          date: string
          description: string | null
          id: string
          internal_id: string
          manual: boolean | null
          method: Database["public"]["Enums"]["transactionMethods"]
          name: string
          note: string | null
          order: number
          status: Database["public"]["Enums"]["transactionStatus"] | null
          team_id: string
        }
        Insert: {
          amount: number
          assigned_id?: string | null
          balance?: number | null
          bank_account_id?: string | null
          category?: Database["public"]["Enums"]["transactionCategories"] | null
          created_at?: string
          currency: string
          currency_rate?: number | null
          currency_source?: string | null
          date: string
          description?: string | null
          id?: string
          internal_id: string
          manual?: boolean | null
          method: Database["public"]["Enums"]["transactionMethods"]
          name: string
          note?: string | null
          order?: number
          status?: Database["public"]["Enums"]["transactionStatus"] | null
          team_id: string
        }
        Update: {
          amount?: number
          assigned_id?: string | null
          balance?: number | null
          bank_account_id?: string | null
          category?: Database["public"]["Enums"]["transactionCategories"] | null
          created_at?: string
          currency?: string
          currency_rate?: number | null
          currency_source?: string | null
          date?: string
          description?: string | null
          id?: string
          internal_id?: string
          manual?: boolean | null
          method?: Database["public"]["Enums"]["transactionMethods"]
          name?: string
          note?: string | null
          order?: number
          status?: Database["public"]["Enums"]["transactionStatus"] | null
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
            foreignKeyName: "public_transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "decrypted_bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_transactions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
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
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          locale: string | null
          team_id: string | null
          week_starts_on_monday: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          locale?: string | null
          team_id?: string | null
          week_starts_on_monday?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          locale?: string | null
          team_id?: string | null
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
      decrypted_bank_accounts: {
        Row: {
          account_id: string | null
          bank_connection_id: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          decrypted_name: string | null
          enabled: boolean | null
          id: string | null
          last_accessed: string | null
          name: string | null
          team_id: string | null
        }
        Insert: {
          account_id?: string | null
          bank_connection_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          decrypted_name?: never
          enabled?: boolean | null
          id?: string | null
          last_accessed?: string | null
          name?: string | null
          team_id?: string | null
        }
        Update: {
          account_id?: string | null
          bank_connection_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          decrypted_name?: never
          enabled?: boolean | null
          id?: string | null
          last_accessed?: string | null
          name?: string | null
          team_id?: string | null
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
            foreignKeyName: "bank_accounts_bank_connection_id_fkey"
            columns: ["bank_connection_id"]
            isOneToOne: false
            referencedRelation: "decrypted_bank_connections"
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
      decrypted_bank_connections: {
        Row: {
          access_token: string | null
          created_at: string | null
          decrypted_name: string | null
          enrollment_id: string | null
          expires_at: string | null
          id: string | null
          institution_id: string | null
          logo_url: string | null
          name: string | null
          provider: Database["public"]["Enums"]["bank_providers"] | null
          team_id: string | null
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          decrypted_name?: never
          enrollment_id?: string | null
          expires_at?: string | null
          id?: string | null
          institution_id?: string | null
          logo_url?: string | null
          name?: string | null
          provider?: Database["public"]["Enums"]["bank_providers"] | null
          team_id?: string | null
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          decrypted_name?: never
          enrollment_id?: string | null
          expires_at?: string | null
          id?: string | null
          institution_id?: string | null
          logo_url?: string | null
          name?: string | null
          provider?: Database["public"]["Enums"]["bank_providers"] | null
          team_id?: string | null
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
      decrypted_inbox: {
        Row: {
          amount: number | null
          archived: boolean | null
          attachment_id: string | null
          content_type: string | null
          created_at: string | null
          currency: string | null
          decrypted_issuer_name: string | null
          decrypted_name: string | null
          decrypted_subject: string | null
          due_date: string | null
          email: string | null
          file_name: string | null
          file_path: string[] | null
          forwarded_to: string | null
          id: string | null
          issuer_name: string | null
          name: string | null
          read: boolean | null
          size: number | null
          subject: string | null
          team_id: string | null
          transaction_id: string | null
          trash: boolean | null
        }
        Insert: {
          amount?: number | null
          archived?: boolean | null
          attachment_id?: string | null
          content_type?: string | null
          created_at?: string | null
          currency?: string | null
          decrypted_issuer_name?: never
          decrypted_name?: never
          decrypted_subject?: never
          due_date?: string | null
          email?: string | null
          file_name?: string | null
          file_path?: string[] | null
          forwarded_to?: string | null
          id?: string | null
          issuer_name?: string | null
          name?: string | null
          read?: boolean | null
          size?: number | null
          subject?: string | null
          team_id?: string | null
          transaction_id?: string | null
          trash?: boolean | null
        }
        Update: {
          amount?: number | null
          archived?: boolean | null
          attachment_id?: string | null
          content_type?: string | null
          created_at?: string | null
          currency?: string | null
          decrypted_issuer_name?: never
          decrypted_name?: never
          decrypted_subject?: never
          due_date?: string | null
          email?: string | null
          file_name?: string | null
          file_path?: string[] | null
          forwarded_to?: string | null
          id?: string | null
          issuer_name?: string | null
          name?: string | null
          read?: boolean | null
          size?: number | null
          subject?: string | null
          team_id?: string | null
          transaction_id?: string | null
          trash?: boolean | null
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
          {
            foreignKeyName: "public_inbox_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "decrypted_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      decrypted_transaction_enrichments: {
        Row: {
          category: Database["public"]["Enums"]["transactionCategories"] | null
          created_at: string | null
          created_by: string | null
          decrypted_name: string | null
          id: string | null
          name: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["transactionCategories"] | null
          created_at?: string | null
          created_by?: string | null
          decrypted_name?: never
          id?: string | null
          name?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["transactionCategories"] | null
          created_at?: string | null
          created_by?: string | null
          decrypted_name?: never
          id?: string | null
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_enrichments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      decrypted_transactions: {
        Row: {
          amount: number | null
          assigned_id: string | null
          balance: number | null
          bank_account_id: string | null
          category: Database["public"]["Enums"]["transactionCategories"] | null
          created_at: string | null
          currency: string | null
          currency_rate: number | null
          currency_source: string | null
          date: string | null
          decrypted_description: string | null
          decrypted_name: string | null
          description: string | null
          id: string | null
          internal_id: string | null
          manual: boolean | null
          method: Database["public"]["Enums"]["transactionMethods"] | null
          name: string | null
          note: string | null
          order: number | null
          status: Database["public"]["Enums"]["transactionStatus"] | null
          team_id: string | null
        }
        Insert: {
          amount?: number | null
          assigned_id?: string | null
          balance?: number | null
          bank_account_id?: string | null
          category?: Database["public"]["Enums"]["transactionCategories"] | null
          created_at?: string | null
          currency?: string | null
          currency_rate?: number | null
          currency_source?: string | null
          date?: string | null
          decrypted_description?: never
          decrypted_name?: never
          description?: string | null
          id?: string | null
          internal_id?: string | null
          manual?: boolean | null
          method?: Database["public"]["Enums"]["transactionMethods"] | null
          name?: string | null
          note?: string | null
          order?: number | null
          status?: Database["public"]["Enums"]["transactionStatus"] | null
          team_id?: string | null
        }
        Update: {
          amount?: number | null
          assigned_id?: string | null
          balance?: number | null
          bank_account_id?: string | null
          category?: Database["public"]["Enums"]["transactionCategories"] | null
          created_at?: string | null
          currency?: string | null
          currency_rate?: number | null
          currency_source?: string | null
          date?: string | null
          decrypted_description?: never
          decrypted_name?: never
          description?: string | null
          id?: string | null
          internal_id?: string | null
          manual?: boolean | null
          method?: Database["public"]["Enums"]["transactionMethods"] | null
          name?: string | null
          note?: string | null
          order?: number | null
          status?: Database["public"]["Enums"]["transactionStatus"] | null
          team_id?: string | null
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
            foreignKeyName: "public_transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "decrypted_bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_transactions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      amount_text: {
        Args: {
          "": unknown
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
      total_duration: {
        Args: {
          "": unknown
        }
        Returns: number
      }
      upsert_bank_connection: {
        Args: {
          b_id: string
          b_name: string
          b_institution_id: string
          b_logo_url: string
          b_team_id: string
          b_provider?: Database["public"]["Enums"]["bank_providers"]
          b_access_token?: string
          b_enrollment_id?: string
          b_expires_at?: string
        }
        Returns: {
          access_token: string | null
          created_at: string
          enrollment_id: string | null
          expires_at: string | null
          id: string
          institution_id: string
          logo_url: string | null
          name: string
          provider: Database["public"]["Enums"]["bank_providers"] | null
          team_id: string
        }
      }
    }
    Enums: {
      bank_providers: "gocardless" | "plaid" | "teller"
      bankProviders: "gocardless" | "plaid" | "teller"
      reportTypes: "profit" | "revenue"
      teamRoles: "owner" | "member"
      trackerStatus: "in_progress" | "completed"
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
      transactionStatus: "posted" | "pending" | "excluded"
    }
    CompositeTypes: {
      metrics_record: {
        date: string | null
        value: number | null
      }
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
