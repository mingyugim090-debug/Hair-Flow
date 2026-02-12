import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/openai';
import { getAuthUser, checkUsageLimit, incrementUsage } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { CUSTOMER_ANALYSIS_SYSTEM_PROMPT, CUSTOMER_ANALYSIS_USER_PROMPT } from '@/lib/prompts';
import type { CustomerAnalysisResult, CustomerTimeline, ApiResponse } from '@/types';

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

    // 해당 고객이 본인의 고객인지 확인
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

    // FormData에서 이미지 파일 추출
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;

    if (!imageFile) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: { code: 'MISSING_IMAGE', message: '모발 사진을 업로드해주세요.' },
      }, { status: 400 });
    }

    // 파일 검증
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (imageFile.size > maxSize) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: { code: 'FILE_TOO_LARGE', message: '이미지 크기는 10MB 이하여야 합니다.' },
      }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(imageFile.type)) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: { code: 'INVALID_FORMAT', message: 'JPG, PNG, WebP 형식만 지원합니다.' },
      }, { status: 400 });
    }

    // 파일을 Buffer로 읽기
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${imageFile.type};base64,${base64}`;

    // Supabase Storage에 업로드 (designers/{uid}/{customerId}/{timestamp}.ext)
    const ext = imageFile.name.split('.').pop() ?? 'jpg';
    const fileName = `designers/${user.id}/${customerId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('customer-photos')
      .upload(fileName, buffer, {
        contentType: imageFile.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: { code: 'UPLOAD_FAILED', message: '사진 업로드에 실패했습니다.' },
      }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from('customer-photos')
      .getPublicUrl(fileName);

    const imageUrl = urlData.publicUrl;

    // GPT-4o Vision으로 모발 분석
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: CUSTOMER_ANALYSIS_SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: CUSTOMER_ANALYSIS_USER_PROMPT },
            {
              type: 'image_url',
              image_url: { url: dataUrl, detail: 'high' },
            },
          ],
        },
      ],
      max_tokens: 2000,
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

    const analysisResult: CustomerAnalysisResult = JSON.parse(content);

    // 사용량 증가
    await incrementUsage(user.id);

    // timelines 테이블에 분석 결과 저장
    const { data: timelineRow, error: timelineError } = await supabase
      .from('timelines')
      .insert({
        user_id: user.id,
        customer_id: customerId,
        treatment_image_url: imageUrl,
        treatment_type: 'analysis',
        result_images: analysisResult,
        revisit_recommendation: `${analysisResult.recipe.revisitWeeks}주 후 재방문 권장`,
      })
      .select()
      .single();

    if (timelineError) {
      console.error('Timeline insert error:', timelineError);
    }

    // recipes 테이블에 레시피 저장
    const { error: recipeError } = await supabase
      .from('recipes')
      .insert({
        user_id: user.id,
        customer_id: customerId,
        current_image_url: imageUrl,
        result: analysisResult.recipe,
      });

    if (recipeError) {
      console.error('Recipe insert error:', recipeError);
    }

    const timeline: CustomerTimeline = {
      id: timelineRow?.id ?? '',
      customerId,
      imageUrl,
      analysis: analysisResult,
      createdAt: timelineRow?.created_at ?? new Date().toISOString(),
    };

    return NextResponse.json<ApiResponse<CustomerTimeline>>({
      data: timeline,
      error: null,
    });
  } catch (error) {
    console.error('Customer analysis error:', error);
    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: { code: 'ANALYSIS_FAILED', message: '모발 분석에 실패했습니다. 다시 시도해주세요.' },
    }, { status: 500 });
  }
}
