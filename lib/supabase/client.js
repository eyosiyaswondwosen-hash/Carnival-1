import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cydeiefuyejxtjqpqxlt.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5ZGVpZWZ1eWVqeHRqcXBxeGx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNzMyNDYsImV4cCI6MjA5Mjk0OTI0Nn0.IcuYKSfJQVqZS7WdFCsIs6ufZYiuMgatLN86Qu0HKUY'

let browserClient

export function createClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  }
  return browserClient
}
