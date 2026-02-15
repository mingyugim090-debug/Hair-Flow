# HairFlow

헤어 디자이너 전용 AI 시술 레시피 & 미래 예측 서비스 (조코딩 x OpenAI x 프라이머 AI 해커톤)

---

## 📊 프로젝트 현황 (2025년 2월 15일 기준)

**개발 단계**: MVP 핵심 기능 구현 완료 (약 70%)

**완료된 항목:**
- ✅ Luxury Salon Aesthetic UI 테마 전면 적용
- ✅ Google OAuth 인증 시스템
- ✅ Toss Payments 결제 연동
- ✅ 사용량 제한 시스템 (Free 3건/일)
- ✅ 고객 관리 CRUD (생성/조회/수정/삭제)
- ✅ 5면 사진 분석 AI (GPT-4o Vision)
- ✅ Enterprise 플랜 대시보드 (Mock 데이터)

**진행 중/미완료:**
- 🟡 고객별 AI 분석 결과 UI (API 구현됨, UI 미구현)
- 🟡 스타일 추천 및 레시피 생성 UI
- 🟡 시술 후 타임라인 예측 UI
- 🟡 포트폴리오 관리 UI
- 🟡 약제 기록 UI
- ❌ Enterprise 스태프 관리 (실제 데이터 연동)

---

## 기술 스택

| 영역 | 기술 | 상태 |
|------|------|------|
| Framework | Next.js 14 (App Router) + TypeScript | ✅ |
| Styling | Tailwind CSS 4 + shadcn/ui | ✅ |
| Animation | Framer Motion | ✅ |
| AI | OpenAI API (GPT-4o Vision + DALL-E 3) | ✅ |
| DB/Auth | Supabase (PostgreSQL + Auth + Storage) | ✅ |
| 결제 | Toss Payments (테스트 모드) | ✅ |
| 배포 | Vercel | ✅ |

---

## 폴더 구조 (실제 구현 기준)

```
hairflow/
├── src/
│   ├── app/
│   │   ├── page.tsx                              # ✅ 랜딩 페이지
│   │   ├── layout.tsx                            # ✅ Root Layout
│   │   ├── globals.css                           # ✅ Luxury 테마 스타일
│   │   │
│   │   ├── (auth)/
│   │   │   └── login/page.tsx                    # ✅ Google OAuth 로그인
│   │   │
│   │   ├── (main)/                               # 인증 필요 영역
│   │   │   ├── layout.tsx                        # ✅ Luxury 배경 + Navbar
│   │   │   ├── dashboard/page.tsx                # ✅ 대시보드
│   │   │   ├── customers/
│   │   │   │   ├── page.tsx                      # ✅ 고객 목록
│   │   │   │   └── [id]/page.tsx                 # 🟡 고객 상세 (부분 구현)
│   │   │   ├── pricing/
│   │   │   │   ├── page.tsx                      # ✅ 요금제
│   │   │   │   └── success/page.tsx              # ✅ 결제 성공
│   │   │   ├── onboarding/page.tsx               # ✅ 온보딩
│   │   │   ├── settings/page.tsx                 # ❌ 미구현
│   │   │   ├── recipe/page.tsx                   # ⚠️ /customers로 리다이렉트
│   │   │   └── timeline/page.tsx                 # ⚠️ /customers로 리다이렉트
│   │   │
│   │   └── api/
│   │       ├── auth/callback/route.ts            # ✅ OAuth 콜백
│   │       ├── onboarding/route.ts               # ✅ 온보딩 저장
│   │       ├── profile/route.ts                  # ✅ 프로필 CRUD
│   │       ├── payment/route.ts                  # ✅ Toss Payments
│   │       ├── customers/
│   │       │   ├── route.ts                      # ✅ 고객 목록/생성
│   │       │   └── [id]/
│   │       │       ├── route.ts                  # ✅ 고객 조회/수정/삭제
│   │       │       ├── five-view-analysis/route.ts   # ✅ 5면 사진 분석
│   │       │       ├── style-recommendations/route.ts  # 🟡 API만
│   │       │       ├── style-to-recipe/route.ts       # 🟡 API만
│   │       │       ├── post-treatment-timeline/route.ts # 🟡 API만
│   │       │       └── chemicals/route.ts             # 🟡 API만
│   │       ├── portfolio/[id]/route.ts           # 🟡 API만
│   │       └── ai-test/route.ts                  # 개발용
│   │
│   ├── components/
│   │   ├── ui/                                   # shadcn/ui
│   │   ├── Navbar.tsx                            # ✅ 네비게이션
│   │   ├── OnboardingFlow.tsx                    # ✅ 온보딩
│   │   └── FiveViewUploader.tsx                  # ✅ 5면 사진 업로드
│   │
│   ├── lib/
│   │   ├── openai.ts                             # ✅ OpenAI 클라이언트
│   │   ├── supabase/
│   │   │   ├── client.ts                         # ✅ 브라우저
│   │   │   └── server.ts                         # ✅ 서버
│   │   └── utils.ts
│   │
│   └── types/
│       └── index.ts                              # ✅ 타입 정의
│
├── supabase/
│   └── migrations/                               # 15개 마이그레이션
│       ├── 001_create_subscriptions.sql
│       ├── 002_create_customers.sql
│       ├── ...
│       └── 20250215_add_five_view_and_style_features.sql
│
└── tailwind.config.ts
```

