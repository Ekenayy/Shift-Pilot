#!/bin/bash

# Test export function with your credentials
# This will export trips from January 2026 and email them to you

curl -i -X POST \
  'https://gscibozpwxwdpspitbld.supabase.co/functions/v1/export-trips' \
  -H "Authorization: Bearer eyJhbGciOiJFUzI1NiIsImtpZCI6IjJhYTliOGIxLThhNWUtNDU4Yy1hYmRiLWRiZDIyNDdlM2E1YyIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2dzY2lib3pwd3h3ZHBzcGl0YmxkLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIwMDBkZGFkZC04N2VlLTRhY2ItYmM5Mi01ZTg3NDdkM2UzMTEiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzY4MDAwOTMwLCJpYXQiOjE3Njc5OTczMzAsImVtYWlsIjoiZWtlbmF5eUBnbWFpbC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsIjoiZWtlbmF5eUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiIwMDBkZGFkZC04N2VlLTRhY2ItYmM5Mi01ZTg3NDdkM2UzMTEifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc2Nzg1NzEwMn1dLCJzZXNzaW9uX2lkIjoiM2VmMmQ1MDQtM2U3Zi00OThmLTlkMTktODhiY2ZiNTlmYTYwIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.aPXSD8goWcbqP88cnBcjxGazZ153vB-mBkypR_aJ_f7UWu6hdpxy_frAVEXu_Y96KAJx91uRyczGALBatyR61g" \
  -H "Content-Type: application/json" \
  -d '{
    "period_start": "2026-01-01",
    "period_end": "2026-01-09",
    "format": "both",
    "email": "ekenayy@gmail.com"
  }'
