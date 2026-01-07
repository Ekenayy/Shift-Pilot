export type TripPurpose =
  | "work"
  | "personal"
  | "mixed"
  | "unknown"
  | "charity"
  | "medical"
  | "military";

export type ClassificationStatus =
  | "unclassified"
  | "auto_classified"
  | "manually_classified";

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          created_at: string | null;
          onboarded_at: string | null;
          work_type: string | null;
          primary_platform: string | null;
          hourly_baseline: number | null;
          plan_tier: string;
          region: string | null;
          is_active: boolean;
        };
        Insert: {
          id: string;
          created_at?: string;
          onboarded_at?: string | null;
          work_type?: string | null;
          primary_platform?: string | null;
          hourly_baseline?: number | null;
          plan_tier?: string;
          region?: string | null;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
      trips: {
        Row: {
          id: string;
          user_id: string;
          started_at: string;
          ended_at: string;
          duration_seconds: number | null;
          distance_miles: number | null;
          distance_km: number | null;
          purpose: TripPurpose | null;
          deduction_rate: number | null;
          deduction_value: number | null;
          platform: string | null;
          origin_lat: number | null;
          origin_lng: number | null;
          dest_lat: number | null;
          dest_lng: number | null;
          source: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
          // New columns
          route_polyline: string | null;
          is_favorite: boolean;
          classification_status: ClassificationStatus;
          origin_address: string | null;
          dest_address: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          started_at: string;
          ended_at: string;
          duration_seconds?: number | null;
          distance_miles?: number | null;
          distance_km?: number | null;
          purpose?: TripPurpose | null;
          deduction_rate?: number | null;
          deduction_value?: number | null;
          platform?: string | null;
          origin_lat?: number | null;
          origin_lng?: number | null;
          dest_lat?: number | null;
          dest_lng?: number | null;
          source?: string;
          notes?: string | null;
          // New columns
          route_polyline?: string | null;
          is_favorite?: boolean;
          classification_status?: ClassificationStatus;
          origin_address?: string | null;
          dest_address?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["trips"]["Insert"]>;
      };
      daily_summaries: {
        Row: {
          user_id: string;
          date: string;
          work_miles: number;
          personal_miles: number;
          mixed_miles: number;
          deduction_value_total: number;
          trips_count: number;
          impact_cash_estimate: number | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          date: string;
          work_miles?: number;
          personal_miles?: number;
          mixed_miles?: number;
          deduction_value_total?: number;
          trips_count?: number;
          impact_cash_estimate?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["daily_summaries"]["Insert"]>;
      };
      exports: {
        Row: {
          id: string;
          user_id: string;
          export_type: "csv" | "pdf";
          period_start: string;
          period_end: string;
          rows_included: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          export_type: "csv" | "pdf";
          period_start: string;
          period_end: string;
          rows_included?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["exports"]["Insert"]>;
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: "free" | "pro" | "lifetime";
          started_at: string;
          ended_at: string | null;
          source: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan: "free" | "pro" | "lifetime";
          started_at: string;
          ended_at?: string | null;
          source?: string;
        };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
      };
      deduction_rates: {
        Row: {
          id: string;
          purpose: TripPurpose;
          rate_per_mile: number;
          display_name: string;
          description: string | null;
          is_active: boolean;
          effective_from: string;
          effective_until: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          purpose: TripPurpose;
          rate_per_mile: number;
          display_name: string;
          description?: string | null;
          is_active?: boolean;
          effective_from?: string;
          effective_until?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["deduction_rates"]["Insert"]>;
      };
    };
  };
};

// Helper types for easier access
export type Trip = Database["public"]["Tables"]["trips"]["Row"];
export type TripInsert = Database["public"]["Tables"]["trips"]["Insert"];
export type TripUpdate = Database["public"]["Tables"]["trips"]["Update"];

export type DeductionRate = Database["public"]["Tables"]["deduction_rates"]["Row"];

export type User = Database["public"]["Tables"]["users"]["Row"];
export type DailySummary = Database["public"]["Tables"]["daily_summaries"]["Row"];
