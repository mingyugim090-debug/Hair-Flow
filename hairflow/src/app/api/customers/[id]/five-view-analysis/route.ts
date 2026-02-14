import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/openai';
import { getAuthUser, checkUsageLimit, incrementUsage } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { FIVE_VIEW_ANALYSIS_SYSTEM_PROMPT, FIVE_VIEW_ANALYSIS_USER_PROMPT } from '@/lib/prompts';
import type { FiveViewAnalysisResult, ApiResponse } from '@/types';

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

    // FormData에서 5면 사진 추출
    const formData = await request.formData();
    const frontFile = formData.get('front') as File | null;
    const backFile = formData.get('back') as File | null;
    const leftFile = formData.get('left') as File | null;
    const rightFile = formData.get('right') as File | null;
    const topFile = formData.get('top') as File | null;

    if (!frontFile || !backFile || !leftFile || !rightFile || !topFile) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: { code: 'MISSING_IMAGES', message: '5면 사진을 모두 업로드해주세요. (앞/뒤/좌/우/윗)' },
        },
        { status: 400 }
      );
    }

    // 파일 검증
    const files = [frontFile, backFile, leftFile, rightFile, topFile];
    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    for (const file of files) {
      if (file.size > maxSize) {
        return NextResponse.json<ApiResponse<null>>(
          {
            data: null,
            error: { code: 'FILE_TOO_LARGE', message: '이미지 크기는 10MB 이하여야 합니다.' },
          },
          { status: 400 }
        );
      }

      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json<ApiResponse<null>>(
          {
            data: null,
            error: { code: 'INVALID_FORMAT', message: 'JPG, PNG, WebP 형식만 지원합니다.' },
          },
          { status: 400 }
        );
      }
    }

    // Supabase Storage에 업로드
    const uploadedUrls: Record<string, string> = {};
    const photoPositions = ['front', 'back', 'left', 'right', 'top'];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const position = photoPositions[i];
      const ext = file.name.split('.').pop() ?? 'jpg';
      const fileName = `designers/${user.id}/${customerId}/five-view_${position}_${Date.now()}.${ext}`;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const { error: uploadError } = await supabase.storage
        .from('customer-photos')
        .upload(fileName, buffer, {
          contentType: file.type,
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
      uploadedUrls[position] = urlData.publicUrl;
    }

    // 파일을 base64로 변환 (GPT-4o Vision 전송용)
    const base64Images: Record<string, string> = {};
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const position = photoPositions[i];
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = buffer.toString('base64');
      base64Images[position] = `data:${file.type};base64,${base64}`;
    }

    // GPT-4o Vision으로 5면 사진 분석
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: FIVE_VIEW_ANALYSIS_SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: '앞면 사진:' },
            { type: 'image_url', image_url: { url: base64Images.front, detail: 'high' } },
            { type: 'text', text: '뒷면 사진:' },
            { type: 'image_url', image_url: { url: base64Images.back, detail: 'high' } },
            { type: 'text', text: '좌측면 사진:' },
            { type: 'image_url', image_url: { url: base64Images.left, detail: 'high' } },
            { type: 'text', text: '우측면 사진:' },
            { type: 'image_url', image_url: { url: base64Images.right, detail: 'high' } },
            { type: 'text', text: '윗면(정수리) 사진:' },
            { type: 'image_url', image_url: { url: base64Images.top, detail: 'high' } },
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

    // consultations 테이블에 저장
    const { data: consultationRow, error: consultationError } = await supabase
      .from('consultations')
      .insert({
        customer_id: customerId,
        designer_id: user.id,
        treatment_type: 'analysis',
        photo_front: uploadedUrls.front,
        photo_back: uploadedUrls.back,
        photo_left: uploadedUrls.left,
        photo_right: uploadedUrls.right,
        photo_top: uploadedUrls.top,
        five_view_analysis: analysisResult,
        notes: '5면 사진 종합 분석',
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
        photos: uploadedUrls,
      },
      error: null,
    });
  } catch (error) {
    console.error('Five-view analysis error:', error);
    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        error: { code: 'ANALYSIS_FAILED', message: '5면 사진 분석에 실패했습니다. 다시 시도해주세요.' },
      },
      { status: 500 }
    );
  }
}
