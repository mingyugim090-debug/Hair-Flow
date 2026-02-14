// API 응답 타입
export interface ApiResponse<T> {
  data: T | null;
  error: { code: string; message: string } | null;
}

// 시술 레시피 결과
export interface RecipeResult {
  currentAnalysis: {
    baseLevel: string;
    damageLevel: string;
    hairType: string;
    hairVolume: string;
    summary: string;
  };
  targetAnalysis: {
    colorGap: string;
    lengthDiff: string;
    textureDiff: string;
    summary: string;
  };
  procedure: {
    type: 'color' | 'cut' | 'perm' | 'mixed';
    description: string;
  };
  chemicals: {
    brand: string;
    formula: string;
    ratio: string;
    applicationOrder: string;
    processingTime: string;
  };
  steps: {
    order: number;
    action: string;
    duration: string;
    details: string;
  }[];
  cautions: string[];
}

// 타임라인 결과
export interface TimelineResult {
  treatmentType: 'color' | 'cut' | 'perm';
  currentAnalysis: string;
  predictions: {
    week: number;
    label: string;
    imageUrl: string;
    description: string;
  }[];
  revisitRecommendation: {
    week: number;
    reason: string;
  };
}

// 포트폴리오 작품
export interface PortfolioWork {
  url: string;
  caption: string;
  createdAt: string;
}

// 사용자 프로필
export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  shopName: string | null;
  designerName: string | null;
  instagramId: string | null;
  specialties: string[];
  bio: string | null;
  isOnboarded: boolean;
  plan: 'free' | 'basic' | 'enterprise';
  dailyUsage: number;
  lastUsageDate: string | null;
  portfolioWorks: PortfolioWork[];
  createdAt: string;
}

// 고객
export interface Customer {
  id: string;
  designerId: string;
  name: string;
  phone: string | null;
  memo: string | null;
  createdAt: string;
}

// 고객 모발 분석 결과
export interface CustomerAnalysisResult {
  hairAnalysis: {
    condition: string;
    damageLevel: string;
    scalpCondition: string;
    hairType: string;
    thickness: string;
    porosity: string;
    summary: string;
  };
  recipe: {
    recommendedTreatment: string;
    description: string;
    steps: {
      order: number;
      action: string;
      duration: string;
      details: string;
    }[];
    products: {
      name: string;
      purpose: string;
      usage: string;
    }[];
    homecare: string[];
    cautions: string[];
    revisitWeeks: number;
  };
}

// 타임라인 예측 결과 (DALL-E 3 기반)
export interface TimelinePredictionResult {
  currentAnalysis: string;
  predictions: {
    week: number;
    label: string;
    imageUrl: string;
    description: string;
  }[];
  revisitRecommendation: {
    week: number;
    reason: string;
  };
}

// 고객 분석 히스토리 항목
export interface CustomerTimeline {
  id: string;
  customerId: string;
  type: 'analysis' | 'timeline';  // 분석 타입 구분
  imageUrl: string | null;
  analysis?: CustomerAnalysisResult;  // 모발 분석 결과 (type='analysis')
  timelinePrediction?: TimelinePredictionResult;  // 타임라인 예측 (type='timeline')
  createdAt: string;
}

// 구독 플랜
export interface PricingPlan {
  id: 'free' | 'basic' | 'enterprise';
  name: string;
  price: number;
  features: string[];
  limit: number | null;
}

// 3면 사진 종합 분석 결과
export interface ThreeViewAnalysisResult {
  faceShape: {
    type: string; // "둥근형", "긴형", "각진형", "하트형", "계란형"
    description: string;
    confidence: number; // 0-100
  };
  styleAnalysis: {
    currentStyle: string;
    vibe: string[]; // ["캐주얼", "세련된", "클래식" etc.]
    recommendedStyles: {
      name: string;
      reason: string;
      suitability: number; // 0-100
      imageDescription: string; // 스타일 설명
    }[];
  };
  hairAnalysis: {
    condition: string; // "양호", "보통", "주의", "위험"
    damageLevel: string; // "1~5"
    scalpCondition: string;
    hairType: string;
    thickness: string;
    porosity: string;
    density: string; // "낮음", "보통", "높음"
    summary: string;
  };
  comprehensiveAdvice: string; // 종합 조언 (3-5문장)
}

