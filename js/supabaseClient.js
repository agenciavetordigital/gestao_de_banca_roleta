import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://dekubpsswkfrtotwljvf.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRla3VicHNzd2tmcnRvdHdsanZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNzYyOTAsImV4cCI6MjA3MzY1MjI5MH0.Winuq2LIkaGt1sGNXUhi__Q5_AczyxKAYQ_ORABoPTk";

export const db = createClient(SUPABASE_URL, SUPABASE_KEY);
