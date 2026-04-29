## Supabase Setup Guide for Lebawi Carnival Tickets

Your application is configured to use Supabase for persistent data storage. Follow these steps to complete the setup:

### Step 1: Access Your Supabase Project

1. Go to https://supabase.com/dashboard
2. Log in to your account
3. Select your project (should show your Supabase URL)

### Step 2: Create the Required Tables

Navigate to the **SQL Editor** in your Supabase dashboard and run the following SQL script:

```sql
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

-- Enable RLS (Row Level Security)
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;

-- Create policies for tickets table
CREATE POLICY "Enable read access for all users" ON tickets FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON tickets FOR UPDATE USING (true);

-- Create policies for admin_config table
CREATE POLICY "Enable read access for admin_config" ON admin_config FOR SELECT USING (true);
CREATE POLICY "Enable update access for admin_config" ON admin_config FOR UPDATE USING (true);
```

### Step 3: Verify the Setup

After running the SQL:

1. Go to the **Table Editor** section in Supabase
2. You should see two tables:
   - `tickets` - Contains all ticket purchase records
   - `admin_config` - Contains the admin password

### Step 4: Your Supabase Credentials (Already Configured)

The application already has your Supabase credentials configured:

- **Supabase URL:** `https://cydeiefuyejxtjqpqxlt.supabase.co`
- **Anon Key:** (configured in environment)

### How It Works

- **Ticket Storage:** When users purchase tickets, all data is automatically saved to the `tickets` table in Supabase
- **Admin Password:** The admin password (9134) is stored in the `admin_config` table and loaded when the app starts
- **Data Persistence:** All data is persistent and will be available across deployments and app restarts
- **Admin Dashboard:** The admin dashboard displays real-time data from the Supabase database

### Testing the Integration

1. Purchase a test ticket on your app
2. Check the Supabase Table Editor → `tickets` to verify the data was saved
3. Log into the admin dashboard with password: `9134`
4. Verify the ticket appears in the admin dashboard

### Troubleshooting

If data isn't appearing:

1. Check that the tables were created successfully in the Table Editor
2. Verify RLS policies are enabled
3. Check browser console for any errors (F12 → Console tab)
4. Ensure your Supabase project is active and not paused

### Environment Variables (Already Set)

```
NEXT_PUBLIC_SUPABASE_URL=https://cydeiefuyejxtjqpqxlt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your anon key]
```

These are already configured in your Vercel project settings.
