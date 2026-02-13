-- 008: treatment_type에 'timeline' 추가
-- 타임라인 예측 기능 지원을 위해 treatment_type에 'timeline' 옵션 추가

ALTER TABLE timelines DROP CONSTRAINT IF EXISTS timelines_treatment_type_check;
ALTER TABLE timelines ADD CONSTRAINT timelines_treatment_type_check
  CHECK (treatment_type IN ('color', 'cut', 'perm', 'analysis', 'timeline'));
