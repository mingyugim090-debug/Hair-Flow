import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import type { ApiResponse } from '@/types';

/**
 * DELETE /api/customers/[id]/consultations?sessionNumber=N
 * 특정 세션의 모든 상담 기록을 삭제합니다.
 */
export async function DELETE(
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

        const { id: customerId } = await params;
        const { searchParams } = new URL(request.url);
        const sessionNumber = searchParams.get('sessionNumber');

        if (!sessionNumber) {
            return NextResponse.json<ApiResponse<null>>(
                { data: null, error: { code: 'MISSING_PARAMS', message: 'sessionNumber가 필요합니다.' } },
                { status: 400 }
            );
        }

        const { createAdminClient } = await import('@/lib/supabase/admin');
        const adminSupabase = createAdminClient();

        // 해당 고객의 해당 세션 상담 기록 삭제
        const { error: deleteError, count } = await adminSupabase
            .from('consultations')
            .delete({ count: 'exact' })
            .eq('customer_id', customerId)
            .eq('session_number', parseInt(sessionNumber));

        if (deleteError) {
            console.error('Consultation delete error:', deleteError);
            return NextResponse.json<ApiResponse<null>>(
                { data: null, error: { code: 'DELETE_FAILED', message: '삭제에 실패했습니다.' } },
                { status: 500 }
            );
        }

        return NextResponse.json<ApiResponse<{ deleted: number }>>({
            data: { deleted: count ?? 0 },
            error: null,
        });
    } catch (error) {
        console.error('Consultation delete error:', error);
        return NextResponse.json<ApiResponse<null>>(
            { data: null, error: { code: 'SERVER_ERROR', message: '삭제에 실패했습니다.' } },
            { status: 500 }
        );
    }
}
