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
