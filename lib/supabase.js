import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cydeiefuyejxtjqpqxlt.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5ZGVpZWZ1eWVqeHRqcXBxeGx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNzMyNDYsImV4cCI6MjA5Mjk0OTI0Nn0.IcuYKSfJQVqZS7WdFCsIs6ufZYiuMgatLN86Qu0HKUY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
