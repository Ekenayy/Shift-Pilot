// TODO: Initialize Supabase client
// import { createClient } from "@supabase/supabase-js";

export const supabase = {
  // Placeholder - replace with actual Supabase client
  from: (table: string) => ({
    select: () => Promise.resolve({ data: [], error: null }),
  }),
};
