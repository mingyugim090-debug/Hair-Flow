-- 5면 사진 및 AI 스타일 추천 기능 추가 마이그레이션
-- consultations 테이블에 새로운 컬럼 추가

-- 1. 5면 사진 컬럼 추가 (left, right, top)
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS photo_left TEXT;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS photo_right TEXT;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS photo_top TEXT;

-- 2. 5면 사진 분석 결과 컬럼
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS five_view_analysis JSONB;

-- 3. AI 스타일 추천 결과 컬럼
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS style_recommendations JSONB;

-- 4. 선택한 스타일 기반 레시피 컬럼
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS style_based_recipe JSONB;

-- 5. 시술 후 타임라인 예측 컬럼
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS post_treatment_timeline JSONB;

-- 6. treatment_type enum 확장 (기존: 'analysis', 'timeline', 'recipe')
-- PostgreSQL에서는 enum에 새 값을 추가할 수 있습니다
-- 하지만 CHECK constraint를 사용한 경우 다시 정의해야 합니다

-- 기존 constraint 삭제
ALTER TABLE consultations DROP CONSTRAINT IF EXISTS consultations_treatment_type_check;

-- 새 constraint 추가 (기존 타입 + 새 타입)
ALTER TABLE consultations ADD CONSTRAINT consultations_treatment_type_check
    CHECK (treatment_type IN ('analysis', 'timeline', 'recipe', 'style-recommendation'));

-- 확인 쿼리 (선택사항)
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'consultations';
