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

// 사용자 프로필
export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  plan: 'free' | 'basic' | 'pro';
  dailyUsage: number;
  lastUsageDate: string | null;
  createdAt: string;
}

// 구독 플랜
export interface PricingPlan {
  id: 'free' | 'basic' | 'pro';
  name: string;
  price: number;
  features: string[];
  limit: number | null;
}
