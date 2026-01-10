# Trip Export Edge Function - Deployment Guide

This guide walks you through deploying the trip export Edge Function to your Supabase project.

## Prerequisites

1. Supabase CLI installed (`npm install -g supabase`)
2. Supabase project created
3. Resend account for email delivery

## Step 1: Set Up Resend

### 1.1 Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email

### 1.2 Get API Key

1. In Resend dashboard, go to "API Keys"
2. Click "Create API Key"
3. Give it a name (e.g., "Shift-Pilot Production")
4. Copy the API key (starts with `re_`)

### 1.3 Configure Domain (Optional but Recommended)

For production, configure your domain:

1. In Resend, go to "Domains"
2. Add your domain (e.g., `shiftpilot.com`)
3. Add the DNS records shown to your domain provider
4. Wait for verification (usually a few minutes)

For testing, you can skip this and use Resend's test domain.

## Step 2: Link Supabase Project

If you haven't already linked your local project to Supabase:

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref
```

Your project ref can be found in your Supabase project URL: `https://your-project-ref.supabase.co`

## Step 3: Set Environment Variables

Add the Resend API key to your Supabase project:

```bash
supabase secrets set RESEND_API_KEY=re_your_api_key_here
```

Verify it was set:

```bash
supabase secrets list
```

You should see `RESEND_API_KEY` in the list.

## Step 4: Deploy the Edge Function

Deploy the function to Supabase:

```bash
# Deploy from the project root
supabase functions deploy export-trips

# Or with verification
supabase functions deploy export-trips --verify-jwt
```

The function will be deployed to:
```
https://your-project-ref.supabase.co/functions/v1/export-trips
```

## Step 5: Test the Deployment

### 5.1 Get a Test Token

You'll need a valid user access token. You can get one by:

1. Login to your app on a device/emulator
2. Use the Supabase client to get the session token
3. Or use the Supabase dashboard's SQL editor to get a user ID and generate a token

### 5.2 Test the Function

```bash
curl -i --location --request POST \
  'https://your-project-ref.supabase.co/functions/v1/export-trips' \
  --header 'Authorization: Bearer YOUR_USER_ACCESS_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{
    "period_start": "2026-01-01",
    "period_end": "2026-01-31",
    "format": "both",
    "email": "your-email@example.com"
  }'
```

### 5.3 Verify Success

1. Check the response - should be 200 with success message
2. Check your email - you should receive the export
3. Check Supabase logs: `supabase functions logs export-trips`
4. Check the `exports` table in your database

## Step 6: Monitor and Debug

### View Logs

```bash
# Real-time logs
supabase functions logs export-trips --follow

# Recent logs
supabase functions logs export-trips --limit 50
```

### Common Issues

**Error: "Email service not configured"**
- Check that RESEND_API_KEY is set: `supabase secrets list`
- Verify the API key is valid in Resend dashboard

**Error: "Failed to send email"**
- Check Resend dashboard for delivery logs
- Verify your domain is configured (if not using test domain)
- Check the email address is valid

**Error: "No trips found"**
- Verify the user has trips in the specified date range
- Check RLS policies are correctly set up
- Verify the user token is valid

## Step 7: Update Mobile App (Next Step)

Now that the backend is ready, you can integrate it into your mobile app:

1. Create a new service in `apps/mobile/src/services/exports/ExportService.ts`
2. Add UI to trigger exports from TripsScreen
3. Add a date range picker
4. Add format selector (CSV, PDF, Both)
5. Add email input field
6. Call the Edge Function with user's auth token

Example service call:

```typescript
const supabase = createSupabaseClient();
const session = await supabase.auth.getSession();

const response = await fetch(
  `${SUPABASE_URL}/functions/v1/export-trips`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.data.session?.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      period_start: '2026-01-01',
      period_end: '2026-01-31',
      format: 'both',
      email: user.email,
    }),
  }
);
```

## Production Checklist

Before going live:

- [ ] Domain verified in Resend
- [ ] Production API key set in Supabase secrets
- [ ] Function deployed and tested
- [ ] Email template reviewed and approved
- [ ] RLS policies verified
- [ ] Error handling tested (no trips, invalid dates, etc.)
- [ ] Rate limiting configured (if needed)
- [ ] Monitoring and alerting set up

## Security Notes

- The function uses Supabase RLS - users can only export their own trips
- Emails are sent only to the address specified in the request (consider validating this matches the user's email in production)
- No file storage - exports are generated on-demand and delivered via email
- API key is stored as a secret and never exposed to clients

## Cost Considerations

- **Supabase Edge Functions**: Free tier includes 500K invocations/month
- **Resend**: Free tier includes 3,000 emails/month
- **PDF Generation**: Uses jsPDF which is lightweight and fast

For most use cases, the free tiers should be sufficient. Monitor usage in both dashboards.