---

## 🎨 Luxury Salon Aesthetic 디자인 시스템

### 색상 팔레트
| 색상명 | HEX | 용도 |
|--------|-----|------|
| Cream | `#F7F3EF` | 라이트 모드 배경 |
| Charcoal | `#2C2926` | 다크 모드 배경, 메인 텍스트 |
| Gold | `#D4B37F` | 강조색, CTA, 아이콘 |
| Gold Light | `#E5CC9E` | 하이라이트, 호버 |
| Warm Brown | `#9A7E6D` | 서브 텍스트, 보더 |
| Soft Beige | `#EDE4DA` | 카드 배경 |
| Deep Brown | `#3D2B1F` | 다크 강조 |

### 타이포그래피
- **본문**: Noto Sans KR (font-weight: 300-700)
- **제목**: Cormorant Garamond (font-weight: 300-600, italic 활용)
- **섹션 라벨**: 대문자, letter-spacing: 4-6px

### 주요 스타일 클래스
```css
.glass-luxury          /* 글래스모피즘 (blur + 반투명) */
.glass-luxury-dark     /* 다크 모드 글래스모피즘 */
.shadow-luxury         /* 금색 톤 그림자 */
.shadow-luxury-sm      /* 작은 금색 그림자 */
.hover-gold-glow       /* 호버 시 금색 테두리 글로우 */
.font-heading          /* Cormorant 세리프 폰트 */
.section-label         /* 섹션 라벨 스타일 */
```

### 배경 효과 (globals.css + layout.tsx)
- Radial gradient (여러 층, 금색 톤)
- SVG geometric wireframe (투명도 0.015)
- SVG flowing curves (금색, 투명도 0.02)
- Subtle noise texture (20px 단위)

---

## 데이터베이스 스키마 (Supabase)

### 전체 테이블 목록
```
profiles          - 디자이너 프로필
subscriptions     - 구독 정보
customers         - 고객 정보
consultations     - 시술 회차 기록 (핵심)
chemical_records  - 약제 배합 기록

recipes (legacy)  - 초기 레시피 테이블
timelines (legacy)- 초기 타임라인 테이블
```

### 테이블 상세

