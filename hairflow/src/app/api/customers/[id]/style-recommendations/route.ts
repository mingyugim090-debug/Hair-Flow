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
    imagePrompt: string;
    description: string;
    suitability: number;
    difficulty: 'easy' | 'medium' | 'hard';
    estimatedTime: string;
    matchReason: string;
  }[];
  faceShapeNote: string;
}

export const maxDuration = 60; // Fal.ai 이미지 생성 시간 확보 (Vercel 최대 60s)

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
    const { fiveViewAnalysis, frontPhotoUrl } = body as {
      fiveViewAnalysis: FiveViewAnalysisResult;
      frontPhotoUrl?: string;
    };

    if (!fiveViewAnalysis) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: { code: 'MISSING_ANALYSIS', message: '5면 사진 분석 결과가 필요합니다.' },
        },
        { status: 400 }
      );
    }

    // GPT-4o-mini Vision으로 스타일 추천 (앞면 사진 포함 시 고객 외모 파악)
    const openai = getOpenAI();

    // frontPhotoUrl이 있으면 Vision으로 고객 얼굴을 직접 분석하여 imagePrompt에 외모 반영
    type UserContentPart =
      | { type: 'image_url'; image_url: { url: string; detail: 'low' } }
      | { type: 'text'; text: string };

    const userContent: string | UserContentPart[] = frontPhotoUrl
      ? [
        {
          type: 'image_url' as const,
          image_url: { url: frontPhotoUrl, detail: 'low' as const },
        },
        {
          type: 'text' as const,
          text: getStyleRecommendationPrompt(fiveViewAnalysis),
        },
      ]
      : getStyleRecommendationPrompt(fiveViewAnalysis);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: STYLE_RECOMMENDATION_SYSTEM_PROMPT },
        { role: 'user', content: userContent },
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

    // 이미지 생성: 얼굴 사진이 있으면 IP-Adapter FaceID (얼굴 보존), 없으면 FLUX Pro
    const { generateHairImage, generateStyledFaceImage } = await import('@/lib/fal');
    const { cacheGeneratedImage } = await import('@/lib/storage');
    // Admin Client 초기화 (한 번만)
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const adminSupabase = createAdminClient();

    const recommendationsWithImages = await Promise.all(
      styleRecommendation.recommendations.map(async (rec, index) => {
        try {
          let generatedImageUrl: string;

          if (frontPhotoUrl) {
            // 얼굴 사진 있음: IP-Adapter Face ID로 얼굴 보존 + 헤어스타일 변경 (30s 타임아웃)
            // (Flux Img2Img는 얼굴이 너무 많이 바뀌어서 IP-Adapter로 롤백)
            generatedImageUrl = await Promise.race<string>([
              generateStyledFaceImage(frontPhotoUrl, rec.imagePrompt),
              new Promise<string>((resolve) => setTimeout(() => resolve(''), 30000)),
            ]);
          } else {
            // 얼굴 사진 없음: text-to-image 폴백 (20s 타임아웃)
            const fluxPrompt = `Ultra-realistic professional salon portrait photograph. ${rec.imagePrompt}. Shot with Canon EOS R5, 85mm f/1.4 lens. Soft studio lighting, individual hair strands visible. Fashion magazine quality, no text or watermarks.`;
            generatedImageUrl = await Promise.race<string>([
              generateHairImage(fluxPrompt),
              new Promise<string>((resolve) => setTimeout(() => resolve(''), 20000)),
            ]);
          }

          // Supabase Storage에 영구 저장: 12초 타임아웃 (초과 시 원본 URL 유지)
          if (generatedImageUrl) {
            const urlToCache = generatedImageUrl;
            generatedImageUrl = await Promise.race<string>([
              cacheGeneratedImage(
                adminSupabase,
                urlToCache,
                `ai-generated/style/${customerId}-${index}-${Date.now()}.jpg`
              ),
              new Promise<string>((resolve) => setTimeout(() => resolve(urlToCache), 12000)),
            ]);
          }

          return {
            id: rec.id,
            name: rec.name,
            imageUrl: generatedImageUrl,
            imagePrompt: rec.imagePrompt,
            description: rec.description,
            suitability: rec.suitability,
            difficulty: rec.difficulty,
            estimatedTime: rec.estimatedTime,
            matchReason: rec.matchReason,
          };
        } catch (error) {
          console.error(`스타일 이미지 생성 실패 (${rec.name}):`, error);
          return {
            id: rec.id,
            name: rec.name,
            imageUrl: '',
            imagePrompt: rec.imagePrompt,
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

    // 이미지 생성 실패 여부 체크
    const imageGenerationFailed = recommendationsWithImages.some(r => !r.imageUrl);

    // 현재 세션 번호 가져오기 (가장 최근 세션 번호)
    const { data: latestSession } = await adminSupabase
      .from('consultations')
      .select('session_number')
      .eq('customer_id', customerId)
      .not('session_number', 'is', null) // Ensure we get a valid session
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const currentSessionNumber = latestSession?.session_number ?? 1;

    // 사용량 증가
    await incrementUsage(user.id);

    // consultations 테이블에 저장
    const { data: consultationRow, error: consultationError } = await adminSupabase
      .from('consultations')
      .insert({
        customer_id: customerId,
        designer_id: user.id,
        session_number: currentSessionNumber,
        treatment_type: 'style-recommendation',
        style_recommendations: result,
        notes: 'AI 스타일 추천',
      })
      .select()
      .single();

    if (consultationError) {
      console.error('Consultation insert error:', consultationError);
    }

    return NextResponse.json<ApiResponse<{ id: string; styleRecommendations: StyleRecommendationResult; imageGenerationFailed: boolean }>>({
      data: {
        id: consultationRow?.id ?? '',
        styleRecommendations: result,
        imageGenerationFailed,
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
