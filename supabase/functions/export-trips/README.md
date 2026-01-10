# Export Trips Edge Function

This Edge Function generates and emails CSV and/or PDF exports of trip data for a specified date range.

## Features

- Query trips with automatic RLS filtering (users only see their own data)
- Generate CSV export (similar to MileIQ format)
- Generate PDF export with summary and detailed log
- Email delivery via Resend
- Record export history in `exports` table

## Setup

### 1. Install Resend API Key

Get an API key from [Resend](https://resend.com) and add it to your Supabase project secrets:

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx
```

### 2. Configure Email Domain

In Resend, verify your domain (e.g., `shiftpilot.com`) to send emails from `reports@shiftpilot.com`.

For testing, you can use Resend's test domain.

### 3. Deploy the Function

```bash
supabase functions deploy export-trips
```

## API Usage

### Request

```http
POST https://your-project.supabase.co/functions/v1/export-trips
Authorization: Bearer <user-access-token>
Content-Type: application/json

{
  "period_start": "2026-01-01",
  "period_end": "2026-01-31",
  "format": "both",
  "email": "user@example.com"
}
```

### Parameters

- `period_start` (string, required): Start date in YYYY-MM-DD format
- `period_end` (string, required): End date in YYYY-MM-DD format
- `format` (string, required): Export format - "csv", "pdf", or "both"
- `email` (string, required): Email address to send the export to

### Response

**Success (200)**
```json
{
  "success": true,
  "message": "Export sent successfully to user@example.com",
  "trips_included": 42
}
```

**Error (400)**
```json
{
  "error": "Missing required fields: period_start, period_end, format, email"
}
```

**Error (401)**
```json
{
  "error": "Unauthorized"
}
```

**Error (404)**
```json
{
  "error": "No trips found for the specified period"
}
```

## Testing Locally

```bash
# Start Supabase locally
supabase start

# Serve the function locally
supabase functions serve export-trips --env-file supabase/.env.local

# Test with curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/export-trips' \
  --header 'Authorization: Bearer <your-test-token>' \
  --header 'Content-Type: application/json' \
  --data '{"period_start":"2026-01-01","period_end":"2026-01-31","format":"both","email":"test@example.com"}'
```

## Email Template

The function sends a branded HTML email with:
- Report summary (total trips, miles, deductions)
- Attached CSV and/or PDF files
- Link to Shift-Pilot website

## Export Formats

### CSV Export

Includes:
- Deduction rates summary
- Summary by purpose (Business, Personal, Medical, etc.)
- Detailed trip log with all fields
- IRS-compliant format

### PDF Export

Includes:
- Report header with date range
- Summary cards (total value, business value, distance, drives)
- Vehicle summary table
- Detailed drive log across multiple pages
- Page and report totals

## Database Records

Successful exports are recorded in the `exports` table with:
- `user_id`: User who requested the export
- `export_type`: "csv" or "pdf"
- `period_start` and `period_end`: Date range
- `rows_included`: Number of trips included
- `created_at`: Timestamp

## Security

- Uses Supabase RLS - users can only export their own trips
- Requires valid user authentication token
- Email is sent only to the address specified in the request
- No file storage - exports are generated on-demand and sent via email

## Dependencies

- `jspdf@2.5.2` - PDF generation
- `@supabase/supabase-js@2` - Supabase client
- Resend API - Email delivery
