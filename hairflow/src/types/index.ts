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

// 시술 회차 (Consultation)
export interface Consultation {
  id: string;
  customerId: string;
  designerId: string;
  sessionNumber: number; // 회차 (1차, 2차...)
  treatmentType: 'analysis' | 'timeline' | 'recipe';
  photos: {
    front?: string;
    back?: string;
    side?: string;
  };
  analysisResult?: ThreeViewAnalysisResult;
  recipeResult?: CustomerAnalysisResult;
  timelinePrediction?: TimelinePredictionResult;
  chemicalRecords: ChemicalRecord[];
  notes: string; // 시술 노트
  createdAt: string;
}
