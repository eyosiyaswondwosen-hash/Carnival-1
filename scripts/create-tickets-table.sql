-- Create tickets table for Carnival
CREATE TABLE IF NOT EXISTS tickets (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_amount INTEGER NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cbe', 'telebirr')),
  payment_screenshot TEXT,
  screenshot_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  group_id TEXT,
  group_total INTEGER,
  ticket_index INTEGER,
  scanned_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_group_id ON tickets(group_id);
CREATE INDEX IF NOT EXISTS idx_tickets_phone ON tickets(phone);

-- Create a function to get ticket count
CREATE OR REPLACE FUNCTION get_ticket_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM tickets WHERE status = 'confirmed');
END;
$$ LANGUAGE plpgsql;

-- Create a view for dashboard stats
CREATE OR REPLACE VIEW ticket_stats AS
SELECT
  COUNT(*) as total_tickets,
  COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_tickets,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tickets,
  COUNT(CASE WHEN scanned_at IS NOT NULL THEN 1 END) as scanned_tickets,
  SUM(CASE WHEN status = 'confirmed' THEN total_amount ELSE 0 END) as total_revenue
FROM tickets;
