export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      attachments: {
        Row: {
          created_at: string;
          id: string;
          name: string | null;
          path: string | null;
          size: number | null;
          team_id: string | null;
          transaction_id: string | null;
          type: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name?: string | null;
          path?: string | null;
          size?: number | null;
          team_id?: string | null;
          transaction_id?: string | null;
          type?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string | null;
          path?: string | null;
          size?: number | null;
          team_id?: string | null;
          transaction_id?: string | null;
          type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "attachments_team_id_fkey";
            columns: ["team_id"];
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attachments_transaction_id_fkey";
            columns: ["transaction_id"];
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          },
        ];
      };
      bank_accounts: {
        Row: {
          account_id: string;
          bank_name: string | null;
          created_at: string;
          created_by: string;
          id: string;
          logo_url: string | null;
          provider: Database["public"]["Enums"]["bankProviders"];
          team_id: string | null;
        };
        Insert: {
          account_id: string;
          bank_name?: string | null;
          created_at?: string;
          created_by: string;
          id?: string;
          logo_url?: string | null;
          provider: Database["public"]["Enums"]["bankProviders"];
          team_id?: string | null;
        };
        Update: {
          account_id?: string;
          bank_name?: string | null;
          created_at?: string;
          created_by?: string;
          id?: string;
          logo_url?: string | null;
          provider?: Database["public"]["Enums"]["bankProviders"];
          team_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "bank_accounts_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bank_accounts_team_id_fkey";
            columns: ["team_id"];
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      teams: {
        Row: {
          created_at: string;
          id: string;
          name: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string | null;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          amount: number | null;
          assigned_id: string | null;
          bank_account_id: string | null;
          booking_date: string | null;
          category: Database["public"]["Enums"]["transactionCategories"] | null;
          created_at: string;
          currency: string | null;
          date: string | null;
          id: string;
          method: Database["public"]["Enums"]["transactionMethods"] | null;
          name: string | null;
          note: string | null;
          order: number;
          original: string | null;
          provider_transaction_id: string | null;
          reference: string;
          team_id: string | null;
          transaction_id: string;
          vat: Database["public"]["Enums"]["vatRates"] | null;
        };
        Insert: {
          amount?: number | null;
          assigned_id?: string | null;
          bank_account_id?: string | null;
          booking_date?: string | null;
          category?:
            | Database["public"]["Enums"]["transactionCategories"]
            | null;
          created_at?: string;
          currency?: string | null;
          date?: string | null;
          id?: string;
          method?: Database["public"]["Enums"]["transactionMethods"] | null;
          name?: string | null;
          note?: string | null;
          order?: number;
          original?: string | null;
          provider_transaction_id?: string | null;
          reference: string;
          team_id?: string | null;
          transaction_id: string;
          vat?: Database["public"]["Enums"]["vatRates"] | null;
        };
        Update: {
          amount?: number | null;
          assigned_id?: string | null;
          bank_account_id?: string | null;
          booking_date?: string | null;
          category?:
            | Database["public"]["Enums"]["transactionCategories"]
            | null;
          created_at?: string;
          currency?: string | null;
          date?: string | null;
          id?: string;
          method?: Database["public"]["Enums"]["transactionMethods"] | null;
          name?: string | null;
          note?: string | null;
          order?: number;
          original?: string | null;
          provider_transaction_id?: string | null;
          reference?: string;
          team_id?: string | null;
          transaction_id?: string;
          vat?: Database["public"]["Enums"]["vatRates"] | null;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_assigned_id_fkey";
            columns: ["assigned_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_bank_account_id_fkey";
            columns: ["bank_account_id"];
            referencedRelation: "bank_accounts";
            referencedColumns: ["account_id"];
          },
          {
            foreignKeyName: "transactions_team_id_fkey";
            columns: ["team_id"];
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          avatar_url: string | null;
          email: string | null;
          full_name: string | null;
          id: string;
          team_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          email?: string | null;
          full_name?: string | null;
          id: string;
          team_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          team_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "users_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_team_id_fkey";
            columns: ["team_id"];
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      users_on_team: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["teamRoles"] | null;
          team_id: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          role?: Database["public"]["Enums"]["teamRoles"] | null;
          team_id: string;
          user_id: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["teamRoles"] | null;
          team_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "users_on_team_team_id_fkey";
            columns: ["team_id"];
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_on_team_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      bankProviders: "gocardless" | "plaid";
      teamRoles: "admin" | "member";
      transactionCategories:
        | "office_supplies"
        | "travel"
        | "rent"
        | "income"
        | "software"
        | "transfer"
        | "meals"
        | "equipment";
      transactionMethods:
        | "payment"
        | "card_purchase"
        | "card_atm"
        | "transfer"
        | "other";
      transactionStatus: "booked" | "pending";
      vatRates: "25" | "12" | "6" | "0";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
