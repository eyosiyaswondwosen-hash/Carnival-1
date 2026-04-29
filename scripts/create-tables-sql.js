import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cydeiefuyejxtjqpqxlt.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5ZGVpZWZ1eWVqeHRqcXBxeGx0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzM3MzI0NiwiZXhwIjoyMDkyOTQ5MjQ2fQ.u-LPrjxSdP8VqX_KQMKj3x0yDQjcQbLwvIFOXN7mVFo'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
})

async function createTablesViaSql() {
  console.log('Creating Supabase tables...\n')

  try {
    // Create tickets table
    console.log('Creating tickets table...')
    const { data: ticketsResult, error: ticketsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.tickets (
          id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
          name VARCHAR(255) NOT NULL,
          phone VARCHAR(20) NOT NULL,
          email VARCHAR(255),
          payment_method VARCHAR(50),
          payment_screenshot TEXT,
          screenshot_name VARCHAR(255),
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT NOW(),
          group_id VARCHAR(255),
          group_total INT DEFAULT 1,
          quantity INT DEFAULT 1,
          total_amount INT DEFAULT 600,
          ticket_index INT,
          scanned_at TIMESTAMP,
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `
    })

    if (ticketsError) {
      console.log('Note: tickets table may already exist or RPC not available')
      console.log('Error:', ticketsError.message)
    } else {
      console.log('Tickets table created successfully')
    }

    // Create admin_config table
    console.log('\nCreating admin_config table...')
    const { data: adminResult, error: adminError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.admin_config (
          id INT PRIMARY KEY DEFAULT 1,
          admin_password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `
    })

    if (adminError) {
      console.log('Note: admin_config table may already exist or RPC not available')
      console.log('Error:', adminError.message)
    } else {
      console.log('Admin config table created successfully')
    }

    console.log('\n✓ Supabase setup complete!')
    console.log('The app will automatically use these tables for persistent data storage.')

  } catch (error) {
    console.error('Setup error:', error.message)
    console.log('\nManual Setup Instructions:')
    console.log('1. Log in to your Supabase dashboard: https://supabase.com')
    console.log('2. Navigate to the SQL editor')
    console.log('3. Create a new query and run the following SQL:')
    console.log(`
-- Create tickets table
CREATE TABLE IF NOT EXISTS public.tickets (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  payment_method VARCHAR(50),
  payment_screenshot TEXT,
  screenshot_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  group_id VARCHAR(255),
  group_total INT DEFAULT 1,
  quantity INT DEFAULT 1,
  total_amount INT DEFAULT 600,
  ticket_index INT,
  scanned_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create admin_config table
CREATE TABLE IF NOT EXISTS public.admin_config (
  id INT PRIMARY KEY DEFAULT 1,
  admin_password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default admin password
INSERT INTO admin_config (id, admin_password) VALUES (1, '9134')
ON CONFLICT (id) DO UPDATE SET admin_password = '9134';

-- Enable RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON tickets FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON tickets FOR UPDATE USING (true);

CREATE POLICY "Enable read access for admin_config" ON admin_config FOR SELECT USING (true);
CREATE POLICY "Enable update access for admin_config" ON admin_config FOR UPDATE USING (true);
    `)
  }
}

createTablesViaSql()
