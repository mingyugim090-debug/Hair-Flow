import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse, ChemicalRecord } from '@/types';

// 약제 배합 기록 추가
export async function POST(
  request: NextRequest,
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
    const body = await request.json();
    const { consultationId, brand, productName, ratio, mixingNotes, applicationMethod, processingTime } = body;

    if (!consultationId || !brand || !productName || !ratio) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: { code: 'MISSING_FIELDS', message: '필수 항목을 입력해주세요.' },
      }, { status: 400 });
    }

    const supabase = await createClient();

    // consultation이 본인 것인지 확인
    const { data: consultation, error: consultationError } = await supabase
      .from('consultations')
      .select('id, designer_id')
      .eq('id', consultationId)
      .eq('customer_id', customerId)
      .single();

    if (consultationError || !consultation || consultation.designer_id !== user.id) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: { code: 'NOT_FOUND', message: '시술 회차를 찾을 수 없습니다.' },
      }, { status: 404 });
    }

    // 약제 기록 저장
    const { data: chemicalRow, error: chemicalError } = await supabase
      .from('chemical_records')
      .insert({
        consultation_id: consultationId,
        brand,
        product_name: productName,
        ratio,
        mixing_notes: mixingNotes ?? '',
        application_method: applicationMethod ?? '',
        processing_time: processingTime ?? '',
      })
      .select()
      .single();

    if (chemicalError || !chemicalRow) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: { code: 'DB_ERROR', message: '약제 기록 저장에 실패했습니다.' },
      }, { status: 500 });
    }

    const result: ChemicalRecord = {
      id: chemicalRow.id,
      consultationId: chemicalRow.consultation_id,
      brand: chemicalRow.brand,
      productName: chemicalRow.product_name,
      ratio: chemicalRow.ratio,
      mixingNotes: chemicalRow.mixing_notes ?? '',
      applicationMethod: chemicalRow.application_method ?? '',
      processingTime: chemicalRow.processing_time ?? '',
      createdAt: chemicalRow.created_at,
    };

    return NextResponse.json<ApiResponse<ChemicalRecord>>({
      data: result,
      error: null,
    });
  } catch (error) {
    console.error('Chemical record creation error:', error);
    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: { code: 'SERVER_ERROR', message: '서버 오류가 발생했습니다.' },
    }, { status: 500 });
  }
}
