-- 시술 회차 (Consultation) 테이블 추가
-- 각 고객의 시술 이력을 회차별로 관리

CREATE TABLE IF NOT EXISTS consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    designer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    session_number INT NOT NULL DEFAULT 1, -- 회차 (1차, 2차...)
    treatment_type TEXT NOT NULL CHECK (treatment_type IN ('analysis', 'timeline', 'recipe')),
    
    -- 3면 사진 URL (앞/뒤/옆)
    photo_front TEXT,
    photo_back TEXT,
    photo_side TEXT,
    
    -- 분석 결과 (JSONB)
    analysis_result JSONB, -- ThreeViewAnalysisResult
    recipe_result JSONB, -- CustomerAnalysisResult
    timeline_prediction JSONB, -- TimelinePredictionResult
    
    -- 시술 노트
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 약제 배합 기록 테이블
CREATE TABLE IF NOT EXISTS chemical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    brand TEXT NOT NULL,
    product_name TEXT NOT NULL,
    ratio TEXT NOT NULL,
    mixing_notes TEXT,
    application_method TEXT,
    processing_time TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chemical_records ENABLE ROW LEVEL SECURITY;

-- consultations: 본인이 디자이너인 경우만 접근
CREATE POLICY "own_consultations_select" ON consultations FOR SELECT
    USING (designer_id = auth.uid());

CREATE POLICY "own_consultations_insert" ON consultations FOR INSERT
    WITH CHECK (designer_id = auth.uid());

CREATE POLICY "own_consultations_update" ON consultations FOR UPDATE
    USING (designer_id = auth.uid());

CREATE POLICY "own_consultations_delete" ON consultations FOR DELETE
    USING (designer_id = auth.uid());

-- chemical_records: 해당 consultation의 디자이너만 접근
CREATE POLICY "own_chemical_records" ON chemical_records FOR ALL
    USING (
        consultation_id IN (
            SELECT id FROM consultations WHERE designer_id = auth.uid()
        )
    );

-- 인덱스 생성
CREATE INDEX idx_consultations_customer ON consultations(customer_id);
CREATE INDEX idx_consultations_designer ON consultations(designer_id);
CREATE INDEX idx_consultations_created_at ON consultations(created_at DESC);
CREATE INDEX idx_chemical_records_consultation ON chemical_records(consultation_id);
