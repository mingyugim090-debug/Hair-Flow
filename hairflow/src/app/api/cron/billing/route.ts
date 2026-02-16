import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PLAN_PRICES } from '@/lib/subscription';

// Vercel Cron: 매일 자정 KST (UTC 15:00)에 실행
// 1. 해지된 구독의 만료 처리
// 2. 결제 실패 3일 초과 시 Free 전환
// 3. 자동 갱신 결제 시도

export async function GET(request: NextRequest) {
    // Cron 인증 확인
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const now = new Date().toISOString();
    const results = { expired: 0, renewed: 0, failed: 0, downgraded: 0 };

    try {
        // 1. 해지된 구독 중 만료된 것 → Free 전환
        const { data: canceledExpired } = await supabase
            .from('subscriptions')
            .select('id, user_id')
            .eq('is_canceled', true)
            .eq('status', 'canceled')
            .lte('current_period_end', now);

        if (canceledExpired?.length) {
            for (const sub of canceledExpired) {
                await supabase
                    .from('subscriptions')
                    .update({ status: 'expired' })
                    .eq('id', sub.id);

                await supabase
                    .from('profiles')
                    .update({ plan: 'free' })
                    .eq('id', sub.user_id);

                results.expired++;
            }
        }

        // 2. 결제 실패 3회 초과 → Free 전환
        const { data: pastDue } = await supabase
            .from('subscriptions')
            .select('id, user_id')
            .eq('status', 'past_due')
            .gte('retry_count', 3);

        if (pastDue?.length) {
            for (const sub of pastDue) {
                await supabase
                    .from('subscriptions')
                    .update({ status: 'expired' })
                    .eq('id', sub.id);

                await supabase
                    .from('profiles')
                    .update({ plan: 'free' })
                    .eq('id', sub.user_id);

                results.downgraded++;
            }
        }

        // 3. 자동 갱신: 미해지 + 만료일 도래 구독
        const { data: renewals } = await supabase
            .from('subscriptions')
            .select('id, user_id, plan, billing_key, customer_key, amount')
            .eq('status', 'active')
            .eq('is_canceled', false)
            .lte('next_billing_date', now);

        if (renewals?.length) {
            const secretKey = process.env.TOSS_SECRET_KEY;

            for (const sub of renewals) {
                if (!sub.billing_key) {
                    // 빌링키 없으면 past_due 처리
                    await supabase
                        .from('subscriptions')
                        .update({
                            status: 'past_due',
                            retry_count: (sub as { retry_count?: number }).retry_count ? ((sub as { retry_count?: number }).retry_count ?? 0) + 1 : 1
                        })
                        .eq('id', sub.id);
                    results.failed++;
                    continue;
                }

                try {
                    // 빌링키로 자동 결제
                    const billingAmount = PLAN_PRICES[sub.plan] || sub.amount;
                    const orderId = `hairflow_${sub.plan}_renewal_${Date.now()}`;

                    const tossResponse = await fetch('https://api.tosspayments.com/v1/billing/' + sub.billing_key, {
                        method: 'POST',
                        headers: {
                            Authorization: `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            customerKey: sub.customer_key,
                            amount: billingAmount,
                            orderId,
                            orderName: `HairFlow ${sub.plan} 월간 구독 갱신`,
                        }),
                    });

                    if (tossResponse.ok) {
                        const newPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                        // 구독 갱신
                        await supabase
                            .from('subscriptions')
                            .update({
                                current_period_end: newPeriodEnd.toISOString(),
                                next_billing_date: newPeriodEnd.toISOString(),
                                retry_count: 0,
                            })
                            .eq('id', sub.id);

                        // 결제 이력 저장
                        await supabase.from('payments').insert({
                            user_id: sub.user_id,
                            subscription_id: sub.id,
                            amount: billingAmount,
                            status: 'success',
                            toss_order_id: orderId,
                        });

                        results.renewed++;
                    } else {
                        // 결제 실패
                        await supabase
                            .from('subscriptions')
                            .update({
                                status: 'past_due',
                                retry_count: ((sub as { retry_count?: number }).retry_count ?? 0) + 1,
                            })
                            .eq('id', sub.id);

                        await supabase.from('payments').insert({
                            user_id: sub.user_id,
                            subscription_id: sub.id,
                            amount: billingAmount,
                            status: 'failed',
                            toss_order_id: orderId,
                            error_message: 'Auto-renewal payment failed',
                        });

                        results.failed++;
                    }
                } catch (error) {
                    console.error('Renewal error for subscription:', sub.id, error);
                    results.failed++;
                }
            }
        }

        console.log('Cron billing results:', results);
        return NextResponse.json({ success: true, results });
    } catch (error) {
        console.error('Cron billing error:', error);
        return NextResponse.json({ error: 'Cron billing failed' }, { status: 500 });
    }
}
