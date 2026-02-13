-- Enterprise 플랜 지원 추가 마이그레이션
-- 기존 'pro' 데이터를 'enterprise'로 변경 후 CHECK constraint 수정

-- 1. profiles 테이블 처리
-- 1-1. 기존 constraint 삭제
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;

-- 1-2. 기존 'pro' 데이터를 'enterprise'로 변경
UPDATE profiles SET plan = 'enterprise' WHERE plan = 'pro';

-- 1-3. 새 constraint 추가
ALTER TABLE profiles ADD CONSTRAINT profiles_plan_check
    CHECK (plan IN ('free', 'basic', 'enterprise'));

-- 2. subscriptions 테이블 처리
-- 2-1. 기존 constraint 삭제
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;

-- 2-2. 기존 'pro' 데이터를 'enterprise'로 변경
UPDATE subscriptions SET plan = 'enterprise' WHERE plan = 'pro';

-- 2-3. 새 constraint 추가
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_check
    CHECK (plan IN ('basic', 'enterprise'));

-- 확인 쿼리 (선택사항)
-- SELECT plan, COUNT(*) FROM profiles GROUP BY plan;
-- SELECT plan, COUNT(*) FROM subscriptions GROUP BY plan;
