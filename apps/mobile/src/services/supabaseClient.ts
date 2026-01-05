import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import type { Database } from "../types/database";

const extra = Constants.expoConfig?.extra;

const SUPABASE_URL = extra?.supabaseUrl ?? "";
const SUPABASE_ANON_KEY = extra?.supabaseAnonKey ?? "";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("Supabase credentials not configured. Check your .env file.");
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
