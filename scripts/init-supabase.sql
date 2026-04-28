-- Create tickets table
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

-- Create admin config table
CREATE TABLE IF NOT EXISTS admin_config (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  config_key VARCHAR(255) UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(255)
);

-- Insert default admin password
INSERT INTO admin_config (config_key, config_value, updated_by)
VALUES ('admin_password', '9134', 'system')
ON CONFLICT (config_key) DO UPDATE SET config_value = '9134', updated_at = CURRENT_TIMESTAMP;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_group_id ON tickets(group_id);
CREATE INDEX IF NOT EXISTS idx_tickets_phone ON tickets(phone);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);

-- Set up Row Level Security (optional, for production)
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;

-- Create policies for public read (for tickets) and admin only (for config)
CREATE POLICY "Allow public read tickets" ON tickets
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert tickets" ON tickets
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update tickets" ON tickets
  FOR UPDATE USING (true);

CREATE POLICY "Allow public read admin_config" ON admin_config
  FOR SELECT USING (true);
