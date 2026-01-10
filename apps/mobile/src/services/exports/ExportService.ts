import { supabase } from "../supabaseClient";

export type ExportFormat = "csv" | "pdf" | "both";

interface ExportRequest {
  period_start: string; // YYYY-MM-DD
  period_end: string; // YYYY-MM-DD
  format: ExportFormat;
  email: string;
}

interface ExportResponse {
  success: boolean;
  message: string;
  trips_included: number;
}

export class ExportService {
  private static readonly FUNCTION_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/export-trips`;

  static async exportTrips(request: ExportRequest): Promise<ExportResponse> {
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      throw new Error("Not authenticated");
    }

    // Call the Edge Function
    const response = await fetch(this.FUNCTION_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(errorData.error || `Export failed with status ${response.status}`);
    }

    const data = await response.json();
    return data;
  }
}