// 약제 배합 기록
export interface ChemicalRecord {
  id: string;
  consultationId: string;
  brand: string;
  productName: string;
  ratio: string;
  mixingNotes: string; // 배합 메모
  applicationMethod: string; // 도포 방법
  processingTime: string; // 방치 시간
  createdAt: string;
}

// 5면 사진 종합 분석 결과
export interface FiveViewAnalysisResult {
  headShape: {
    type: string; // "둥근형", "긴형", "각진형" 등
    description: string;
    confidence: number; // 0-100
  };
  hairDensityDistribution: {
    front: string; // "높음", "보통", "낮음"
    back: string;
    left: string;
    right: string;
    top: string;
    overallPattern: string; // 전체적인 밀도 패턴 설명
  };
  damageAnalysis: {
    overallLevel: string; // "1~5"
    frontDamage: string;
    backDamage: string;
    sideDamage: string;
    topDamage: string;
    summary: string;
  };
  faceShape: {
    type: string;
    description: string;
    confidence: number;
  };
  comprehensiveAdvice: string;
}

// AI 스타일 추천 결과
export interface StyleRecommendation {
  id: string;
  name: string; // "레이어드 숏컷"
  imageUrl: string; // DALL-E 3 생성 이미지
  dallePrompt: string; // 생성에 사용된 프롬프트
  description: string; // 스타일 설명
  suitability: number; // 0-100 어울림 점수
  difficulty: 'easy' | 'medium' | 'hard'; // 시술 난이도
  estimatedTime: string; // "1시간 30분"
  matchReason: string; // 고객에게 잘 어울리는 이유
}

export interface StyleRecommendationResult {
  currentAnalysis: string; // 현재 헤어 상태 분석
  recommendations: StyleRecommendation[]; // 3-4개
  faceShapeNote: string; // 얼굴형 관련 추가 조언
}

// 선택한 스타일 기반 레시피 결과
export interface StyleBasedRecipeResult {
  selectedStyle: {
    name: string;
    imageUrl: string;
  };
  cutProcedure: {
    description: string;
    techniques: string[]; // ["레이어 컷", "텍스처라이징" 등]
    steps: {
      order: number;
      action: string;
      duration: string;
      details: string;
    }[];
  };
  permProcedure?: {
    rodSize: string; // "14mm"
    windingMethod: string; // "스파이럴 와인딩"
    chemicals: {
      brand: string;
      productName: string;
      ratio: string;
      processingTime: string;
    };
    steps: {
      order: number;
      action: string;
      duration: string;
      details: string;
    }[];
  };
  colorProcedure?: {
    targetLevel: string;
    formula: string;
    ratio: string;
    applicationOrder: string;
    processingTime: string;
    steps: {
      order: number;
      action: string;
      duration: string;
      details: string;
    }[];
  };
  cautions: string[];
  estimatedTotalTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

// 시술 후 타임라인 예측
export interface PostTreatmentTimeline {
  treatmentType: 'cut' | 'perm' | 'color';
  completedPhotoUrl: string; // 시술 완료 직후 사진
  currentAnalysis: string;
  weeklyPredictions: {
    week: number; // 1, 2, 3, 4, 6, 8
    label: string; // "1주 후"
    imageUrl: string; // DALL-E 생성 이미지
    description: string; // 예상 변화
    careTips: string[]; // 관리 팁
  }[];
  revisitRecommendation: {
    week: number;
    reason: string;
  };
}

// 시술 회차 (Consultation) - 5면 사진 지원
export interface Consultation {
  id: string;
  customerId: string;
  designerId: string;
  sessionNumber: number; // 회차 (1차, 2차...)
  treatmentType: 'analysis' | 'style-recommendation' | 'recipe' | 'timeline';
  photos: {
    front?: string;
    back?: string;
    left?: string;
    right?: string;
    top?: string;
  };
  fiveViewAnalysis?: FiveViewAnalysisResult; // 5면 사진 분석
  styleRecommendations?: StyleRecommendationResult; // AI 스타일 추천
  styleBasedRecipe?: StyleBasedRecipeResult; // 선택한 스타일 기반 레시피
  postTreatmentTimeline?: PostTreatmentTimeline; // 시술 후 타임라인
  // 기존 호환성 유지
  analysisResult?: ThreeViewAnalysisResult;
  recipeResult?: CustomerAnalysisResult;
  timelinePrediction?: TimelinePredictionResult;
  chemicalRecords: ChemicalRecord[];
  notes: string; // 시술 노트
  createdAt: string;
}
