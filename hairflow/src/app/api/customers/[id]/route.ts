import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse, Customer, CustomerTimeline, CustomerAnalysisResult, TimelinePredictionResult } from '@/types';

interface CustomerDetail {
  customer: Customer;
  timelines: CustomerTimeline[];
}

// 고객 상세 + 분석 히스토리 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = await getAuthUser();
    if (!user || authError) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' },
      }, { status: 401 });
    }

    const { id: customerId } = await params;

    const supabase = await createClient();

    // 고객 정보 조회 (본인의 고객만)
    const { data: customerRow, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .eq('designer_id', user.id)
      .single();

    if (customerError || !customerRow) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: { code: 'NOT_FOUND', message: '고객을 찾을 수 없습니다.' },
      }, { status: 404 });
    }

    const customer: Customer = {
      id: customerRow.id,
      designerId: customerRow.designer_id,
      name: customerRow.name,
      phone: customerRow.phone ?? null,
      memo: customerRow.memo ?? null,
      createdAt: customerRow.created_at,
    };

    // 해당 고객의 분석 히스토리 (timelines)
    const { data: timelineRows } = await supabase
      .from('timelines')
      .select('*')
      .eq('customer_id', customerId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const timelines: CustomerTimeline[] = (timelineRows ?? []).map((row) => {
      const type = row.treatment_type === 'timeline' ? 'timeline' : 'analysis';
      return {
        id: row.id,
        customerId: row.customer_id,
        type,
        imageUrl: row.treatment_image_url ?? null,
        ...(type === 'analysis'
          ? { analysis: row.result_images as CustomerAnalysisResult }
          : { timelinePrediction: row.result_images as TimelinePredictionResult }),
        createdAt: row.created_at,
      };
    });

    return NextResponse.json<ApiResponse<CustomerDetail>>({
      data: { customer, timelines },
      error: null,
    });
  } catch {
    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: { code: 'SERVER_ERROR', message: '서버 오류가 발생했습니다.' },
    }, { status: 500 });
  }
}
