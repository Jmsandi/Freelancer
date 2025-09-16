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
      profiles: {
        Row: {
          address: Json | null
          business_name: string | null
          business_type: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          tax_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: Json | null
          business_name?: string | null
          business_type?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: Json | null
          business_name?: string | null
          business_type?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tax_filings: {
        Row: {
          calculated_tax: number
          created_at: string
          filed_at: string | null
          id: string
          pdf_report_url: string | null
          status: string
          tax_year: number
          taxable_income: number
          total_deductions: number
          total_income: number
          updated_at: string
          user_id: string
        }
        Insert: {
          calculated_tax?: number
          created_at?: string
          filed_at?: string | null
          id?: string
          pdf_report_url?: string | null
          status?: string
          tax_year: number
          taxable_income?: number
          total_deductions?: number
          total_income?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          calculated_tax?: number
          created_at?: string
          filed_at?: string | null
          id?: string
          pdf_report_url?: string | null
          status?: string
          tax_year?: number
          taxable_income?: number
          total_deductions?: number
          total_income?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tax_rules: {
        Row: {
          created_at: string
          id: string
          income_bracket_max: number | null
          income_bracket_min: number
          standard_deduction: number
          tax_rate: number
          tax_year: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          income_bracket_max?: number | null
          income_bracket_min?: number
          standard_deduction?: number
          tax_rate: number
          tax_year: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          income_bracket_max?: number | null
          income_bracket_min?: number
          standard_deduction?: number
          tax_rate?: number
          tax_year?: number
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["transaction_category"]
          created_at: string
          description: string
          id: string
          is_tax_deductible: boolean | null
          receipt_url: string | null
          transaction_date: string
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category: Database["public"]["Enums"]["transaction_category"]
          created_at?: string
          description: string
          id?: string
          is_tax_deductible?: boolean | null
          receipt_url?: string | null
          transaction_date: string
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["transaction_category"]
          created_at?: string
          description?: string
          id?: string
          is_tax_deductible?: boolean | null
          receipt_url?: string | null
          transaction_date?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      transaction_category:
        | "freelance_income"
        | "consulting_income"
        | "product_sales"
        | "other_income"
        | "office_supplies"
        | "software_subscriptions"
        | "marketing"
        | "travel"
        | "meals_entertainment"
        | "professional_development"
        | "equipment"
        | "other_expense"
      transaction_type: "income" | "expense"
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
      app_role: ["admin", "user"],
      transaction_category: [
        "freelance_income",
        "consulting_income",
        "product_sales",
        "other_income",
        "office_supplies",
        "software_subscriptions",
        "marketing",
        "travel",
        "meals_entertainment",
        "professional_development",
        "equipment",
        "other_expense",
      ],
      transaction_type: ["income", "expense"],
    },
  },
} as const
