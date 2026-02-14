import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/openai';
import { getAuthUser, checkUsageLimit, incrementUsage } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { THREE_VIEW_ANALYSIS_SYSTEM_PROMPT, THREE_VIEW_ANALYSIS_USER_PROMPT } from '@/lib/prompts';
import type { ThreeViewAnalysisResult, Consultation, ApiResponse } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 인증 체크
    const { user, error: authError } = await getAuthUser();
    if (!user || authError) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' },
      }, { status: 401 });
    }

    // 사용량 체크
    const { allowed, remaining } = await checkUsageLimit(user.id);
    if (!allowed) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: {
          code: 'USAGE_LIMIT',
          message: `오늘의 무료 분석 횟수(${remaining}건)를 모두 사용했습니다. 업그레이드하시면 무제한으로 이용할 수 있어요!`,
        },
      }, { status: 429 });
    }

    const { id: customerId } = await params;
    const supabase = await createClient();

    // 고객 확인
    const { data: customerRow, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', customerId)
      .eq('designer_id', user.id)
      .single();

    if (customerError || !customerRow) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: { code: 'NOT_FOUND', message: '고객을 찾을 수 없습니다.' },
      }, { status: 404 });
    }

    // FormData에서 3장의 이미지 추출
    const formData = await request.formData();
    const frontFile = formData.get('front') as File | null;
    const backFile = formData.get('back') as File | null;
    const sideFile = formData.get('side') as File | null;

    if (!frontFile || !backFile || !sideFile) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: { code: 'MISSING_IMAGES', message: '앞면, 뒷면, 옆면 사진 3장을 모두 업로드해주세요.' },
      }, { status: 400 });
    }

    // 파일 검증
    const files = [frontFile, backFile, sideFile];
    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    for (const file of files) {
      if (file.size > maxSize) {
        return NextResponse.json<ApiResponse<null>>({
          data: null,
          error: { code: 'FILE_TOO_LARGE', message: '각 이미지는 10MB 이하여야 합니다.' },
        }, { status: 400 });
      }
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json<ApiResponse<null>>({
          data: null,
          error: { code: 'INVALID_FORMAT', message: 'JPG, PNG, WebP 형식만 지원합니다.' },
        }, { status: 400 });
      }
    }

    // Supabase Storage에 업로드
    const uploadFile = async (file: File, label: string) => {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const ext = file.name.split('.').pop() ?? 'jpg';
      const fileName = `designers/${user.id}/${customerId}/${label}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('customer-photos')
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`${label} 사진 업로드 실패`);
      }

      const { data: urlData } = supabase.storage
        .from('customer-photos')
        .getPublicUrl(fileName);

      return { url: urlData.publicUrl, buffer, type: file.type };
    };

    const [frontData, backData, sideData] = await Promise.all([
      uploadFile(frontFile, 'front'),
      uploadFile(backFile, 'back'),
      uploadFile(sideFile, 'side'),
    ]);

    // base64 인코딩
    const frontBase64 = `data:${frontData.type};base64,${frontData.buffer.toString('base64')}`;
    const backBase64 = `data:${backData.type};base64,${backData.buffer.toString('base64')}`;
    const sideBase64 = `data:${sideData.type};base64,${sideData.buffer.toString('base64')}`;

    // GPT-4o Vision으로 3면 종합 분석
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: THREE_VIEW_ANALYSIS_SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: '앞면 사진:' },
            { type: 'image_url', image_url: { url: frontBase64, detail: 'high' } },
            { type: 'text', text: '뒷면 사진:' },
            { type: 'image_url', image_url: { url: backBase64, detail: 'high' } },
            { type: 'text', text: '옆면 사진:' },
            { type: 'image_url', image_url: { url: sideBase64, detail: 'high' } },
            { type: 'text', text: THREE_VIEW_ANALYSIS_USER_PROMPT },
          ],
        },
      ],
      max_tokens: 2500,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: { code: 'AI_NO_RESPONSE', message: 'AI 응답을 받지 못했습니다. 다시 시도해주세요.' },
      }, { status: 500 });
    }

    const analysisResult: ThreeViewAnalysisResult = JSON.parse(content);

    // 사용량 증가
    await incrementUsage(user.id);

    // 기존 consultations 개수 조회 (회차 번호 계산)
    const { count } = await supabase
      .from('consultations')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', customerId);

    const sessionNumber = (count ?? 0) + 1;

    // consultations 테이블에 저장
    const { data: consultation, error: consultationError } = await supabase
      .from('consultations')
      .insert({
        customer_id: customerId,
        designer_id: user.id,
        session_number: sessionNumber,
        treatment_type: 'analysis',
        photo_front: frontData.url,
        photo_back: backData.url,
        photo_side: sideData.url,
        analysis_result: analysisResult,
        notes: '',
      })
      .select()
      .single();

    if (consultationError) {
      console.error('Consultation insert error:', consultationError);
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: { code: 'DB_ERROR', message: '분석 결과 저장에 실패했습니다.' },
      }, { status: 500 });
    }

    const result: Consultation = {
      id: consultation.id,
      customerId: consultation.customer_id,
      designerId: consultation.designer_id,
      sessionNumber: consultation.session_number,
      treatmentType: consultation.treatment_type,
      photos: {
        front: consultation.photo_front ?? undefined,
        back: consultation.photo_back ?? undefined,
        side: consultation.photo_side ?? undefined,
      },
      analysisResult: consultation.analysis_result as ThreeViewAnalysisResult,
      chemicalRecords: [],
      notes: consultation.notes ?? '',
      createdAt: consultation.created_at,
    };

    return NextResponse.json<ApiResponse<Consultation>>({
      data: result,
      error: null,
    });
  } catch (error) {
    console.error('Comprehensive analysis error:', error);
    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: { code: 'ANALYSIS_FAILED', message: '종합 분석에 실패했습니다. 다시 시도해주세요.' },
    }, { status: 500 });
  }
}
