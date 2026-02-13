-- Enterprise 플랜 지원 추가 마이그레이션
-- 기존 CHECK constraint를 삭제하고 'enterprise'를 포함한 새 constraint 추가

-- 1. profiles 테이블의 plan constraint 수정
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_plan_check
    CHECK (plan IN ('free', 'basic', 'enterprise'));

-- 2. subscriptions 테이블의 plan constraint 수정
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_check
    CHECK (plan IN ('basic', 'enterprise'));

-- 3. 기존에 'pro'로 저장된 데이터가 있다면 'enterprise'로 변경 (옵션)
-- UPDATE profiles SET plan = 'enterprise' WHERE plan = 'pro';
-- UPDATE subscriptions SET plan = 'enterprise' WHERE plan = 'pro';

-- 확인: 현재 스키마 체크
-- SELECT constraint_name, check_clause
-- FROM information_schema.check_constraints
-- WHERE constraint_name LIKE '%plan%';
