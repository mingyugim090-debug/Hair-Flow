-- Storage 버킷 생성 (이미 존재하면 무시)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hairflow',
  'hairflow',
  true,
  10485760,  -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 인증된 사용자 업로드 허용 (자신의 폴더만)
CREATE POLICY "designers_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'hairflow'
    AND (storage.foldername(name))[1] = 'designers'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- 인증된 사용자 자신의 파일 수정 허용 (upsert 용)
CREATE POLICY "designers_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'hairflow'
    AND (storage.foldername(name))[1] = 'designers'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- 인증된 사용자 자신의 파일 삭제 허용
CREATE POLICY "designers_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'hairflow'
    AND (storage.foldername(name))[1] = 'designers'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- 모든 사용자 공개 조회 허용 (포트폴리오 공개 페이지용)
CREATE POLICY "public_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'hairflow');
