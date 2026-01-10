import { corsHeaders } from "../_shared/cors.ts";
import { createSupabaseClient } from "../_shared/supabase.ts";
import type { Trip } from "../_shared/database.types.ts";
import { generateCSV } from "./csv-generator.ts";
import { generatePDF } from "./pdf-generator.ts";

// Helper function to encode base64 with Unicode support
function base64Encode(data: Uint8Array): string {
  const base64abc = [
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
    "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
    "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
    "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "+", "/"
  ];

  let result = '';
  let i;
  const l = data.length;

  for (i = 2; i < l; i += 3) {
    result += base64abc[data[i - 2] >> 2];
    result += base64abc[((data[i - 2] & 0x03) << 4) | (data[i - 1] >> 4)];
    result += base64abc[((data[i - 1] & 0x0f) << 2) | (data[i] >> 6)];
    result += base64abc[data[i] & 0x3f];
  }

  if (i === l + 1) {
    result += base64abc[data[i - 2] >> 2];
    result += base64abc[(data[i - 2] & 0x03) << 4];
    result += "==";
  }

  if (i === l) {
    result += base64abc[data[i - 2] >> 2];
    result += base64abc[((data[i - 2] & 0x03) << 4) | (data[i - 1] >> 4)];
    result += base64abc[(data[i - 1] & 0x0f) << 2];
    result += "=";
  }

  return result;
}

interface ExportRequest {
  period_start: string; // YYYY-MM-DD
  period_end: string; // YYYY-MM-DD
  format: "csv" | "pdf" | "both";
  email: string;
  purposes?: string[]; // Optional: filter by trip purposes
  filter_description?: string; // Optional: human-readable filter description (e.g., "Business Drives", "Personal Drives", "All Drives")
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const body: ExportRequest = await req.json();
    const { period_start, period_end, format, email, purposes, filter_description } = body;

    // Use filter description or default to "All Drives"
    const filterDesc = filter_description || "All Drives";

    // Validate request
    if (!period_start || !period_end || !format || !email) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: period_start, period_end, format, email",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client with user's auth
    const supabase = createSupabaseClient(authHeader);

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Query trips for the period (RLS automatically filters by user)
    let query = supabase
      .from("trips")
      .select("*")
      .gte("started_at", `${period_start}T00:00:00`)
      .lte("started_at", `${period_end}T23:59:59`);

    // Apply purpose filter if provided
    if (purposes && purposes.length > 0) {
      query = query.in("purpose", purposes);
    }

    const { data: trips, error: tripsError } = await query.order("started_at", { ascending: true });

    if (tripsError) {
      console.error("Error fetching trips:", tripsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch trips" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!trips || trips.length === 0) {
      return new Response(
        JSON.stringify({ error: "No trips found for the specified period" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate export files
    const attachments = [];
    const exportRecords = [];

    if (format === "csv" || format === "both") {
      const csvContent = generateCSV(trips as Trip[], period_start, period_end, filterDesc);
      // Use Deno's base64 encoder to properly handle Unicode characters
      const encoder = new TextEncoder();
      const csvBytes = encoder.encode(csvContent);
      const csvBase64 = base64Encode(csvBytes);

      attachments.push({
        filename: `shift-pilot-trips-${period_start}-to-${period_end}.csv`,
        content: csvBase64,
        type: "text/csv",
        disposition: "attachment",
      });

      exportRecords.push({
        user_id: user.id,
        export_type: "csv" as const,
        period_start,
        period_end,
        rows_included: trips.length,
      });
    }

    if (format === "pdf" || format === "both") {
      const pdfBytes = generatePDF(trips as Trip[], period_start, period_end, filterDesc);

      // Convert Uint8Array to base64 using Deno's encoder
      const pdfBase64 = base64Encode(pdfBytes);

      attachments.push({
        filename: `shift-pilot-trips-${period_start}-to-${period_end}.pdf`,
        content: pdfBase64,
        type: "application/pdf",
        disposition: "attachment",
      });

      exportRecords.push({
        user_id: user.id,
        export_type: "pdf" as const,
        period_start,
        period_end,
        rows_included: trips.length,
      });
    }

    // Send email via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Shift-Pilot <onboarding@resend.dev>",
        to: [email],
        subject: `Your Shift-Pilot Mileage Report - ${filterDesc} (${formatDateRange(period_start)} - ${formatDateRange(period_end)})`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #34435E;">Your Mileage Report is Ready</h2>
            <p>Hi there,</p>
            <p>Your requested mileage report for <strong>${formatDateRange(period_start)}</strong> to <strong>${formatDateRange(period_end)}</strong> is attached to this email.</p>

            <div style="background-color: #EBF6FF; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #34435E; margin-top: 0;">Report Summary</h3>
              <p style="margin: 5px 0;"><strong>Filter:</strong> ${filterDesc}</p>
              <p style="margin: 5px 0;"><strong>Total Trips:</strong> ${trips.length}</p>
              <p style="margin: 5px 0;"><strong>Total Miles:</strong> ${calculateTotalMiles(trips as Trip[])} mi</p>
              <p style="margin: 5px 0;"><strong>Total Deduction:</strong> $${calculateTotalDeduction(trips as Trip[])}</p>
            </div>

            <p>The attached ${format === "both" ? "files contain" : "file contains"} your detailed trip log and summary for tax purposes.</p>

            <p style="margin-top: 30px;">
              <strong>Keep tracking with Shift-Pilot!</strong><br>
              <a href="https://shiftpilot.com" style="color: #34435E;">shiftpilot.com</a>
            </p>

            <p style="color: #B4B5B8; font-size: 12px; margin-top: 30px;">
              This is an automated email from Shift-Pilot. Please do not reply to this email.
            </p>
          </div>
        `,
        attachments,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Resend API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: errorText }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Record export in database
    for (const record of exportRecords) {
      const { error: exportError } = await supabase
        .from("exports")
        .insert(record);

      if (exportError) {
        console.error("Error recording export:", exportError);
        // Don't fail the request if export recording fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Export sent successfully to ${email}`,
        trips_included: trips.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function formatDateRange(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function calculateTotalMiles(trips: Trip[]): string {
  const total = trips.reduce((sum, trip) => sum + (trip.distance_miles || 0), 0);
  return total.toFixed(1);
}

function calculateTotalDeduction(trips: Trip[]): string {
  const total = trips.reduce((sum, trip) => sum + (trip.deduction_value || 0), 0);
  return total.toFixed(2);
}
