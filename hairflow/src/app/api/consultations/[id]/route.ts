import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@/types';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { user, error: authError } = await getAuthUser();
        if (!user || authError) {
            return NextResponse.json<ApiResponse<null>>(
                { data: null, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' } },
                { status: 401 }
            );
        }

        const { id: consultationId } = await params;
        const body = await request.json();
        const { isSharedWithShop, notes } = body;

        const supabase = await createClient();

        // 1. Consultation 조회 및 권한 확인
        const { data: consultation, error: fetchError } = await supabase
            .from('consultations')
            .select('designer_id')
            .eq('id', consultationId)
            .single();

        if (fetchError || !consultation) {
            return NextResponse.json<ApiResponse<null>>(
                { data: null, error: { code: 'NOT_FOUND', message: '시술 기록을 찾을 수 없습니다.' } },
                { status: 404 }
            );
        }

        // 권한 확인: 본인이거나, 같은 매장의 Owner인지 확인
        let isAuthorized = consultation.designer_id === user.id;

        if (!isAuthorized) {
            // 작성자가 아니라면, 사용자(요청자)가 Owner인지 확인
            const { data: myMembership } = await supabase
                .from('memberships')
                .select('organization_id, role')
                .eq('user_id', user.id)
                .single();

            if (myMembership?.role === 'owner') {
                // 작성자가 같은 매장 소속인지 확인
                const { data: designerMembership } = await supabase
                    .from('memberships')
                    .select('organization_id')
                    .eq('user_id', consultation.designer_id)
                    .single();

                if (myMembership.organization_id === designerMembership?.organization_id) {
                    isAuthorized = true;
                }
            }
        }

        if (!isAuthorized) {
            return NextResponse.json<ApiResponse<null>>(
                { data: null, error: { code: 'FORBIDDEN', message: '수정 권한이 없습니다.' } },
                { status: 403 }
            );
        }

        // 2. 업데이트 수행
        const updates: any = {};
        if (typeof isSharedWithShop === 'boolean') updates.is_shared_with_shop = isSharedWithShop;
        if (notes !== undefined) updates.notes = notes;

        const { data: updatedData, error: updateError } = await supabase
            .from('consultations')
            .update(updates)
            .eq('id', consultationId)
            .select()
            .single();

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json<ApiResponse<any>>({
            data: updatedData,
            error: null,
        });

    } catch (error) {
        console.error('Consultation update error:', error);
        return NextResponse.json<ApiResponse<null>>(
            { data: null, error: { code: 'SERVER_ERROR', message: '수정에 실패했습니다.' } },
            { status: 500 }
        );
    }
}
