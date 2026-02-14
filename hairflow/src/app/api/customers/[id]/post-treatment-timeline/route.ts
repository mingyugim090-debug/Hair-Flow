import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/openai';
import { getAuthUser, checkUsageLimit, incrementUsage } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { POST_TREATMENT_TIMELINE_SYSTEM_PROMPT, getPostTreatmentTimelinePrompt } from '@/lib/prompts';
import type { PostTreatmentTimeline, ApiResponse } from '@/types';

interface TimelineAnalysisResponse {
  treatmentType: 'cut' | 'perm' | 'color';
  completedPhotoUrl: string;
  currentAnalysis: string;
  weeklyPredictions: {
    week: number;
    label: string;
    dallePrompt: string;
    description: string;
    careTips: string[];
  }[];
  revisitRecommendation: {
    week: number;
    reason: string;
  };
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

    // FormData에서 시술 완료 사진 및 시술 타입 추출
    const formData = await request.formData();
    const completedPhotoFile = formData.get('completedPhoto') as File | null;
    const treatmentType = (formData.get('treatmentType') as string) || 'cut';

    if (!completedPhotoFile) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: { code: 'MISSING_PHOTO', message: '시술 완료 사진을 업로드해주세요.' },
        },
        { status: 400 }
      );
    }

    // 시술 타입 검증
    if (!['cut', 'perm', 'color'].includes(treatmentType)) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: { code: 'INVALID_TYPE', message: '시술 타입은 cut, perm, color 중 하나여야 합니다.' },
        },
        { status: 400 }
      );
    }

    // 파일 검증
    const maxSize = 10 * 1024 * 1024;
    if (completedPhotoFile.size > maxSize) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: { code: 'FILE_TOO_LARGE', message: '이미지 크기는 10MB 이하여야 합니다.' },
        },
        { status: 400 }
      );
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(completedPhotoFile.type)) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: { code: 'INVALID_FORMAT', message: 'JPG, PNG, WebP 형식만 지원합니다.' },
        },
        { status: 400 }
      );
    }

    // Supabase Storage에 업로드
    const ext = completedPhotoFile.name.split('.').pop() ?? 'jpg';
    const fileName = `designers/${user.id}/${customerId}/completed_${treatmentType}_${Date.now()}.${ext}`;

    const bytes = await completedPhotoFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${completedPhotoFile.type};base64,${base64}`;

    const { error: uploadError } = await supabase.storage
      .from('customer-photos')
      .upload(fileName, buffer, {
        contentType: completedPhotoFile.type,
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
    const completedPhotoUrl = urlData.publicUrl;

    // GPT-4o Vision으로 분석
    const openai = getOpenAI();
    const analysisResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: POST_TREATMENT_TIMELINE_SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: getPostTreatmentTimelinePrompt(treatmentType as 'cut' | 'perm' | 'color') },
            {
              type: 'image_url',
              image_url: { url: dataUrl, detail: 'high' },
            },
          ],
        },
      ],
      max_tokens: 3000,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const analysisContent = analysisResponse.choices[0]?.message?.content;
    if (!analysisContent) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: { code: 'AI_NO_RESPONSE', message: 'AI 분석 응답을 받지 못했습니다.' },
        },
        { status: 500 }
      );
    }

    const analysisResult: TimelineAnalysisResponse = JSON.parse(analysisContent);

    // DALL-E 3로 각 주차별 변화 이미지 생성
    const predictionsWithImages = await Promise.all(
      analysisResult.weeklyPredictions.map(async (pred) => {
        try {
          const dalleResponse = await openai.images.generate({
            model: 'dall-e-3',
            prompt: `Professional hair salon photography. ${pred.dallePrompt}. High quality, natural lighting, realistic hair texture showing natural changes over time. No text or watermarks.`,
            n: 1,
            size: '1024x1024',
            quality: 'standard',
          });

          const generatedImageUrl = dalleResponse.data?.[0]?.url ?? '';

          return {
            week: pred.week,
            label: pred.label,
            imageUrl: generatedImageUrl,
            description: pred.description,
            careTips: pred.careTips,
          };
        } catch (error) {
          console.error(`DALL-E 이미지 생성 실패 (${pred.label}):`, error);
          return {
            week: pred.week,
            label: pred.label,
            imageUrl: '',
            description: pred.description,
            careTips: pred.careTips,
          };
        }
      })
    );

    const timelineResult: PostTreatmentTimeline = {
      treatmentType: treatmentType as 'cut' | 'perm' | 'color',
      completedPhotoUrl,
      currentAnalysis: analysisResult.currentAnalysis,
      weeklyPredictions: predictionsWithImages,
      revisitRecommendation: analysisResult.revisitRecommendation,
    };

    // 사용량 증가
    await incrementUsage(user.id);

    // consultations 테이블에 저장
    const { data: consultationRow, error: consultationError } = await supabase
      .from('consultations')
      .insert({
        customer_id: customerId,
        designer_id: user.id,
        treatment_type: 'timeline',
        post_treatment_timeline: timelineResult,
        notes: `시술 후 타임라인 예측 (${treatmentType})`,
      })
      .select()
      .single();

    if (consultationError) {
      console.error('Consultation insert error:', consultationError);
    }

    return NextResponse.json<ApiResponse<{ id: string; timeline: PostTreatmentTimeline }>>({
      data: {
        id: consultationRow?.id ?? '',
        timeline: timelineResult,
      },
      error: null,
    });
  } catch (error) {
    console.error('Post-treatment timeline error:', error);
    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        error: { code: 'TIMELINE_PREDICTION_FAILED', message: '타임라인 예측에 실패했습니다. 다시 시도해주세요.' },
      },
      { status: 500 }
    );
  }
}
