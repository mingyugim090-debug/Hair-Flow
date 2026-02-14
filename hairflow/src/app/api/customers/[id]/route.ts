import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse, Customer, Consultation, ChemicalRecord, ThreeViewAnalysisResult, CustomerAnalysisResult, TimelinePredictionResult, FiveViewAnalysisResult, StyleRecommendationResult, StyleBasedRecipeResult, PostTreatmentTimeline } from '@/types';

interface CustomerDetailResponse {
  customer: Customer;
  consultations: Consultation[];
}

// 고객 상세 + 시술 히스토리 조회
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

    // 고객 정보 조회
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

    // 시술 회차 조회 (consultations)
    const { data: consultationRows } = await supabase
      .from('consultations')
      .select('*')
      .eq('customer_id', customerId)
      .eq('designer_id', user.id)
      .order('created_at', { ascending: false });

    const consultations: Consultation[] = await Promise.all(
      (consultationRows ?? []).map(async (row) => {
        // 약제 기록 조회
        const { data: chemicalRows } = await supabase
          .from('chemical_records')
          .select('*')
          .eq('consultation_id', row.id)
          .order('created_at', { ascending: false });

        const chemicalRecords: ChemicalRecord[] = (chemicalRows ?? []).map((chem) => ({
          id: chem.id,
          consultationId: chem.consultation_id,
          brand: chem.brand,
          productName: chem.product_name,
          ratio: chem.ratio,
          mixingNotes: chem.mixing_notes ?? '',
          applicationMethod: chem.application_method ?? '',
          processingTime: chem.processing_time ?? '',
          createdAt: chem.created_at,
        }));

        return {
          id: row.id,
          customerId: row.customer_id,
          designerId: row.designer_id,
          sessionNumber: row.session_number,
          treatmentType: row.treatment_type,
          photos: {
            front: row.photo_front ?? undefined,
            back: row.photo_back ?? undefined,
            left: row.photo_left ?? undefined,
            right: row.photo_right ?? undefined,
            top: row.photo_top ?? undefined,
          },
          // 5면 사진 분석 결과
          fiveViewAnalysis: row.five_view_analysis as FiveViewAnalysisResult | undefined,
          // AI 스타일 추천 결과
          styleRecommendations: row.style_recommendations as StyleRecommendationResult | undefined,
          // 선택한 스타일 기반 레시피
          styleBasedRecipe: row.style_based_recipe as StyleBasedRecipeResult | undefined,
          // 시술 후 타임라인
          postTreatmentTimeline: row.post_treatment_timeline as PostTreatmentTimeline | undefined,
          // 기존 호환성 유지
          analysisResult: row.analysis_result as ThreeViewAnalysisResult | undefined,
          recipeResult: row.recipe_result as CustomerAnalysisResult | undefined,
          timelinePrediction: row.timeline_prediction as TimelinePredictionResult | undefined,
          chemicalRecords,
          notes: row.notes ?? '',
          createdAt: row.created_at,
        };
      })
    );

    return NextResponse.json<ApiResponse<CustomerDetailResponse>>({
      data: { customer, consultations },
      error: null,
    });
  } catch {
    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: { code: 'SERVER_ERROR', message: '서버 오류가 발생했습니다.' },
    }, { status: 500 });
  }
}
