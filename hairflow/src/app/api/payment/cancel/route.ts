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

        // 서비스 롤 키 확인
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('SUPABASE_SERVICE_ROLE_KEY is not set');
            return NextResponse.json<ApiResponse<null>>({
                data: null,
                error: { code: 'CONFIG_ERROR', message: '서버 설정 오류입니다. 관리자에게 문의하세요.' },
            }, { status: 500 });
        }

        const supabase = createAdminClient();

        // 가장 최근 구독 조회
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

        // 해지 처리
        const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
                is_canceled: true,
                canceled_at: new Date().toISOString(),
                status: 'canceled',
            })
            .eq('id', subscription.id);

        if (updateError) {
            console.error('Subscription update error:', JSON.stringify(updateError));
            return NextResponse.json<ApiResponse<null>>({
                data: null,
                error: {
                    code: 'UPDATE_FAILED',
                    message: '구독 해지 처리에 실패했습니다. 잠시 후 다시 시도해주세요.'
                },
            }, { status: 500 });
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

