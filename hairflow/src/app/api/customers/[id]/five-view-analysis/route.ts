import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/openai';
import { getAuthUser, checkUsageLimit, incrementUsage } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { FIVE_VIEW_ANALYSIS_SYSTEM_PROMPT, FIVE_VIEW_ANALYSIS_USER_PROMPT } from '@/lib/prompts';
import type { FiveViewAnalysisResult, ApiResponse } from '@/types';

export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 인증 체크
    const { user, error: authError } = await getAuthUser();
    if (!user || authError) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' },
        },
        { status: 401 }
      );
    }

    // 사용량 체크
    const { allowed, remaining } = await checkUsageLimit(user.id);
    if (!allowed) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: {
            code: 'USAGE_LIMIT',
            message: `오늘의 무료 분석 횟수(${remaining}건)를 모두 사용했습니다. 업그레이드하시면 무제한으로 이용할 수 있어요!`,
          },
        },
        { status: 429 }
      );
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
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: { code: 'NOT_FOUND', message: '고객을 찾을 수 없습니다.' },
        },
        { status: 404 }
      );
    }

    // FormData에서 앞면 사진 추출
    const formData = await request.formData();
    const frontFile = formData.get('front') as File | null;

    if (!frontFile) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: { code: 'MISSING_IMAGES', message: '앞면 사진을 업로드해주세요.' },
        },
        { status: 400 }
      );
    }

    // 파일 검증
    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (frontFile.size > maxSize) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: { code: 'FILE_TOO_LARGE', message: '이미지 크기는 10MB 이하여야 합니다.' },
        },
        { status: 400 }
      );
    }

    if (!allowedTypes.includes(frontFile.type)) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: { code: 'INVALID_FORMAT', message: 'JPG, PNG, WebP 형식만 지원합니다.' },
        },
        { status: 400 }
      );
    }

    // Supabase Storage에 앞면 사진 업로드
    const ext = frontFile.name.split('.').pop() ?? 'jpg';
    const fileName = `designers/${user.id}/${customerId}/front_${Date.now()}.${ext}`;

    const bytes = await frontFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { error: uploadError } = await supabase.storage
      .from('customer-photos')
      .upload(fileName, buffer, {
        contentType: frontFile.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: { code: 'UPLOAD_FAILED', message: '사진 업로드에 실패했습니다.' },
        },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage.from('customer-photos').getPublicUrl(fileName);
    const frontPhotoUrl = urlData.publicUrl;

    // 파일을 base64로 변환 (GPT-4o Vision 전송용)
    const base64Front = `data:${frontFile.type};base64,${buffer.toString('base64')}`;

    // GPT-4o-mini Vision으로 앞면 사진 분석
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: FIVE_VIEW_ANALYSIS_SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: '고객 앞면 사진:' },
            { type: 'image_url', image_url: { url: base64Front, detail: 'high' } },
            { type: 'text', text: FIVE_VIEW_ANALYSIS_USER_PROMPT },
          ],
        },
      ],
      max_tokens: 3000,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: { code: 'AI_NO_RESPONSE', message: 'AI 응답을 받지 못했습니다. 다시 시도해주세요.' },
        },
        { status: 500 }
      );
    }

    const analysisResult: FiveViewAnalysisResult = JSON.parse(content);

    // 사용량 증가
    await incrementUsage(user.id);

    // 세션 번호 계산 (기존 최대값 + 1)
    const { data: maxSession } = await supabase
      .from('consultations')
      .select('session_number')
      .eq('customer_id', customerId)
      .order('session_number', { ascending: false })
      .limit(1)
      .single();

    const nextSessionNumber = (maxSession?.session_number ?? 0) + 1;

    // consultations 테이블에 저장 (앞면 사진만)
    const { data: consultationRow, error: consultationError } = await supabase
      .from('consultations')
      .insert({
        customer_id: customerId,
        designer_id: user.id,
        session_number: nextSessionNumber,
        treatment_type: 'five-view-analysis',
        photo_front: frontPhotoUrl,
        five_view_analysis: analysisResult,
        notes: '앞면 사진 AI 종합 분석',
      })
      .select()
      .single();

    if (consultationError) {
      console.error('Consultation insert error:', consultationError);
    }

    return NextResponse.json<ApiResponse<{ id: string; analysis: FiveViewAnalysisResult; photos: Record<string, string> }>>({
      data: {
        id: consultationRow?.id ?? '',
        analysis: analysisResult,
        photos: { front: frontPhotoUrl },
      },
      error: null,
    });
  } catch (error) {
    console.error('Photo analysis error:', error);
    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        error: { code: 'ANALYSIS_FAILED', message: '사진 분석에 실패했습니다. 다시 시도해주세요.' },
      },
      { status: 500 }
    );
  }
}
