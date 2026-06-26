import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

// Public Supabase project URL + anon key. These are not secrets (the anon key
// is meant to ship in the client), so they are baked in as defaults to satisfy
// the "no build-time env vars required" constraint. An env var still overrides.
const DEFAULT_SUPABASE_URL = "https://huespjdrujyuebsbtfic.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1ZXNwamRydWp5dWVic2J0ZmljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MTQzNzEsImV4cCI6MjA5MDI5MDM3MX0.MTOV7YP7KqLD9g-xuAW8ysy_mXG93x0g1P1LoPuARCg";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key",
  {
    auth: {
      storage: Platform.OS !== "web" ? AsyncStorage : undefined,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === "web",
    },
  }
);
