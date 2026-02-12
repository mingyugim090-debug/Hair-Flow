-- subscriptions: 구독 결제 기록
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    plan TEXT NOT NULL CHECK (plan IN ('basic', 'pro')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
    toss_order_id TEXT NOT NULL,
    toss_payment_key TEXT NOT NULL,
    amount INTEGER NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_subscriptions" ON subscriptions FOR ALL
    USING (user_id = auth.uid());

-- 인덱스
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_recipes_user_id ON recipes(user_id);
CREATE INDEX idx_timelines_user_id ON timelines(user_id);
