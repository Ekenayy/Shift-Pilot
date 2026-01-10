// Database types for Supabase Edge Functions
// This is a subset of the full database.ts from mobile app

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
          route_polyline: string | null;
          is_favorite: boolean;
          classification_status: ClassificationStatus;
          origin_address: string | null;
          dest_address: string | null;
        };
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
      };
    };
  };
};

export type Trip = Database["public"]["Tables"]["trips"]["Row"];
export type ExportInsert = Database["public"]["Tables"]["exports"]["Insert"];
