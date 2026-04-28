import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function setupDatabase() {
  try {
    console.log('Setting up Carnival Tickets database...')

    // Create tickets table
    const { error: createError } = await supabase.rpc('create_tickets_table', {})
    
    if (createError && !createError.message.includes('already exists')) {
      console.error('Error creating table:', createError)
      return
    }

    console.log('Database setup complete!')
  } catch (error) {
    console.error('Setup error:', error)
  }
}

setupDatabase()
