import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
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

        const supabase = createAdminClient();

        // 가장 최근 구독 조회 (status 컬럼 유무에 관계없이 조회)
        const { data: subscription, error: subError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (subError || !subscription) {
            console.error('Subscription query error:', subError);
            return NextResponse.json<ApiResponse<null>>({
                data: null,
                error: { code: 'NO_SUBSCRIPTION', message: '활성 구독을 찾을 수 없습니다.' },
            }, { status: 404 });
        }

        // 이미 해지된 경우 체크
        if (subscription.is_canceled) {
            return NextResponse.json<ApiResponse<null>>({
                data: null,
                error: { code: 'ALREADY_CANCELED', message: '이미 해지가 요청되었습니다.' },
            }, { status: 400 });
        }

        // 해지 처리: 가능한 필드만 업데이트
        const updateData: Record<string, unknown> = {
            is_canceled: true,
            canceled_at: new Date().toISOString(),
        };

        // status 컬럼이 존재하면 업데이트
        if ('status' in subscription) {
            updateData.status = 'canceled';
        }

        const { error: updateError } = await supabase
            .from('subscriptions')
            .update(updateData)
            .eq('id', subscription.id);

        if (updateError) {
            console.error('Subscription update error:', updateError);
            // is_canceled 컬럼이 없을 수 있으므로, 최소한의 업데이트 시도
            const { error: fallbackError } = await supabase
                .from('subscriptions')
                .update({ status: 'canceled' })
                .eq('id', subscription.id);

            if (fallbackError) {
                console.error('Fallback update also failed:', fallbackError);
                return NextResponse.json<ApiResponse<null>>({
                    data: null,
                    error: { code: 'UPDATE_FAILED', message: '구독 해지 처리에 실패했습니다. DB 마이그레이션을 확인해주세요.' },
                }, { status: 500 });
            }
        }

        const endDate = subscription.current_period_end || subscription.expires_at;
        const expiryText = getExpiryDateText(endDate);

        return NextResponse.json<ApiResponse<{ message: string; expiryDate: string }>>({
            data: {
                message: expiryText,
                expiryDate: endDate,
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
