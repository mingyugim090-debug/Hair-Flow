import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse, ExtendedConsultation } from '@/types';

export async function GET(request: NextRequest) {
    try {
        const { user, error: authError } = await getAuthUser();
        if (!user || authError) {
            return NextResponse.json<ApiResponse<null>>(
                { data: null, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' } },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const sort = searchParams.get('sort') || 'latest'; // latest, popular
        const filter = searchParams.get('filter') || 'all'; // all, color, cut, perm

        const supabase = await createClient();

        // 1. 사용자의 Organization ID 찾기
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

        // 2. 같은 매장의 모든 멤버 ID 찾기
        const { data: members, error: membersError } = await supabase
            .from('memberships')
            .select('user_id')
            .eq('organization_id', membership.organization_id);

        if (membersError) {
            throw membersError;
        }

        const memberIds = members.map(m => m.user_id);

        // 3. 공유된 Consultation 조회
        let query = supabase
            .from('consultations')
            .select(`
        *,
        designer:profiles!designer_id(
          id, name, designer_name, avatar_url, specialties
        )
      `)
            .in('designer_id', memberIds)
            .eq('is_shared_with_shop', true);

        // 필터 적용
        if (filter !== 'all') {
            query = query.eq('treatment_type', filter);
        }

        // 정렬 적용
        if (sort === 'latest') {
            query = query.order('created_at', { ascending: false });
        } else if (sort === 'oldest') {
            query = query.order('created_at', { ascending: true });
        }
        // 'popular'는 조회수가 없어서 구현 생략 (향후 like 기능 추가 시 구현)

        const { data: consultations, error: consultError } = await query;

        if (consultError) {
            throw consultError;
        }

        // 데이터 가공 (타입 매핑)
        const result: ExtendedConsultation[] = consultations.map((item: any) => ({
            id: item.id,
            customerId: item.customer_id,
            designerId: item.designer_id,
            sessionNumber: item.session_number,
            treatmentType: item.treatment_type,
            photos: {
                front: item.photo_front,
                back: item.photo_back,
                left: item.photo_left,
                right: item.photo_right,
                top: item.photo_top,
            },
            fiveViewAnalysis: item.five_view_analysis,
            styleRecommendations: item.style_recommendations,
            styleBasedRecipe: item.style_based_recipe,
            postTreatmentTimeline: item.post_treatment_timeline,
            chemicalRecords: [], // 목록에서는 제외
            notes: item.notes,
            createdAt: item.created_at,
            isSharedWithShop: item.is_shared_with_shop,
            designer: {
                id: item.designer.id,
                email: '', // 민감 정보 제외
                name: item.designer.name,
                designerName: item.designer.designer_name,
                avatarUrl: item.designer.avatar_url,
                specialties: item.designer.specialties,
                // 기타 필수 필드 더미 처리
                shopName: null, instagramId: null, bio: null, isOnboarded: true,
                plan: 'basic', dailyUsage: 0, lastUsageDate: null, portfolioWorks: [], createdAt: '',
                subscriptionEnd: null, isCanceled: false, remainingUsage: 0
            }
        }));

        return NextResponse.json<ApiResponse<ExtendedConsultation[]>>({
            data: result,
            error: null,
        });

    } catch (error) {
        console.error('Organization portfolio error:', error);
        return NextResponse.json<ApiResponse<null>>(
            { data: null, error: { code: 'SERVER_ERROR', message: '데이터를 불러오지 못했습니다.' } },
            { status: 500 }
        );
    }
}