```sql
-- profiles: 디자이너 프로필
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    designer_name TEXT,                      -- 온보딩에서 입력
    avatar_url TEXT,
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'enterprise')),
    daily_usage INT DEFAULT 0,
    last_usage_date DATE,

    -- 온보딩 정보
    salon_name TEXT,
    specialties TEXT[],                      -- 전문 분야 배열
    instagram TEXT,
    bio TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- subscriptions: 구독 정보
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    plan TEXT NOT NULL CHECK (plan IN ('basic', 'enterprise')),
    amount INT NOT NULL,
    payment_key TEXT,
    order_id TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled'))
);

-- customers: 고객 정보
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    designer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    memo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- consultations: 시술 회차 기록 (핵심 테이블)
CREATE TABLE consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    designer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    session_number INT NOT NULL,             -- 1회차, 2회차...
    treatment_type TEXT,                     -- 'color', 'cut', 'perm' 등

    -- 5면 사진 (Supabase Storage URL)
    photo_front TEXT,
    photo_back TEXT,
    photo_left TEXT,
    photo_right TEXT,
    photo_top TEXT,

    -- AI 분석 결과 (JSONB)
    five_view_analysis JSONB,                -- 5면 종합 분석
    style_recommendations JSONB,             -- AI 추천 스타일 목록
    style_based_recipe JSONB,                -- 선택한 스타일의 시술 레시피
    post_treatment_timeline JSONB,           -- 시술 후 변화 예측

    -- Legacy 필드 (기존 호환성)
    analysis_result JSONB,
    recipe_result JSONB,
    timeline_prediction JSONB,

    notes TEXT,                              -- 디자이너 메모
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- chemical_records: 약제 배합 기록
CREATE TABLE chemical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    brand TEXT NOT NULL,
    product_name TEXT NOT NULL,
    amount TEXT,
    mixing_ratio TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS (Row Level Security) 정책
모든 테이블에서 본인 데이터만 접근 가능 (`designer_id = auth.uid()` 조건)

### 인덱스
```sql
CREATE INDEX idx_consultations_customer ON consultations(customer_id);
CREATE INDEX idx_consultations_designer ON consultations(designer_id);
CREATE INDEX idx_consultations_created ON consultations(created_at DESC);
CREATE INDEX idx_chemical_records_consultation ON chemical_records(consultation_id);
```

---

## 🔌 API 엔드포인트

### 인증
- `POST /api/auth/callback` - ✅ Google OAuth 콜백

### 프로필
- `GET /api/profile` - ✅ 프로필 조회
- `POST /api/profile` - ✅ 프로필 수정
- `POST /api/onboarding` - ✅ 온보딩 정보 저장

### 고객 관리
- `GET /api/customers` - ✅ 고객 목록 (검색 지원)
- `POST /api/customers` - ✅ 고객 생성
- `GET /api/customers/[id]` - ✅ 고객 상세
- `PUT /api/customers/[id]` - ✅ 고객 수정
- `DELETE /api/customers/[id]` - ✅ 고객 삭제

### AI 분석 (고객별)

#### ✅ 5면 사진 분석
**엔드포인트**: `POST /api/customers/[id]/five-view-analysis`
- **입력**: FormData (5장 이미지 - front/back/left/right/top)
- **처리**:
  1. Supabase Storage에 업로드 (`customer-photos` 버킷)
  2. GPT-4o Vision으로 5면 종합 분석
  3. consultations 테이블에 저장
- **출력**: 5면 종합 분석 JSON (overallCondition, damageLevel, recommendedTreatments, detailedAnalysis)
- **사용량 제한**: Free 플랜은 하루 3건

#### 🟡 AI 스타일 추천
**엔드포인트**: `POST /api/customers/[id]/style-recommendations`
- **상태**: API 구현됨, UI 미구현
- **입력**: consultation_id (5면 분석 완료 필수)
- **출력**: 추천 스타일 3-5개 (name, description, difficulty, estimatedTime, suitability)

#### 🟡 스타일 기반 레시피
**엔드포인트**: `POST /api/customers/[id]/style-to-recipe`
- **상태**: API 구현됨, UI 미구현
- **입력**: consultation_id + 선택한 스타일명
- **출력**: 단계별 시술 레시피 (steps, totalTime, difficulty, cautions)

#### 🟡 시술 후 타임라인
**엔드포인트**: `POST /api/customers/[id]/post-treatment-timeline`
- **상태**: API 구현됨, UI 미구현
- **입력**: consultation_id + treatment_type
- **처리**: GPT-4o 분석 + DALL-E 3 이미지 생성 (2주/4주/8주)
- **출력**: 타임라인 배열 (week, imageUrl, description, careAdvice) + revisitRecommendation

#### 🟡 약제 기록
**엔드포인트**: `POST /api/customers/[id]/chemicals`
- **상태**: API 구현됨, UI 미구현
- **입력**: consultation_id + 약제 정보
- **출력**: 저장된 약제 기록

### 결제
- `POST /api/payment` - ✅ Toss Payments 승인
  - 결제 금액 검증
  - 구독 정보 저장 (subscriptions 테이블)
  - 프로필 플랜 업그레이드

### 포트폴리오
- `GET /api/portfolio/[id]` - 🟡 포트폴리오 조회 (API만)
- `POST /api/portfolio/[id]` - 🟡 작품 추가 (API만)

---

## 핵심 기능 구현 현황

### ✅ 1. 5면 모발 사진 분석 (구현 완료)
**페이지**: `/customers/[id]`
**API**: `POST /api/customers/[id]/five-view-analysis`

- **입력**: FormData로 5장 이미지 (앞/뒤/좌/우/윗)
- **처리**:
  1. Supabase Storage에 업로드 (버킷: `customer-photos`)
  2. GPT-4o Vision으로 5면 종합 분석
  3. consultations 테이블에 저장 (five_view_analysis JSONB)
- **출력**:
  ```json
  {
    "overallCondition": {
      "score": 75,
      "summary": "전반적으로 건강한 모발 상태..."
    },
    "damageLevel": "medium",
    "recommendedTreatments": ["단백질 트리트먼트", "두피 케어"],
    "detailedAnalysis": {
      "front": {
        "scalp": "정상, 유분 균형",
        "hair": "중간 손상, 끝부분 갈라짐"
      },
      // ... 나머지 4면
    }
  }
  ```
- **사용량 제한**: Free 플랜은 하루 3건

### 🟡 2. AI 스타일 추천 (API만 구현)
**페이지**: 미구현
**API**: `POST /api/customers/[id]/style-recommendations`

- **입력**: consultation_id (5면 분석 완료 필수)
- **처리**: GPT-4o Vision으로 어울리는 스타일 3-5개 추천
- **출력**:
  ```json
  {
    "recommendations": [
      {
        "name": "볼륨 펌 + 애쉬 그레이",
        "description": "고객의 타원형 얼굴형과 가는 모발에 적합...",
        "difficulty": "medium",
        "estimatedTime": "3-4시간",
        "suitability": 85
      }
    ]
  }
  ```

### 🟡 3. 스타일 기반 시술 레시피 (API만 구현)
**페이지**: 미구현
**API**: `POST /api/customers/[id]/style-to-recipe`

- **입력**: consultation_id + 선택한 스타일명
- **처리**: GPT-4o로 단계별 시술 레시피 생성
- **출력**:
  ```json
  {
    "steps": [
      {
        "order": 1,
        "category": "preparation",
        "title": "두피 보호",
        "chemicals": [
          {
            "name": "두피 보호제",
            "brand": "웰라",
            "amount": "적당량"
          }
        ],
        "duration": "10분",
        "instructions": "두피 전체에 골고루 도포..."
      }
    ],
    "totalTime": "3시간",
    "difficulty": "medium",
    "cautions": ["민감성 두피 주의", "탈색 후 24시간 이내 재시술 금지"]
  }
  ```

### 🟡 4. 시술 후 타임라인 예측 (API만 구현)
**페이지**: 미구현
**API**: `POST /api/customers/[id]/post-treatment-timeline`

- **입력**: consultation_id + treatment_type ('color', 'cut', 'perm')
- **처리**:
  1. GPT-4o로 시간 경과별 변화 예측
  2. DALL-E 3로 2주/4주/8주 이미지 생성
- **출력**:
  ```json
  {
    "timeline": [
      {
        "week": 2,
        "imageUrl": "https://oaidalleapiprodscus.blob.core.windows.net/...",
        "description": "색상 유지율 85%, 광택 유지",
        "careAdvice": "색상 보호 샴푸 사용 권장"
      },
      { "week": 4, ... },
      { "week": 8, ... }
    ],
    "revisitRecommendation": "6-8주 후 재방문 권장"
  }
  ```

---

## 수익 모델 & 플랜

| 플랜 | 가격 | 내용 |
|------|------|------|
| **Free** | 0원 | 하루 3건 분석 |
| **Basic** | 월 19,900원 | 무제한 AI 분석 + 시술 히스토리 + 약제 DB |
| **Enterprise** | 월 39,900원 | Basic 모든 기능 + 스태프 10명 연동 + 매장 분석 리포트 |

---

## 🚀 다음 작업 우선순위

### Phase 1: 고객별 AI 분석 결과 UI 구현 (높음)
**목표**: 이미 구현된 API를 활용하여 사용자에게 결과를 보여주는 UI 완성

1. **`/customers/[id]` 페이지 개선**
   - [ ] 5면 분석 결과 표시 섹션 추가
   - [ ] AI 스타일 추천 결과 카드 UI
   - [ ] 선택한 스타일의 레시피 표시 UI
   - [ ] 시술 후 타임라인 이미지 갤러리

2. **워크플로우 연결**
   - [ ] 5면 분석 → 스타일 추천 자동 호출
   - [ ] 스타일 선택 → 레시피 생성 버튼
   - [ ] 레시피 확인 후 → 타임라인 예측 버튼
   - [ ] 모든 단계를 consultation에 저장

3. **UX 개선**
   - [ ] 분석 진행 중 로딩 UI (스켈레톤)
   - [ ] 분석 완료 애니메이션
   - [ ] 결과 PDF/이미지 다운로드 기능

### Phase 2: Enterprise 기능 실제 데이터 연동 (중간)
1. **스태프 관리 시스템**
   - [ ] `staff` 테이블 생성 (마이그레이션)
   - [ ] `/settings` 페이지에서 스태프 초대/관리
   - [ ] 대시보드에 실제 스태프 활동 데이터 표시

2. **매장 분석 리포트**
   - [ ] 일별/주별/월별 분석 건수 차트
   - [ ] 인기 시술 통계
   - [ ] 고객 재방문율 추적

### Phase 3: 포트폴리오 & 약제 관리 (낮음)
1. **포트폴리오 UI**
   - [ ] `/portfolio` 페이지 생성
   - [ ] 작품 업로드 및 갤러리
   - [ ] Before/After 비교 UI

2. **약제 기록 UI**
   - [ ] consultation 상세 페이지에 약제 섹션
   - [ ] 약제 DB 검색/자동완성
   - [ ] 배합 비율 계산기

### Phase 4: 성능 최적화 & 배포 준비
- [ ] 이미지 최적화 (next/image, WebP)
- [ ] API 응답 캐싱 (React Query)
- [ ] Lighthouse 점수 90+ 달성
- [ ] 프로덕션 환경 변수 설정

---

## ⚠️ 알려진 이슈 & 기술 부채

### 버그
- [ ] `/recipe`, `/timeline` 페이지가 리다이렉트만 함 (독립 페이지로 구현 or 삭제 결정 필요)
- [ ] Enterprise 대시보드의 스태프 활동이 Mock 데이터 (실제 연동 필요)
- [ ] 고객 검색에서 전화번호/메모 검색 미지원 (이름만 가능)

### 성능
- [ ] 5면 사진 업로드 시 프로그레스 바 없음 (사용자가 대기 시간 모름)
- [ ] AI 분석 응답이 느림 (GPT-4o Vision 응답 시간 10-30초)
- [ ] 대시보드 최근 고객 목록에서 각 고객마다 timeline 쿼리 (N+1 문제)

### 기술 부채
- [ ] `types/index.ts`에 모든 타입이 몰려있음 (분리 필요)
- [ ] API 라우트에서 에러 핸들링이 불일치 (통일된 형식 필요)
- [ ] Supabase Storage 버킷 정책 검토 (public 설정 확인)
- [ ] 환경변수 검증 로직 없음 (빌드 타임 체크 추가)

### 보안
- [ ] 이미지 업로드 시 파일 타입 검증만 있음 (실제 내용 검증 필요)
- [ ] Rate limiting 미구현 (API 남용 가능)
- [ ] CORS 설정 검토

---

## 📝 최근 개발 히스토리

### 2025-02-15 (최신)
**커밋**: `cc8ae71` - Enterprise 플랜 매장 현황 대시보드 추가 및 Luxury UI 개선

**변경사항**:
- Enterprise 플랜 전용 "스태프 활동 현황" 대시보드 추가 (Mock 데이터)
- Glassmorphism 효과 강화 (그라데이션 + shadow)
- 레이아웃에 금색 곡선 SVG 배경 추가
- 대시보드 빈 상태 메시지 개선
- 반응형 UI 개선

### 2026-02-15
**커밋**: `pending` - 랜딩페이지 About 섹션 디자인 수정

**변경사항**:
- About 섹션의 가위 이미지 제거
- 텍스트 레이아웃 중앙 정렬로 변경

**수정 파일**:
- `src/app/page.tsx`

**수정 파일**:
- `src/app/(main)/dashboard/page.tsx`
- `src/app/(main)/layout.tsx`
- `src/app/globals.css`

### 2025-02-14
**커밋**: `fb1dbb4` - 랜딩페이지 요금제 링크 제거 + 요금제 페이지 버튼 정렬

**변경사항**:
- 랜딩페이지에서 요금제 섹션 완전 제거
- `/pricing` 페이지에 구매 버튼 추가
- Enterprise 다운그레이드 방지 로직

### 2025-02-13
**커밋**: `390e35c` - 로그인 버튼 클릭 불가 문제 해결

**변경사항**:
- `.hover-gold-glow::before`에 `pointer-events: none` 추가
- 클릭 이벤트가 SVG/배경을 통과하도록 수정

### 2025-02-12
**커밋**: `3a5ab22` - Luxury Salon Aesthetic 테마 전면 개편

**변경사항**:
- 전체 색상 팔레트를 고급 살롱 느낌으로 변경
- 글래스모피즘, 금색 강조, 세리프 폰트 적용
- 배경에 기하학 패턴 및 그라데이션 추가
- 모든 페이지 UI 리디자인

---

## 환경변수

### 필수 변수
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx... (서버 전용, 노출 금지)

# OpenAI
OPENAI_API_KEY=sk-proj-xxx...

# Toss Payments
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_xxx...
TOSS_SECRET_KEY=test_sk_xxx... (서버 전용)

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000 (프로덕션은 실제 도메인)
```

