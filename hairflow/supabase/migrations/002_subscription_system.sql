-- HairFlow Subscription System Migration
-- Run this in Supabase SQL Editor

-- 1. Extend subscriptions table
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS is_canceled BOOLEAN DEFAULT FALSE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS billing_key TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS customer_key TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS retry_count INT DEFAULT 0;

-- Update existing rows: set current_period_end = expires_at, next_billing_date = expires_at
UPDATE subscriptions 
SET current_period_end = expires_at,
    next_billing_date = expires_at
WHERE current_period_end IS NULL AND expires_at IS NOT NULL;

-- 2. Create payments history table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  amount INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'success', -- 'success', 'failed'
  toss_payment_key TEXT,
  toss_order_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can insert payments" ON payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Index for cron queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_billing 
  ON subscriptions (next_billing_date, is_canceled, status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status 
  ON subscriptions (user_id, status);
