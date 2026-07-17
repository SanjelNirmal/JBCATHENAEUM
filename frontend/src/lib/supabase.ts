// Copyright by nirmal sanjel | hackingwithnirmal@gmail.com | +977 9848744321
import { createClient } from "@supabase/supabase-js";
import { publicEnvironment } from "./env";

const { supabaseUrl, supabaseAnonKey } = publicEnvironment.config;
const safeSupabaseUrl = supabaseUrl || "https://configuration-required.invalid";
const safeSupabaseAnonKey = supabaseAnonKey || "configuration-required";

export const supabase = createClient(safeSupabaseUrl, safeSupabaseAnonKey);
