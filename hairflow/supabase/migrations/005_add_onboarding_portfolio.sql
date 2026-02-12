-- 온보딩 & 포트폴리오 관련 컬럼 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS specialties TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_onboarded BOOLEAN DEFAULT FALSE;

-- 타임라인 테이블에 is_public 컬럼 추가 (포트폴리오 공개용)
ALTER TABLE timelines ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

-- 포트폴리오 공개 조회를 위한 RLS 정책 추가
-- 비로그인 사용자도 is_public=true인 타임라인을 조회할 수 있도록
CREATE POLICY IF NOT EXISTS "public_timelines_select" ON timelines
  FOR SELECT USING (is_public = TRUE);

-- 비로그인 사용자도 디자이너 프로필을 조회할 수 있도록
CREATE POLICY IF NOT EXISTS "public_profiles_select" ON profiles
  FOR SELECT USING (TRUE);
