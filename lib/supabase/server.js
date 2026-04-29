import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cydeiefuyejxtjqpqxlt.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5ZGVpZWZ1eWVqeHRqcXBxeGx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNzMyNDYsImV4cCI6MjA5Mjk0OTI0Nn0.IcuYKSfJQVqZS7WdFCsIs6ufZYiuMgatLN86Qu0HKUY'

// Server client tied to user cookies (anon key, RLS-respecting)
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from a Server Component - safe to ignore when middleware refreshes sessions
          }
        },
      },
    }
  )
}

// Privileged service-role client for admin operations (bypasses RLS).
// Only use inside server-only API routes with verified admin sessions.
export function createServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY
  return createSupabaseClient(
    SUPABASE_URL,
    serviceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
