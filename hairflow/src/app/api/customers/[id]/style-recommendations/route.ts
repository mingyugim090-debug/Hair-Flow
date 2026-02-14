import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/openai';
import { getAuthUser, checkUsageLimit, incrementUsage } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { STYLE_RECOMMENDATION_SYSTEM_PROMPT, getStyleRecommendationPrompt } from '@/lib/prompts';
import type { StyleRecommendationResult, FiveViewAnalysisResult, ApiResponse } from '@/types';

interface StyleRecommendationResponse {
  currentAnalysis: string;
  recommendations: {
    id: string;
    name: string;
    dallePrompt: string;
    description: string;
    suitability: number;
    difficulty: 'easy' | 'medium' | 'hard';
    estimatedTime: string;
    matchReason: string;
  }[];
  faceShapeNote: string;
}

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

    // Request body에서 5면 분석 결과 가져오기
    const body = await request.json();
    const { fiveViewAnalysis } = body as { fiveViewAnalysis: FiveViewAnalysisResult };

    if (!fiveViewAnalysis) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: { code: 'MISSING_ANALYSIS', message: '5면 사진 분석 결과가 필요합니다.' },
        },
        { status: 400 }
      );
    }

    // GPT-4o로 스타일 추천
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: STYLE_RECOMMENDATION_SYSTEM_PROMPT },
        { role: 'user', content: getStyleRecommendationPrompt(fiveViewAnalysis) },
      ],
      max_tokens: 3000,
      temperature: 0.5,
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

    const styleRecommendation: StyleRecommendationResponse = JSON.parse(content);

    // DALL-E 3로 각 스타일 이미지 생성
    const recommendationsWithImages = await Promise.all(
      styleRecommendation.recommendations.map(async (rec) => {
        try {
          const dalleResponse = await openai.images.generate({
            model: 'dall-e-3',
            prompt: `Professional hair salon photography. ${rec.dallePrompt}. High quality, natural lighting, realistic hair texture. No text or watermarks.`,
            n: 1,
            size: '1024x1024',
            quality: 'standard',
          });

          const generatedImageUrl = dalleResponse.data?.[0]?.url ?? '';

          return {
            id: rec.id,
            name: rec.name,
            imageUrl: generatedImageUrl,
            dallePrompt: rec.dallePrompt,
            description: rec.description,
            suitability: rec.suitability,
            difficulty: rec.difficulty,
            estimatedTime: rec.estimatedTime,
            matchReason: rec.matchReason,
          };
        } catch (error) {
          console.error(`DALL-E 이미지 생성 실패 (${rec.name}):`, error);
          return {
            id: rec.id,
            name: rec.name,
            imageUrl: '',
            dallePrompt: rec.dallePrompt,
            description: rec.description,
            suitability: rec.suitability,
            difficulty: rec.difficulty,
            estimatedTime: rec.estimatedTime,
            matchReason: rec.matchReason,
          };
        }
      })
    );

    const result: StyleRecommendationResult = {
      currentAnalysis: styleRecommendation.currentAnalysis,
      recommendations: recommendationsWithImages,
      faceShapeNote: styleRecommendation.faceShapeNote,
    };

    // 사용량 증가
    await incrementUsage(user.id);

    // consultations 테이블에 저장
    const { data: consultationRow, error: consultationError } = await supabase
      .from('consultations')
      .insert({
        customer_id: customerId,
        designer_id: user.id,
        treatment_type: 'style-recommendation',
        style_recommendations: result,
        notes: 'AI 스타일 추천',
      })
      .select()
      .single();

    if (consultationError) {
      console.error('Consultation insert error:', consultationError);
    }

    return NextResponse.json<ApiResponse<{ id: string; styleRecommendations: StyleRecommendationResult }>>({
      data: {
        id: consultationRow?.id ?? '',
        styleRecommendations: result,
      },
      error: null,
    });
  } catch (error) {
    console.error('Style recommendation error:', error);
    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        error: { code: 'RECOMMENDATION_FAILED', message: '스타일 추천에 실패했습니다. 다시 시도해주세요.' },
      },
      { status: 500 }
    );
  }
}
