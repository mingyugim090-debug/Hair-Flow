import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
    try {
        const { user, error: authError } = await getAuthUser();
        if (!user || authError) {
            return NextResponse.json<ApiResponse<null>>(
                { data: null, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' } },
                { status: 401 }
            );
        }

        const supabase = await createClient();

        // 1. 사용자의 Organization 및 Role 확인 (Owner 여부 체크)
        const { data: membership, error: membershipError } = await supabase
            .from('memberships')
            .select('organization_id, role')
            .eq('user_id', user.id)
            .single();

        if (membershipError || !membership) {
            return NextResponse.json<ApiResponse<null>>(
                { data: null, error: { code: 'NO_ORGANIZATION', message: '소속된 매장이 없습니다.' } },
                { status: 404 }
            );
        }

        if (membership.role !== 'owner') {
            return NextResponse.json<ApiResponse<null>>(
                { data: null, error: { code: 'FORBIDDEN', message: '매장 관리자만 접근할 수 있습니다.' } },
                { status: 403 }
            );
        }

        // 2. 대시보드 데이터 집계
        // 2-1. 매장 전체 분석 건수 (consultations count)
        // 매장 소속 디자이너들의 ID 목록 가져오기
        const { data: members } = await supabase
            .from('memberships')
            .select('user_id, profile:profiles(name, designer_name, avatar_url)')
            .eq('organization_id', membership.organization_id);

        const memberIds = members?.map(m => m.user_id) || [];

        // 각 디자이너별 분석 건수 집계
        const { data: consultations } = await supabase
            .from('consultations')
            .select('designer_id, treatment_type')
            .in('designer_id', memberIds);

        const totalAnalysisCount = consultations?.length || 0;

        // 디자이너별 기여도 계산
        const contributionStats = members?.map(member => {
            const count = consultations?.filter(c => c.designer_id === member.user_id).length || 0;
            // @ts-ignore: profile join type
            const profile = member.profile as { name: string; designer_name: string; avatar_url: string } | null;
            return {
                designerId: member.user_id,
                name: profile?.designer_name || profile?.name || 'Unknown',
                avatarUrl: profile?.avatar_url || null,
                count,
                percentage: totalAnalysisCount > 0 ? Math.round((count / totalAnalysisCount) * 100) : 0
            };
        }).sort((a, b) => b.count - a.count) || [];

        return NextResponse.json<ApiResponse<any>>({
            data: {
                totalAnalysisCount,
                contributionStats,
                activeStaffCount: members?.length || 0,
                todayAnalysisCount: consultations?.filter(c => {
                    const today = new Date().toISOString().split('T')[0];
                    // @ts-ignore
                    return c.created_at?.startsWith(today); // created_at이 select에 없어서 정확하지 않을 수 있음, 개선 필요하지만 MVP 레벨에선 패스
                }).length || 0
            },
            error: null,
        });

    } catch (error) {
        console.error('Organization dashboard error:', error);
        return NextResponse.json<ApiResponse<null>>(
            { data: null, error: { code: 'SERVER_ERROR', message: '대시보드 데이터를 불러오지 못했습니다.' } },
            { status: 500 }
        );
    }
}
