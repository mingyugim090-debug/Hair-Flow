import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/openai';
import { getAuthUser, checkUsageLimit, incrementUsage } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { RECIPE_SYSTEM_PROMPT, RECIPE_USER_PROMPT } from '@/lib/prompts';
import type { RecipeResult, ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // 인증 체크
    const { user, error: authError } = await getAuthUser();
    if (!user || authError) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: { code: 'UNAUTHORIZED', message: authError ?? '로그인이 필요합니다.' },
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

    const body = await request.json();
    const { currentImage, referenceImage } = body as {
      currentImage: string;
      referenceImage: string;
    };

    if (!currentImage || !referenceImage) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: { code: 'MISSING_IMAGES', message: '현재 모발 사진과 레퍼런스 사진 모두 필요합니다.' },
      }, { status: 400 });
    }

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: RECIPE_SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: RECIPE_USER_PROMPT },
            {
              type: 'image_url',
              image_url: {
                url: currentImage.startsWith('data:')
                  ? currentImage
                  : `data:image/jpeg;base64,${currentImage}`,
                detail: 'high',
              },
            },
            {
              type: 'image_url',
              image_url: {
                url: referenceImage.startsWith('data:')
                  ? referenceImage
                  : `data:image/jpeg;base64,${referenceImage}`,
                detail: 'high',
              },
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

    const recipe: RecipeResult = JSON.parse(content);

    // 사용량 증가
    await incrementUsage(user.id);

    // DB에 결과 저장
    const supabase = await createClient();
    await supabase.from('recipes').insert({
      user_id: user.id,
      result: recipe,
    });

    return NextResponse.json<ApiResponse<RecipeResult>>({
      data: recipe,
      error: null,
    });
  } catch (error) {
    console.error('Recipe API error:', error);
    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: { code: 'RECIPE_FAILED', message: '시술 레시피 생성에 실패했습니다. 다시 시도해주세요.' },
    }, { status: 500 });
  }
}
