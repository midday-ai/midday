export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      bank_accounts: {
        Row: {
          account_id: string
          bank_connection_id: string | null
          created_at: string
          created_by: string
          currency: string | null
          id: string
          last_accessed: string | null
          name: string | null
          owner_name: string | null
          team_id: string | null
        }
        Insert: {
          account_id: string
          bank_connection_id?: string | null
          created_at?: string
          created_by: string
          currency?: string | null
          id?: string
          last_accessed?: string | null
          name?: string | null
          owner_name?: string | null
          team_id?: string | null
        }
        Update: {
          account_id?: string
          bank_connection_id?: string | null
          created_at?: string
          created_by?: string
          currency?: string | null
          id?: string
          last_accessed?: string | null
          name?: string | null
          owner_name?: string | null
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
            foreignKeyName: "bank_accounts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
      bank_connections: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          institution_id: string | null
          logo_url: string | null
          name: string | null
          provider: Database["public"]["Enums"]["bankProviders"] | null
          team_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          institution_id?: string | null
          logo_url?: string | null
          name?: string | null
          provider?: Database["public"]["Enums"]["bankProviders"] | null
          team_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          institution_id?: string | null
          logo_url?: string | null
          name?: string | null
          provider?: Database["public"]["Enums"]["bankProviders"] | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_connections_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
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
            foreignKeyName: "inbox_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbox_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "decrypted_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbox_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          }
        ]
      }
      teams: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          inbox_id: string | null
          logo_url: string | null
          name: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          inbox_id?: string | null
          logo_url?: string | null
          name?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          inbox_id?: string | null
          logo_url?: string | null
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      tracker_projects: {
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
      tracker_records: {
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
            foreignKeyName: "transaction_attachments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_attachments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "decrypted_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_attachments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          }
        ]
      }
      transaction_enrichments: {
        Row: {
          category: Database["public"]["Enums"]["transactionCategories"]
          created_at: string
          created_by: string | null
          id: string
          name: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["transactionCategories"]
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["transactionCategories"]
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
          }
        ]
      }
      transactions: {
        Row: {
          amount: number
          assigned_id: string | null
          bank_account_id: string | null
          category: Database["public"]["Enums"]["transactionCategories"] | null
          created_at: string
          currency: string
          date: string
          flow: Database["public"]["Enums"]["transactionFlow"] | null
          id: string
          internal_id: string
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
          bank_account_id?: string | null
          category?: Database["public"]["Enums"]["transactionCategories"] | null
          created_at?: string
          currency: string
          date: string
          flow?: Database["public"]["Enums"]["transactionFlow"] | null
          id?: string
          internal_id: string
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
          bank_account_id?: string | null
          category?: Database["public"]["Enums"]["transactionCategories"] | null
          created_at?: string
          currency?: string
          date?: string
          flow?: Database["public"]["Enums"]["transactionFlow"] | null
          id?: string
          internal_id?: string
          method?: Database["public"]["Enums"]["transactionMethods"]
          name?: string
          note?: string | null
          order?: number
          status?: Database["public"]["Enums"]["transactionStatus"] | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_assigned_id_fkey"
            columns: ["assigned_id"]
            isOneToOne: false
            referencedRelation: "users"
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
            foreignKeyName: "transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "decrypted_bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
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
            foreignKeyName: "user_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_invites_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
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
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          locale?: string | null
          team_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          locale?: string | null
          team_id?: string | null
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
          }
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
          }
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
          decrypted_owner_name: string | null
          id: string | null
          last_accessed: string | null
          name: string | null
          owner_name: string | null
          team_id: string | null
        }
        Insert: {
          account_id?: string | null
          bank_connection_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          decrypted_name?: never
          decrypted_owner_name?: never
          id?: string | null
          last_accessed?: string | null
          name?: string | null
          owner_name?: string | null
          team_id?: string | null
        }
        Update: {
          account_id?: string | null
          bank_connection_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          decrypted_name?: never
          decrypted_owner_name?: never
          id?: string | null
          last_accessed?: string | null
          name?: string | null
          owner_name?: string | null
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
            foreignKeyName: "bank_accounts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
      decrypted_bank_connections: {
        Row: {
          created_at: string | null
          decrypted_name: string | null
          expires_at: string | null
          id: string | null
          institution_id: string | null
          logo_url: string | null
          name: string | null
          provider: Database["public"]["Enums"]["bankProviders"] | null
          team_id: string | null
        }
        Insert: {
          created_at?: string | null
          decrypted_name?: never
          expires_at?: string | null
          id?: string | null
          institution_id?: string | null
          logo_url?: string | null
          name?: string | null
          provider?: Database["public"]["Enums"]["bankProviders"] | null
          team_id?: string | null
        }
        Update: {
          created_at?: string | null
          decrypted_name?: never
          expires_at?: string | null
          id?: string | null
          institution_id?: string | null
          logo_url?: string | null
          name?: string | null
          provider?: Database["public"]["Enums"]["bankProviders"] | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_connections_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
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
            foreignKeyName: "inbox_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbox_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbox_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "decrypted_transactions"
            referencedColumns: ["id"]
          }
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
          }
        ]
      }
      decrypted_transactions: {
        Row: {
          amount: number | null
          assigned_id: string | null
          bank_account_id: string | null
          category: Database["public"]["Enums"]["transactionCategories"] | null
          created_at: string | null
          currency: string | null
          date: string | null
          decrypted_name: string | null
          flow: Database["public"]["Enums"]["transactionFlow"] | null
          id: string | null
          internal_id: string | null
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
          bank_account_id?: string | null
          category?: Database["public"]["Enums"]["transactionCategories"] | null
          created_at?: string | null
          currency?: string | null
          date?: string | null
          decrypted_name?: never
          flow?: Database["public"]["Enums"]["transactionFlow"] | null
          id?: string | null
          internal_id?: string | null
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
          bank_account_id?: string | null
          category?: Database["public"]["Enums"]["transactionCategories"] | null
          created_at?: string | null
          currency?: string | null
          date?: string | null
          decrypted_name?: never
          flow?: Database["public"]["Enums"]["transactionFlow"] | null
          id?: string | null
          internal_id?: string | null
          method?: Database["public"]["Enums"]["transactionMethods"] | null
          name?: string | null
          note?: string | null
          order?: number | null
          status?: Database["public"]["Enums"]["transactionStatus"] | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_assigned_id_fkey"
            columns: ["assigned_id"]
            isOneToOne: false
            referencedRelation: "users"
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
            foreignKeyName: "transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "decrypted_bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Functions: {
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
        Returns: unknown
      }
    }
    Enums: {
      bankProviders: "gocardless" | "plaid"
      teamRoles: "owner" | "member"
      transactionCategories:
        | "office_supplies"
        | "travel"
        | "rent"
        | "income"
        | "software"
        | "transfer"
        | "meals"
        | "equipment"
        | "activity"
        | "uncategorized"
        | "taxes"
        | "other"
        | "internet_and_telephone"
        | "facilities_expenses"
      transactionFlow: "inflow" | "outflow"
      transactionMethods:
        | "payment"
        | "card_purchase"
        | "card_atm"
        | "transfer"
        | "other"
      transactionStatus: "booked" | "pending"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never
