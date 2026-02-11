-- HairFlow Database Schema
-- Supabase SQL Editor에서 실행하세요

-- 1. profiles: 사용자 프로필 (Supabase Auth 연동)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    avatar_url TEXT,
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'pro')),
    daily_usage INT DEFAULT 0,
    last_usage_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. recipes: AI 시술 레시피 결과
CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reference_image_url TEXT,
    current_image_url TEXT,
    result JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. timelines: AI 미래 타임라인 결과
CREATE TABLE IF NOT EXISTS timelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    treatment_image_url TEXT,
    treatment_type TEXT NOT NULL CHECK (treatment_type IN ('color', 'cut', 'perm')),
    result_images JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. subscriptions: 구독 결제 정보
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    plan TEXT NOT NULL CHECK (plan IN ('basic', 'pro')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
    toss_order_id TEXT,
    toss_payment_key TEXT,
    amount INT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- RLS (Row Level Security) 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE timelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 본인 데이터만 접근
CREATE POLICY "own_profile_select" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "own_profile_insert" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "own_profile_update" ON profiles FOR UPDATE USING (id = auth.uid());

CREATE POLICY "own_recipes_select" ON recipes FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "own_recipes_insert" ON recipes FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "own_timelines_select" ON timelines FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "own_timelines_insert" ON timelines FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "own_subscriptions_select" ON subscriptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "own_subscriptions_insert" ON subscriptions FOR INSERT WITH CHECK (user_id = auth.uid());

-- 신규 사용자 자동 프로필 생성 트리거
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성 (이미 존재하면 삭제 후 재생성)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
