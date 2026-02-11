# HairFlow - AI Hair Treatment Assistant

> 헤어 디자이너 전용 AI 시술 레시피 & 미래 예측 서비스

**조코딩 x OpenAI x 프라이머 AI 해커톤 출품작**

## 서비스 소개

HairFlow는 헤어 디자이너의 시술 정확도와 고객 만족도를 높이는 AI 어시스턴트입니다.

### 핵심 기능

**1. AI 시술 레시피**
- 레퍼런스 사진 + 현재 모발 사진 2장을 업로드
- GPT-4o Vision이 두 사진을 비교 분석
- 전문 시술 레시피 자동 생성 (약제 배합, 시술 순서, 주의사항)

**2. AI 미래 타임라인**
- 시술 완료 사진 1장 업로드
- GPT-4o Vision으로 현재 상태 분석
- DALL-E 3로 2주/4주/8주 후 변화 예측 이미지 생성
- 최적 재방문 시기 추천

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui + Framer Motion |
| AI | OpenAI API (GPT-4o Vision + DALL-E 3) |
| DB/Auth | Supabase (PostgreSQL + Auth) |
| Payment | Toss Payments |
| Deploy | Vercel |

## OpenAI API 활용

### GPT-4o Vision
- **시술 레시피**: 레퍼런스 사진과 현재 모발 사진을 동시에 분석하여 차이점을 파악하고, 전문 시술 레시피를 JSON 형식으로 생성
- **타임라인 분석**: 시술 완료 사진을 분석하여 현재 모발 상태를 파악하고, 시간 경과에 따른 변화를 예측

### DALL-E 3
- 시술 후 시간대별(2주/4주/8주) 모발 변화 예측 이미지를 생성
- GPT-4o Vision의 분석 결과를 기반으로 정확한 DALL-E 프롬프트 자동 생성

## 로컬 실행

```bash
# 1. 의존성 설치
cd hairflow
npm install

# 2. 환경변수 설정
cp .env.example .env.local
# .env.local에 API 키 입력

# 3. Supabase DB 설정
# supabase/schema.sql을 Supabase SQL Editor에서 실행

# 4. 개발 서버 실행
npm run dev
```

## 환경변수

```env
NEXT_PUBLIC_SUPABASE_URL=        # Supabase 프로젝트 URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase Anon Key
SUPABASE_SERVICE_ROLE_KEY=       # Supabase Service Role Key
OPENAI_API_KEY=                  # OpenAI API Key
NEXT_PUBLIC_TOSS_CLIENT_KEY=     # Toss Payments 클라이언트 키
TOSS_SECRET_KEY=                 # Toss Payments 시크릿 키
NEXT_PUBLIC_APP_URL=             # 앱 URL
```

## 수익 모델

| 플랜 | 가격 | 주요 기능 |
|------|------|----------|
| Free | 0원 | 하루 3건 AI 분석 |
| Basic | 월 19,900원 | 무제한 분석 + 히스토리 |
| Pro | 월 39,900원 | 매장 전체 사용 + 약제 DB |

## 프로젝트 구조

```
hairflow/src/
├── app/
│   ├── page.tsx              # 랜딩 페이지
│   ├── (auth)/login/         # Google 로그인
│   ├── (main)/
│   │   ├── dashboard/        # 대시보드
│   │   ├── recipe/           # AI 시술 레시피
│   │   ├── timeline/         # AI 미래 타임라인
│   │   └── pricing/          # 구독 플랜 + 결제
│   └── api/
│       ├── recipe/           # GPT-4o Vision 레시피 API
│       ├── timeline/         # GPT-4o + DALL-E 3 타임라인 API
│       └── payment/          # Toss Payments 결제 API
├── components/               # UI 컴포넌트
├── lib/                      # 유틸리티 (OpenAI, Supabase, 프롬프트)
└── types/                    # TypeScript 타입
```
