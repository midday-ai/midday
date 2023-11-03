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
      attachments: {
        Row: {
          created_at: string
          id: string
          name: string | null
          path: string | null
          size: number | null
          team_id: string | null
          transaction_id: string | null
          type: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          path?: string | null
          size?: number | null
          team_id?: string | null
          transaction_id?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          path?: string | null
          size?: number | null
          team_id?: string | null
          transaction_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attachments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          }
        ]
      }
      bank_accounts: {
        Row: {
          account_id: string
          bank_connection_id: string | null
          bban: string | null
          bic: string | null
          created_at: string
          created_by: string
          currency: string | null
          iban: string | null
          id: string
          last_accessed: string | null
          name: string | null
          owner_name: string | null
          team_id: string | null
        }
        Insert: {
          account_id: string
          bank_connection_id?: string | null
          bban?: string | null
          bic?: string | null
          created_at?: string
          created_by: string
          currency?: string | null
          iban?: string | null
          id?: string
          last_accessed?: string | null
          name?: string | null
          owner_name?: string | null
          team_id?: string | null
        }
        Update: {
          account_id?: string
          bank_connection_id?: string | null
          bban?: string | null
          bic?: string | null
          created_at?: string
          created_by?: string
          currency?: string | null
          iban?: string | null
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
      teams: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number | null
          assigned_id: string | null
          bank_account_id: string | null
          booking_date: string | null
          category: Database["public"]["Enums"]["transactionCategories"] | null
          created_at: string
          currency: string | null
          date: string | null
          id: string
          method: Database["public"]["Enums"]["transactionMethods"] | null
          name: string | null
          note: string | null
          order: number
          original: string | null
          provider_transaction_id: string | null
          reference: string
          team_id: string | null
          transaction_id: string
          vat: Database["public"]["Enums"]["vatRates"] | null
        }
        Insert: {
          amount?: number | null
          assigned_id?: string | null
          bank_account_id?: string | null
          booking_date?: string | null
          category?: Database["public"]["Enums"]["transactionCategories"] | null
          created_at?: string
          currency?: string | null
          date?: string | null
          id?: string
          method?: Database["public"]["Enums"]["transactionMethods"] | null
          name?: string | null
          note?: string | null
          order?: number
          original?: string | null
          provider_transaction_id?: string | null
          reference: string
          team_id?: string | null
          transaction_id: string
          vat?: Database["public"]["Enums"]["vatRates"] | null
        }
        Update: {
          amount?: number | null
          assigned_id?: string | null
          bank_account_id?: string | null
          booking_date?: string | null
          category?: Database["public"]["Enums"]["transactionCategories"] | null
          created_at?: string
          currency?: string | null
          date?: string | null
          id?: string
          method?: Database["public"]["Enums"]["transactionMethods"] | null
          name?: string | null
          note?: string | null
          order?: number
          original?: string | null
          provider_transaction_id?: string | null
          reference?: string
          team_id?: string | null
          transaction_id?: string
          vat?: Database["public"]["Enums"]["vatRates"] | null
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
            foreignKeyName: "transactions_team_id_fkey"
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
          id: string
          role: Database["public"]["Enums"]["teamRoles"] | null
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["teamRoles"] | null
          team_id: string
          user_id: string
        }
        Update: {
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
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      bankProviders: "gocardless" | "plaid"
      teamRoles: "admin" | "member"
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
        | "other"
      transactionMethods:
        | "payment"
        | "card_purchase"
        | "card_atm"
        | "transfer"
        | "other"
      transactionStatus: "booked" | "pending"
      vatRates: "25" | "12" | "6" | "0"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
