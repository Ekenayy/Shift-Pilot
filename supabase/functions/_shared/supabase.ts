import { createClient } from "jsr:@supabase/supabase-js@2";
import type { Database } from "./database.types.ts";

export function createSupabaseClient(authHeader: string) {
  return createClient<Database>(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    }
  );
}
