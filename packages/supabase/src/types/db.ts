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
      members: {
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
            foreignKeyName: "members_team_id_fkey";
            columns: ["team_id"];
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "members_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
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
          attachment: string | null;
          bank_account_id: string | null;
          booking_date: string | null;
          created_at: string;
          currency: string | null;
          name: string | null;
          id: number;
          internal_id: string | null;
          note: string | null;
          original: string | null;
          reference_id: string;
          team_id: string | null;
          method: string | null;
          transaction_id: string;
          date: string | null;
          vat: Database["public"]["Enums"]["vatRates"] | null;
        };
        Insert: {
          amount?: number | null;
          assigned_id?: string | null;
          attachment?: string | null;
          bank_account_id?: string | null;
          booking_date?: string | null;
          created_at?: string;
          currency?: string | null;
          name?: string | null;
          id?: number;
          internal_id?: string | null;
          note?: string | null;
          original?: string | null;
          reference_id: string;
          team_id?: string | null;
          method?: string | null;
          transaction_id: string;
          date?: string | null;
          vat?: Database["public"]["Enums"]["vatRates"] | null;
        };
        Update: {
          amount?: number | null;
          assigned_id?: string | null;
          attachment?: string | null;
          bank_account_id?: string | null;
          booking_date?: string | null;
          created_at?: string;
          currency?: string | null;
          name?: string | null;
          id?: number;
          internal_id?: string | null;
          note?: string | null;
          original?: string | null;
          reference_id?: string;
          team_id?: string | null;
          method?: string | null;
          transaction_id?: string;
          date?: string | null;
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
      transactionStatus: "booked" | "pending";
      vatRates: "25" | "12" | "6" | "0";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
