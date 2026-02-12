-- 포트폴리오 작품 관리용 컬럼 추가
-- portfolio_works: [{ url, caption, createdAt }] 형태의 JSONB 배열
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS portfolio_works JSONB DEFAULT '[]'::jsonb;

-- Storage 버킷 정책: designers 폴더 접근 (avatar + works)
-- Supabase Storage에서 designers/{uid}/ 경로 사용
