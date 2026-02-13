import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAuthUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@/types';

// Toss Payments 결제 승인
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser();
    if (!user || authError) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' },
      }, { status: 401 });
    }

    const body = await request.json();
    const { paymentKey, orderId, amount, planId } = body as {
      paymentKey: string;
      orderId: string;
      amount: number;
      planId: 'basic' | 'enterprise';
    };

    if (!paymentKey || !orderId || !amount || !planId) {
      console.error('Missing payment params:', { paymentKey: !!paymentKey, orderId: !!orderId, amount: !!amount, planId: !!planId });
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: { code: 'MISSING_PARAMS', message: '결제 정보가 누락되었습니다.' },
      }, { status: 400 });
    }

    // 결제 금액 검증
    const expectedAmount = planId === 'enterprise' ? 99000 : 19900;
    if (amount !== expectedAmount) {
      console.error('Payment amount mismatch:', { userId: user.id, planId, expected: expectedAmount, received: amount });
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: { code: 'AMOUNT_MISMATCH', message: `결제 금액이 올바르지 않습니다. (${planId} 플랜: ${expectedAmount}원)` },
      }, { status: 400 });
    }

    // Toss Payments 결제 승인 API 호출
    const secretKey = process.env.TOSS_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: { code: 'CONFIG_ERROR', message: '결제 시스템 설정 오류입니다.' },
      }, { status: 500 });
    }

    const tossResponse = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    const tossResult = await tossResponse.json();

    if (!tossResponse.ok) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: {
          code: tossResult.code ?? 'PAYMENT_FAILED',
          message: tossResult.message ?? '결제 승인에 실패했습니다.',
        },
      }, { status: 400 });
    }

    // 결제 성공 → DB 업데이트
    const supabase = await createClient();

    // 구독 정보 저장
    const { error: subscriptionError } = await supabase.from('subscriptions').insert({
      user_id: user.id,
      plan: planId,
      status: 'active',
      toss_order_id: orderId,
      toss_payment_key: paymentKey,
      amount,
      started_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    if (subscriptionError) {
      console.error('Subscription creation failed:', {
        userId: user.id,
        planId,
        amount,
        orderId,
        error: subscriptionError,
        errorCode: subscriptionError.code,
        errorMessage: subscriptionError.message,
        errorDetails: subscriptionError.details,
      });
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: { code: 'DB_ERROR', message: `구독 정보 저장에 실패했습니다. (에러: ${subscriptionError.message || subscriptionError.code})` },
      }, { status: 500 });
    }

    // 사용자 플랜 업데이트
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ plan: planId })
      .eq('id', user.id);

    if (profileError) {
      console.error('Profile plan update failed:', {
        userId: user.id,
        planId,
        error: profileError,
        errorCode: profileError.code,
        errorMessage: profileError.message,
        errorDetails: profileError.details,
      });
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: { code: 'PLAN_UPDATE_ERROR', message: `플랜 업데이트에 실패했습니다. (에러: ${profileError.message || profileError.code})` },
      }, { status: 500 });
    }

    // 캐시 무효화 - 대시보드와 프라이싱 페이지 갱신
    revalidatePath('/dashboard');
    revalidatePath('/pricing');

    console.log('Payment successful:', { userId: user.id, planId, amount, orderId });

    return NextResponse.json<ApiResponse<{ orderId: string; plan: string }>>({
      data: { orderId, plan: planId },
      error: null,
    });
  } catch (error) {
    console.error('Payment API error:', error);
    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: { code: 'PAYMENT_ERROR', message: '결제 처리 중 오류가 발생했습니다.' },
    }, { status: 500 });
  }
}
