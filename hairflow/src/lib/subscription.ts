/**
 * Subscription utility functions
 * D-Day calculation, plan permissions, subscription queries
 */

// D-Day 계산 유틸리티
export function getDDayText(endDate: string | null): string {
    if (!endDate) return '';

    const now = new Date();
    const end = new Date(endDate);
    const diffMs = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return '만료됨';
    if (diffDays === 0) return 'D-Day';
    return `D-${diffDays}`;
}

// 만료일까지 남은 날짜 텍스트 (한국어)
export function getExpiryDateText(endDate: string | null): string {
    if (!endDate) return '';

    const end = new Date(endDate);
    const month = end.getMonth() + 1;
    const day = end.getDate();
    return `${month}월 ${day}일까지 이용 가능합니다`;
}

// 플랜별 권한 정의
export interface PlanPermissions {
    maxDailyUsage: number;
    hasHistory: boolean;
    hasUnlimitedCustomers: boolean;
    hasTeamManagement: boolean;
    hasAnalyticsReport: boolean;
}

export function getPlanPermissions(plan: 'free' | 'basic' | 'enterprise'): PlanPermissions {
    switch (plan) {
        case 'free':
            return {
                maxDailyUsage: 3,
                hasHistory: false,
                hasUnlimitedCustomers: false,
                hasTeamManagement: false,
                hasAnalyticsReport: false,
            };
        case 'basic':
            return {
                maxDailyUsage: Infinity,
                hasHistory: true,
                hasUnlimitedCustomers: true,
                hasTeamManagement: false,
                hasAnalyticsReport: false,
            };
        case 'enterprise':
            return {
                maxDailyUsage: Infinity,
                hasHistory: true,
                hasUnlimitedCustomers: true,
                hasTeamManagement: true,
                hasAnalyticsReport: true,
            };
    }
}

// Free 플랜 남은 횟수 계산
export function getRemainingUsage(dailyUsage: number, lastUsageDate: string | null, plan: string): number {
    if (plan !== 'free') return Infinity;

    const today = new Date().toISOString().split('T')[0];
    const isToday = lastUsageDate === today;

    if (!isToday) return 3;
    return Math.max(0, 3 - dailyUsage);
}

// 구독 만료 체크
export function isSubscriptionExpired(endDate: string | null): boolean {
    if (!endDate) return true;
    return new Date(endDate) < new Date();
}

// 가격 정보
export const PLAN_PRICES: Record<string, number> = {
    free: 0,
    basic: 19900,
    enterprise: 199000,
};
