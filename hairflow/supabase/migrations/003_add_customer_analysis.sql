-- 003: 고객별 분석 기능 지원
-- timelines, recipes 테이블에 customer_id 컬럼 추가
-- treatment_type에 'analysis' 옵션 추가
-- Supabase Storage 버킷 생성

-- 1. timelines 테이블에 customer_id 컬럼 추가
ALTER TABLE timelines ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;

-- 2. recipes 테이블에 customer_id 컬럼 추가
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;

-- 3. treatment_type 제약조건 업데이트 ('analysis' 추가)
ALTER TABLE timelines DROP CONSTRAINT IF EXISTS timelines_treatment_type_check;
ALTER TABLE timelines ADD CONSTRAINT timelines_treatment_type_check
  CHECK (treatment_type IN ('color', 'cut', 'perm', 'analysis'));

-- 4. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_timelines_customer_id ON timelines(customer_id);
CREATE INDEX IF NOT EXISTS idx_recipes_customer_id ON recipes(customer_id);

-- 5. Storage 버킷 생성 (customer-photos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('customer-photos', 'customer-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Storage 정책: 경로 기반 보안 (designers/{auth.uid()}/{customerId}/{timestamp}.jpg)
-- 기존 정책 삭제 (이미 존재할 경우)
DROP POLICY IF EXISTS "auth_users_upload" ON storage.objects;
DROP POLICY IF EXISTS "public_read" ON storage.objects;
DROP POLICY IF EXISTS "auth_users_delete" ON storage.objects;
DROP POLICY IF EXISTS "designers_upload_own_folder" ON storage.objects;
DROP POLICY IF EXISTS "public_read_customer_photos" ON storage.objects;
DROP POLICY IF EXISTS "designers_delete_own_folder" ON storage.objects;

-- 업로드: 인증된 사용자가 자신의 uid 폴더 내에서만 업로드 가능
CREATE POLICY "designers_upload_own_folder" ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'customer-photos'
  AND (storage.foldername(name))[1] = 'designers'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- 조회: 퍼블릭 읽기 (이미지 표시용)
CREATE POLICY "public_read_customer_photos" ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'customer-photos');

-- 삭제: 인증된 사용자가 자신의 uid 폴더 내에서만 삭제 가능
CREATE POLICY "designers_delete_own_folder" ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'customer-photos'
  AND (storage.foldername(name))[1] = 'designers'
  AND (storage.foldername(name))[2] = auth.uid()::text
);