### Supabase Storage 버킷
- `customer-photos` (public) - 고객 5면 사진
- `portfolio` (public) - 포트폴리오 작품

### Vercel 배포
- **자동 배포**: main 브랜치 푸시 시
- **프리뷰**: PR 생성 시
- **환경변수**: Vercel 대시보드에서 설정 (프로덕션 키 별도)

---

## 코딩 규칙

### 파일 네이밍
- 컴포넌트: `PascalCase.tsx` (예: `FiveViewUploader.tsx`)
- 훅: `camelCase.ts` (예: `useCustomers.ts`)
- 유틸: `camelCase.ts` (예: `formatDate.ts`)

### 타입 정의
- `any` 타입 금지, 명시적 타입 정의 필수
- 타입은 `types/index.ts`에 정의 (향후 분리 예정)

### 스타일
- 인라인 스타일 금지 (Tailwind CSS 사용)
- 모바일 터치 영역 44px 이상
- 반응형: 모바일 우선 (`sm:`, `md:`, `lg:`)

### API 응답 형식
```typescript
// 성공
{ data: T, error: null }

// 실패
{ data: null, error: { code: string, message: string } }
```

### 에러 핸들링
```typescript
try {
  const result = await supabase.from('table').insert(data);
  if (result.error) throw result.error;
  return { data: result.data, error: null };
} catch (error) {
  console.error('Operation failed:', error);
  return {
    data: null,
    error: {
      code: 'OPERATION_FAILED',
      message: '작업을 완료하지 못했어요. 다시 시도해주세요.'
    }
  };
}
```

