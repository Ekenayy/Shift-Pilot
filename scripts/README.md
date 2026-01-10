# Get User Token Script

This script helps you quickly get a user access token for testing the export Edge Function.

## Quick Start

### 1. Install Dependencies

```bash
cd scripts
npm install
```

### 2. Set Your Supabase Credentials

Option A - Using environment variables (recommended):

```bash
# Copy values from apps/mobile/.env
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
```

Option B - Edit the script directly:

Open `get-token.js` and replace the placeholder values:
```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

### 3. Run the Script

```bash
node get-token.js test@example.com your-password
```

Replace with your actual test user's email and password.

### 4. Use the Token

The script will output:
- The access token (copy this)
- A ready-to-use curl command for testing the export function
- Token expiration time

## Example Output

```
✅ Login successful!

================================================================================
ACCESS TOKEN:
================================================================================
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
================================================================================

User ID: 123e4567-e89b-12d3-a456-426614174000
Email: test@example.com
Token expires: 1/9/2026, 6:30:00 PM
Valid for: 60 minutes

💡 Test the export function:

curl -X POST https://xxx.supabase.co/functions/v1/export-trips \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "Content-Type: application/json" \
  -d '{
    "period_start": "2026-01-01",
    "period_end": "2026-01-31",
    "format": "both",
    "email": "test@example.com"
  }'
```

## Testing the Export Function

Once you have the token, copy the curl command from the output and run it:

```bash
# The script outputs a ready-to-use curl command
# Just copy and paste it into your terminal
```

Or test in your API client (Postman, Insomnia, etc.):

- **URL**: `https://your-project.supabase.co/functions/v1/export-trips`
- **Method**: POST
- **Headers**:
  - `Authorization: Bearer YOUR_TOKEN`
  - `Content-Type: application/json`
- **Body**:
  ```json
  {
    "period_start": "2026-01-01",
    "period_end": "2026-01-31",
    "format": "both",
    "email": "test@example.com"
  }
  ```

## Creating a Test User

If you need a test user with some trips:

### Option 1: Via Supabase Dashboard
1. Go to Authentication → Users
2. Click "Add User"
3. Create user with email/password
4. Use the app to create some test trips for this user

### Option 2: Via SQL Editor
```sql
-- This only works if you have email confirmation disabled for testing
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES ('test@example.com', crypt('password123', gen_salt('bf')), NOW());
```

## Troubleshooting

**Error: "Email and password required"**
- Make sure you're passing both email and password as arguments

**Error: "Please set SUPABASE_URL and SUPABASE_ANON_KEY"**
- Set environment variables or edit the script with your credentials

**Error: "Invalid login credentials"**
- Check your email and password are correct
- Verify the user exists in Supabase Dashboard → Authentication → Users

**Error: "Invalid JWT"** (when testing export)
- Token may have expired (valid for 1 hour)
- Generate a new token

## Security Notes

- Never commit this script with hardcoded credentials
- Don't share tokens publicly
- Tokens expire after 1 hour
- Delete test users when done testing
