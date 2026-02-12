-- 004: 프로필 설정 필드 추가 (shop_name, designer_name)

-- 1. profiles 테이블에 매장명 컬럼 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS shop_name TEXT;

-- 2. profiles 테이블에 디자이너명 컬럼 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS designer_name TEXT;
