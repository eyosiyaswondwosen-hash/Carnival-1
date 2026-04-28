# Supabase Database Setup Instructions

## Step 1: Create Tables in Supabase

Go to https://app.supabase.com and navigate to the SQL Editor. Run the following SQL commands:

### Create Admin Config Table
```sql
CREATE TABLE IF NOT EXISTS admin_config (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  config_key VARCHAR(255) UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(255)
);

INSERT INTO admin_config (config_key, config_value, updated_by)
VALUES ('admin_password', '9134', 'system')
ON CONFLICT (config_key) DO UPDATE SET config_value = '9134', updated_at = CURRENT_TIMESTAMP;
```

### Create Tickets Table
```sql
CREATE TABLE IF NOT EXISTS tickets (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  payment_method VARCHAR(50) NOT NULL,
  payment_screenshot TEXT,
  screenshot_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  group_id VARCHAR(100),
  group_total INT DEFAULT 1,
  ticket_index INT DEFAULT 1,
  total_amount INT DEFAULT 600,
  quantity INT DEFAULT 1,
  scanned_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_group_id ON tickets(group_id);
CREATE INDEX IF NOT EXISTS idx_tickets_phone ON tickets(phone);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
```

### Enable RLS (Row Level Security) - Optional but Recommended
```sql
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read tickets" ON tickets
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert tickets" ON tickets
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update tickets" ON tickets
  FOR UPDATE USING (true);

CREATE POLICY "Allow public read admin_config" ON admin_config
  FOR SELECT USING (true);
```

## Step 2: Verify Environment Variables

Make sure these environment variables are set in your Vercel project:
- NEXT_PUBLIC_SUPABASE_URL=https://cydeiefuyejxtjqpqxlt.supabase.co
- NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5ZGVpZWZ1eWVqeHRqcXBxeGx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNzMyNDYsImV4cCI6MjA5Mjk0OTI0Nn0.IcuYKSfJQVqZS7WdFCsIs6ufZYiuMgatLN86Qu0HKUY

## Step 3: Test the Connection

Run the test script:
```bash
npm run test:supabase
```

## Carnival Ticket App Configuration

- Admin Password: **9134** (stored in admin_config table)
- Ticket Price: 600 Birr
- Total Ticket Capacity: 1000 tickets
- Database: Supabase (cydeiefuyejxtjqpqxlt)
