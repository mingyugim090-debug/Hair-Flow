# HairFlow

헤어 디자이너 전용 AI 시술 레시피 & 미래 예측 서비스 (조코딩 x OpenAI x 프라이머 AI 해커톤)

## 기술 스택

| 영역 | 기술 |
|------|------|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| AI | OpenAI API (GPT-4o Vision + DALL-E 3) |
| DB/Auth | Supabase (PostgreSQL + Auth + Storage) |
| 결제 | Toss Payments (테스트 모드) |
| 배포 | Vercel |

## 폴더 구조

```
hairflow/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # 랜딩
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── (auth)/login/page.tsx       # 로그인
│   │   ├── (main)/
│   │   │   ├── layout.tsx              # 인증 레이아웃
│   │   │   ├── dashboard/page.tsx      # 대시보드
│   │   │   ├── recipe/page.tsx         # AI 시술 레시피
│   │   │   ├── timeline/page.tsx       # AI 미래 타임라인
│   │   │   └── pricing/page.tsx        # 구독 플랜
│   │   └── api/
│   │       ├── recipe/route.ts         # 레시피 API
│   │       ├── timeline/route.ts       # 타임라인 API
│   │       ├── auth/callback/route.ts  # OAuth 콜백
│   │       └── payment/route.ts        # 결제 API
│   ├── components/
│   │   ├── ui/                         # shadcn
│   │   ├── ImageUploader.tsx
│   │   ├── RecipeCard.tsx
│   │   ├── TimelineView.tsx
│   │   └── Navbar.tsx
│   ├── lib/
│   │   ├── openai.ts                   # OpenAI 클라이언트
│   │   ├── supabase/
│   │   │   ├── client.ts              # 브라우저
│   │   │   └── server.ts             # 서버
│   │   └── prompts.ts                 # AI 프롬프트
│   └── types/
│       └── index.ts
```

## 핵심 기능

### 1. AI 시술 레시피 (`/api/recipe`)
- **입력**: 레퍼런스 사진 + 현재 모발 사진 (base64)
- **처리**: GPT-4o Vision (두 사진 비교분석 → 구조화된 레시피 JSON)
- **출력**: `{ currentAnalysis, targetAnalysis, procedure, chemicals, steps, cautions }`

### 2. AI 미래 타임라인 (`/api/timeline`)
- **입력**: 시술 완료 사진 + 시술 종류(염색/커트/펌)
- **처리**: GPT-4o Vision (분석) → DALL-E 3 (변화 이미지 생성)
- **출력**: `[{ week, imageUrl, description }]` + 재방문 추천 시점

## DB 스키마 (Supabase)

```sql
-- 사용자 프로필
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    avatar_url TEXT,
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'pro')),
    daily_usage INT DEFAULT 0,
    last_usage_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 시술 레시피 결과
CREATE TABLE recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reference_image_url TEXT,
    current_image_url TEXT,
    result JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 타임라인 예측 결과
CREATE TABLE timelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    treatment_image_url TEXT,
    treatment_type TEXT NOT NULL CHECK (treatment_type IN ('color', 'cut', 'perm')),
    result_images JSONB NOT NULL,
    revisit_recommendation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE timelines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_profile" ON profiles FOR ALL USING (id = auth.uid());
CREATE POLICY "own_recipes" ON recipes FOR ALL USING (user_id = auth.uid());
CREATE POLICY "own_timelines" ON timelines FOR ALL USING (user_id = auth.uid());
```

## 환경변수

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
NEXT_PUBLIC_TOSS_CLIENT_KEY=
TOSS_SECRET_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 수익 모델

| 플랜 | 가격 | 내용 |
|------|------|------|
| Free | 0원 | 하루 3건 분석 |
| Basic | 월 19,900원 | 무제한 레시피 + 타임라인 |
| Pro | 월 39,900원 | 매장 전체 사용 + 약제 DB |

## 코딩 규칙

- 컴포넌트: `PascalCase.tsx` / 유틸: `camelCase.ts`
- `any` 타입 금지, 명시적 타입 정의
- 인라인 스타일 금지 (Tailwind 사용)
- API 응답: `{ data: T, error: null } | { data: null, error: { code: string, message: string } }`
- 이미지: 10MB 이하, jpg/png/webp만 허용
- 모바일 터치 영역 44px 이상
- 환경변수 하드코딩 금지
- Supabase 쿼리 에러 핸들링 필수
