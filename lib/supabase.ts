import { createClient } from "@supabase/supabase-js";

// NOTE: These environment variables are set in .env.local
// and are exposed to the browser since they are prefixed with NEXT_PUBLIC_
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;


// TEMPORARY - remove after debugging
// console.log("Supabase URL:", supabaseUrl);
// console.log("Supabase Key:", supabaseAnonKey?.slice(0, 20));

// NOTE: We create a single supabase client instance and export it
// so it can be reused across the entire app without creating
// multiple connections
export const supabase = createClient(supabaseUrl, supabaseAnonKey);