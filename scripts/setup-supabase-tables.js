import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cydeiefuyejxtjqpqxlt.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5ZGVpZWZ1eWVqeHRqcXBxeGx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNzMyNDYsImV4cCI6MjA5Mjk0OTI0Nn0.IcuYKSfJQVqZS7WdFCsIs6ufZYiuMgatLN86Qu0HKUY'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function setupTables() {
  console.log('Starting Supabase setup...\n')

  try {
    // Check if admin_config table exists
    console.log('Checking admin_config table...')
    const { data: adminData, error: adminError } = await supabase
      .from('admin_config')
      .select('*')
      .limit(1)

    if (adminError && adminError.code === 'PGRST116') {
      console.log('admin_config table does not exist. Creating...')
      // Table doesn't exist, we need to create it via SQL
      console.log('Please create the admin_config table manually in Supabase SQL editor:')
      console.log(`
CREATE TABLE admin_config (
  id INT PRIMARY KEY DEFAULT 1,
  admin_password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO admin_config (id, admin_password) VALUES (1, '9134');

ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON admin_config FOR SELECT USING (true);
CREATE POLICY "Enable update access for all users" ON admin_config FOR UPDATE USING (true);
      `)
    } else if (adminError) {
      console.error('Error checking admin_config:', adminError)
    } else {
      console.log('admin_config table exists')
    }

    // Check if tickets table exists
    console.log('\nChecking tickets table...')
    const { data: ticketsData, error: ticketsError } = await supabase
      .from('tickets')
      .select('*')
      .limit(1)

    if (ticketsError && ticketsError.code === 'PGRST116') {
      console.log('tickets table does not exist. Creating...')
      console.log('Please create the tickets table manually in Supabase SQL editor:')
      console.log(`
CREATE TABLE tickets (
  id BIGINT PRIMARY KEY DEFAULT nextval('tickets_id_seq'::regclass),
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

CREATE SEQUENCE tickets_id_seq START WITH 1001;

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON tickets FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON tickets FOR UPDATE USING (true);
      `)
    } else if (ticketsError) {
      console.error('Error checking tickets:', ticketsError)
    } else {
      console.log('tickets table exists')
      console.log(`Current ticket count: ${ticketsData?.length || 0}`)
    }

    console.log('\nSetup check complete!')

  } catch (error) {
    console.error('Setup error:', error)
  }
}

setupTables()
