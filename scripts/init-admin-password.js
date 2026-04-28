#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cydeiefuyejxtjqpqxlt.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5ZGVpZWZ1eWVqeHRqcXBxeGx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNzMyNDYsImV4cCI6MjA5Mjk0OTI0Nn0.IcuYKSfJQVqZS7WdFCsIs6ufZYiuMgatLN86Qu0HKUY'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function initializeAdminPassword() {
  console.log('Initializing admin password...')
  
  try {
    // Try to insert the admin password
    const { data, error } = await supabase
      .from('admin_config')
      .upsert(
        { config_key: 'admin_password', config_value: '9134', updated_by: 'system' },
        { onConflict: 'config_key' }
      )
      .select()
    
    if (error) {
      console.error('Error:', error.message)
      return false
    }
    
    console.log('Admin password initialized successfully')
    return true
  } catch (e) {
    console.error('Exception:', e.message)
    return false
  }
}

await initializeAdminPassword()
