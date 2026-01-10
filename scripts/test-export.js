#!/usr/bin/env node
/**
 * Quick script to test the export function
 *
 * Usage:
 *   node scripts/test-export.js <token> <email> [start-date] [end-date] [format]
 *
 * Example:
 *   node scripts/test-export.js "eyJhbG..." test@example.com 2026-01-01 2026-01-31 both
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';

async function testExport(token, email, periodStart, periodEnd, format) {
  if (!token || !email) {
    console.error('Error: Token and email required');
    console.log('\nUsage:');
    console.log('  node scripts/test-export.js <token> <email> [start-date] [end-date] [format]');
    console.log('\nExample:');
    console.log('  node scripts/test-export.js "eyJhbG..." test@example.com 2026-01-01 2026-01-31 both');
    console.log('\nFormats: csv, pdf, both (default: both)');
    process.exit(1);
  }

  if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
    console.error('Error: Please set SUPABASE_URL environment variable');
    process.exit(1);
  }

  // Defaults
  const start = periodStart || '2026-01-01';
  const end = periodEnd || '2026-01-31';
  const fmt = format || 'both';

  console.log('\n📤 Testing export function...');
  console.log(`   Period: ${start} to ${end}`);
  console.log(`   Format: ${fmt}`);
  console.log(`   Email: ${email}`);

  const url = `${SUPABASE_URL}/functions/v1/export-trips`;
  const body = {
    period_start: start,
    period_end: end,
    format: fmt,
    email: email,
  };

  console.log(`\n🔗 POST ${url}`);
  console.log('📦 Body:', JSON.stringify(body, null, 2));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log(`\n📊 Response Status: ${response.status} ${response.statusText}`);

    const data = await response.json();

    if (response.ok) {
      console.log('\n✅ Success!');
      console.log(JSON.stringify(data, null, 2));
      console.log('\n📧 Check your email for the export!');
    } else {
      console.log('\n❌ Error:');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('\n❌ Request failed:', error.message);
    process.exit(1);
  }
}

// Parse arguments
const token = process.argv[2];
const email = process.argv[3];
const periodStart = process.argv[4];
const periodEnd = process.argv[5];
const format = process.argv[6];

testExport(token, email, periodStart, periodEnd, format);
