import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/openai';
import { getAuthUser, checkUsageLimit, incrementUsage } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { STYLE_TO_RECIPE_SYSTEM_PROMPT, getStyleToRecipePrompt } from '@/lib/prompts';
import type { StyleBasedRecipeResult, FiveViewAnalysisResult, ApiResponse } from '@/types';

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

    // Request body에서 선택한 스타일 정보 가져오기
    const body = await request.json();
    const { styleName, styleDescription, styleImageUrl, currentHairState } = body as {
      styleName: string;
      styleDescription: string;
      styleImageUrl: string;
      currentHairState: FiveViewAnalysisResult;
    };

    if (!styleName || !styleDescription || !currentHairState) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: { code: 'MISSING_PARAMS', message: '스타일 정보와 현재 모발 상태가 필요합니다.' },
        },
        { status: 400 }
      );
    }

    // GPT-4o로 레시피 생성
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: STYLE_TO_RECIPE_SYSTEM_PROMPT },
        { role: 'user', content: getStyleToRecipePrompt(styleName, styleDescription, currentHairState) },
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

    const recipeResult: StyleBasedRecipeResult = JSON.parse(content);
    // 스타일 이미지 URL 추가
    recipeResult.selectedStyle.imageUrl = styleImageUrl;

    // 사용량 증가
    await incrementUsage(user.id);

    // consultations 테이블에 저장
    const { data: consultationRow, error: consultationError } = await supabase
      .from('consultations')
      .insert({
        customer_id: customerId,
        designer_id: user.id,
        treatment_type: 'recipe',
        style_based_recipe: recipeResult,
        notes: `선택 스타일: ${styleName}`,
      })
      .select()
      .single();

    if (consultationError) {
      console.error('Consultation insert error:', consultationError);
    }

    return NextResponse.json<ApiResponse<{ id: string; recipe: StyleBasedRecipeResult }>>({
      data: {
        id: consultationRow?.id ?? '',
        recipe: recipeResult,
      },
      error: null,
    });
  } catch (error) {
    console.error('Style to recipe error:', error);
    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        error: { code: 'RECIPE_GENERATION_FAILED', message: '레시피 생성에 실패했습니다. 다시 시도해주세요.' },
      },
      { status: 500 }
    );
  }
}
