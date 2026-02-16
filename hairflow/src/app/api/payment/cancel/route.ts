import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getExpiryDateText } from '@/lib/subscription';
import type { ApiResponse } from '@/types';

// 구독 해지 API
export async function POST() {
    try {
        const { user, error: authError } = await getAuthUser();
        if (!user || authError) {
            return NextResponse.json<ApiResponse<null>>({
                data: null,
                error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' },
            }, { status: 401 });
        }

        if (user.plan === 'free') {
            return NextResponse.json<ApiResponse<null>>({
                data: null,
                error: { code: 'NO_SUBSCRIPTION', message: '활성 구독이 없습니다.' },
            }, { status: 400 });
        }

        const supabase = await createClient();

        // 가장 최근 활성 구독 조회
        const { data: subscription, error: subError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (subError || !subscription) {
            return NextResponse.json<ApiResponse<null>>({
                data: null,
                error: { code: 'NO_SUBSCRIPTION', message: '활성 구독을 찾을 수 없습니다.' },
            }, { status: 404 });
        }

        if (subscription.is_canceled) {
            return NextResponse.json<ApiResponse<null>>({
                data: null,
                error: { code: 'ALREADY_CANCELED', message: '이미 해지가 요청되었습니다.' },
            }, { status: 400 });
        }

        // 해지 처리: 즉시 기능 차단 없음, 현재 기간 끝까지 유지
        const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
                is_canceled: true,
                canceled_at: new Date().toISOString(),
                status: 'canceled',
            })
            .eq('id', subscription.id);

        if (updateError) {
            return NextResponse.json<ApiResponse<null>>({
                data: null,
                error: { code: 'UPDATE_FAILED', message: '구독 해지 처리에 실패했습니다.' },
            }, { status: 500 });
        }

        const expiryText = getExpiryDateText(subscription.current_period_end || subscription.expires_at);

        return NextResponse.json<ApiResponse<{ message: string; expiryDate: string }>>({
            data: {
                message: expiryText,
                expiryDate: subscription.current_period_end || subscription.expires_at,
            },
            error: null,
        });
    } catch (error) {
        console.error('Cancel subscription error:', error);
        return NextResponse.json<ApiResponse<null>>({
            data: null,
            error: { code: 'CANCEL_ERROR', message: '구독 해지 처리 중 오류가 발생했습니다.' },
        }, { status: 500 });
    }
}
