-- customers: 디자이너별 고객 관리
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    designer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    memo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: 내가 등록한 고객만 접근
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_customers" ON customers FOR ALL
    USING (designer_id = auth.uid());

-- 인덱스
CREATE INDEX idx_customers_designer_id ON customers(designer_id);