### 이미지 업로드
- 최대 크기: 10MB
- 허용 형식: jpg, png, webp
- Supabase Storage 사용 (`customer-photos` 버킷)

### 보안
- 환경변수 하드코딩 금지
- Supabase 쿼리 에러 핸들링 필수
- RLS 정책 우회 금지
- 파일 업로드 시 검증 필수

---

## 프로젝트 히스토리 & 맥락

이 프로젝트는 **조코딩 x OpenAI x 프라이머 AI 해커톤**을 위해 시작되었으며, 헤어 디자이너가 고객 상담 시 AI를 활용하여 정밀한 모발 분석과 시술 레시피를 제공하는 것을 목표로 합니다.

**핵심 차별점**:
1. **5면 사진 분석**: 기존 정면 사진만 분석하는 서비스와 달리, 5면(앞/뒤/좌/우/윗)을 종합 분석하여 두피 및 모발 상태를 정밀 진단
2. **Luxury Salon 브랜딩**: 고급 살롱을 타겟으로 한 세련된 UI/UX (금색 톤, 글래스모피즘)
3. **디자이너 중심 워크플로우**: 고객 관리 → 5면 분석 → 스타일 추천 → 레시피 생성 → 타임라인 예측으로 이어지는 통합 워크플로우

**현재 상태**: MVP의 핵심 기능(인증, 결제, 고객 관리, 5면 분석 API)이 완료되었으며, 다음 단계는 AI 분석 결과를 보여주는 클라이언트 UI 구현입니다.

---

## AI Studio에서 작업 시작 방법

1. **프로젝트 이해하기**
   - 이 문서를 처음부터 끝까지 읽기
   - 특히 "프로젝트 현황", "다음 작업 우선순위", "알려진 이슈" 섹션 확인

2. **로컬 환경 설정**
   ```bash
   cd hairflow
   npm install
   cp .env.example .env.local
   # .env.local에 환경변수 입력
   npm run dev
   ```

3. **다음 작업 시작**
   - Phase 1의 "고객별 AI 분석 결과 UI 구현"부터 시작 권장
   - `/customers/[id]` 페이지에서 5면 분석 결과를 보여주는 섹션 추가

4. **커밋 시 주의사항**
   - 커밋 메시지는 `feat:`, `fix:`, `refactor:` 등 prefix 사용
   - Co-Authored-By 태그 추가 (AI 협업 명시)
   - 작업 후 이 CLAUDE.md 파일도 함께 업데이트

---

## 참고 문서

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Toss Payments Docs](https://docs.tosspayments.com/)
