import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/openai';
import { getAuthUser, checkUsageLimit, incrementUsage } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import {
  TIMELINE_ANALYSIS_SYSTEM_PROMPT,
  getTimelineAnalysisPrompt,
  getDallePrompt,
} from '@/lib/prompts';
import type { TimelineResult, ApiResponse } from '@/types';

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
    const { treatmentImage, treatmentType } = body as {
      treatmentImage: string;
      treatmentType: 'color' | 'cut' | 'perm';
    };

    if (!treatmentImage || !treatmentType) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: { code: 'MISSING_INPUT', message: '시술 완료 사진과 시술 종류가 필요합니다.' },
      }, { status: 400 });
    }

    if (!['color', 'cut', 'perm'].includes(treatmentType)) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: { code: 'INVALID_TYPE', message: '시술 종류는 color, cut, perm 중 하나여야 합니다.' },
      }, { status: 400 });
    }

    // Step 1: GPT-4o Vision으로 현재 상태 분석 + DALL-E 프롬프트 생성
    const openai = getOpenAI();
    const analysisResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: TIMELINE_ANALYSIS_SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: getTimelineAnalysisPrompt(treatmentType) },
            {
              type: 'image_url',
              image_url: {
                url: treatmentImage.startsWith('data:')
                  ? treatmentImage
                  : `data:image/jpeg;base64,${treatmentImage}`,
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_tokens: 2000,
      temperature: 0.4,
      response_format: { type: 'json_object' },
    });

    const analysisContent = analysisResponse.choices[0]?.message?.content;
    if (!analysisContent) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: { code: 'AI_NO_RESPONSE', message: 'AI 분석 응답을 받지 못했습니다.' },
      }, { status: 500 });
    }

    const analysis = JSON.parse(analysisContent);

    // Step 2: DALL-E 3로 각 시점의 변화 이미지 생성
    const imagePromises = analysis.predictions.map(
      async (pred: { week: number; label: string; dallePrompt: string; description: string }) => {
        try {
          const imageResponse = await openai.images.generate({
            model: 'dall-e-3',
            prompt: getDallePrompt(pred.dallePrompt, pred.label),
            n: 1,
            size: '1024x1024',
            quality: 'standard',
          });

          return {
            week: pred.week,
            label: pred.label,
            imageUrl: imageResponse.data?.[0]?.url ?? '',
            description: pred.description,
          };
        } catch (imgError) {
          console.error(`DALL-E generation failed for week ${pred.week}:`, imgError);
          return {
            week: pred.week,
            label: pred.label,
            imageUrl: '',
            description: pred.description,
          };
        }
      }
    );

    const predictions = await Promise.all(imagePromises);

    const result: TimelineResult = {
      treatmentType,
      currentAnalysis: analysis.currentAnalysis,
      predictions,
      revisitRecommendation: analysis.revisitRecommendation,
    };

    // 사용량 증가
    await incrementUsage(user.id);

    // DB에 결과 저장
    const supabase = await createClient();
    await supabase.from('timelines').insert({
      user_id: user.id,
      treatment_type: treatmentType,
      result_images: result,
    });

    return NextResponse.json<ApiResponse<TimelineResult>>({
      data: result,
      error: null,
    });
  } catch (error) {
    console.error('Timeline API error:', error);
    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: { code: 'TIMELINE_FAILED', message: '타임라인 생성에 실패했습니다. 다시 시도해주세요.' },
    }, { status: 500 });
  }
}
