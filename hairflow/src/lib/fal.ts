import { fal } from '@fal-ai/client';

// Fal.ai 초기화 (API 키 설정)
if (process.env.FAL_KEY) {
    fal.config({ credentials: process.env.FAL_KEY });
}

interface FalImageResult {
    url: string;
    content_type: string;
}

interface FalResponse {
    images: FalImageResult[];
    seed: number;
    prompt: string;
}

/** 이미지 생성 실패 사유를 사용자 친화적으로 분류 */
function classifyFalError(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    const status =
        (error as { status?: number })?.status ??
        (error as { statusCode?: number })?.statusCode;

    if (status === 402 || status === 429 || message.includes('insufficient') || message.includes('quota') || message.includes('credit')) {
        return '💳 AI 이미지 생성 크레딧이 부족합니다. Fal.ai 대시보드에서 크레딧을 충전해주세요.';
    }
    if (status === 401 || message.includes('unauthorized') || message.includes('api key')) {
        return '🔑 AI 이미지 API 키가 유효하지 않습니다. 설정을 확인해주세요.';
    }
    if (message.includes('timeout') || message.includes('TIMEOUT')) {
        return '⏱ AI 이미지 생성 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.';
    }
    return '⚠️ AI 이미지 생성에 실패했습니다. 분석 결과는 텍스트로 확인할 수 있습니다.';
}

/**
 * Flux.1 Pro를 사용하여 헤어 스타일 이미지를 생성합니다.
 * 실패 시 빈 문자열을 반환합니다 (throw 하지 않음).
 */
export async function generateHairImage(
    prompt: string,
    size: 'square_hd' | 'square' | 'portrait_4_3' | 'landscape_4_3' = 'square_hd'
): Promise<string> {
    if (!process.env.FAL_KEY) {
        console.warn('FAL_KEY 환경변수 미설정 — 이미지 생성 건너뜀');
        return '';
    }

    try {
        const result = await fal.subscribe('fal-ai/flux-pro/v1.1', {
            input: {
                prompt,
                image_size: size,
                num_images: 1,
                output_format: 'jpeg' as const,
                safety_tolerance: '5' as const,
            },
        });

        const data = result.data as FalResponse;
        return data.images?.[0]?.url ?? '';
    } catch (error) {
        const userMessage = classifyFalError(error);
        console.error('Flux.1 Pro 이미지 생성 실패:', userMessage, error);
        return '';
    }
}

/**
 * 여러 장의 헤어 이미지를 병렬로 생성합니다.
 */
export async function generateMultipleHairImages(
    prompts: string[]
): Promise<string[]> {
    const results = await Promise.allSettled(
        prompts.map((prompt) => generateHairImage(prompt))
    );

    return results.map((result) =>
        result.status === 'fulfilled' ? result.value : ''
    );
}

/**
 * IP-Adapter Face ID를 사용하여 고객 얼굴 + 헤어스타일 합성 이미지를 생성합니다.
 * 실패 시 빈 문자열을 반환합니다 (throw 하지 않음).
 */
export async function generateStyledFaceImage(
    faceImageUrl: string,
    prompt: string
): Promise<string> {
    if (!process.env.FAL_KEY) {
        console.warn('FAL_KEY 환경변수 미설정 — 얼굴 합성 건너뜀');
        return '';
    }

    try {
        const result = await fal.subscribe('fal-ai/ip-adapter-face-id', {
            input: {
                prompt: `Professional salon portrait photograph. ${prompt}. Ultra-realistic, high quality, natural lighting, fashion magazine quality, no text, no watermarks`,
                face_image_url: faceImageUrl,
                negative_prompt:
                    'cartoon, illustration, painting, drawing, anime, unrealistic, deformed, blurry, low quality, text, watermark, logo, extra fingers, mutated hands, poorly drawn face, disfigured, oversaturated, cropped, out of frame',
                model_type: 'SDXL-v2-plus' as const,
                num_inference_steps: 25,
                guidance_scale: 7.5,
                num_samples: 1,
                width: 768,
                height: 768,
                seed: 42,
            },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = result.data as any;
        if (data.images && Array.isArray(data.images) && data.images.length > 0) {
            return data.images[0].url ?? '';
        }
        if (data.image?.url) {
            return data.image.url;
        }
        return '';
    } catch (error) {
        const userMessage = classifyFalError(error);
        console.error('IP-Adapter Face ID 이미지 생성 실패:', userMessage, error);
        return '';
    }
}

/**
 * 외부 이미지 URL을 Fal.ai CDN에 업로드하여 접근 가능한 URL로 변환합니다.
 * Supabase Storage 등 Fal.ai가 직접 접근할 수 없는 URL을 프록시합니다.
 */
async function uploadToFalCdn(imageUrl: string): Promise<string> {
    const response = await fetch(imageUrl);
    if (!response.ok) {
        throw new Error(`이미지 다운로드 실패: ${response.status}`);
    }
    const blob = await response.blob();
    const file = new File([blob], 'input.jpg', { type: blob.type || 'image/jpeg' });
    const falCdnUrl = await fal.storage.upload(file);
    return falCdnUrl;
}

/**
 * Flux Kontext Pro (fal-ai/flux-pro/kontext) 사용
 * 컨텍스트 인식 편집으로 얼굴·옷·배경은 100% 보존, 헤어스타일만 변경.
 * 실패 시 빈 문자열을 반환합니다 (throw 하지 않음).
 */
export async function generateHairImageFromFace(
    faceImageUrl: string,
    hairStylePrompt: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _size?: 'square_hd' | 'square' | 'portrait_4_3' | 'landscape_4_3'
): Promise<string> {
    if (!process.env.FAL_KEY) {
        console.warn('FAL_KEY 환경변수 미설정 — 얼굴 기반 이미지 생성 건너뜀');
        return '';
    }

    try {
        // Fal.ai가 직접 접근할 수 없는 URL(Supabase 등)을 Fal CDN으로 프록시
        console.log('Fal CDN에 이미지 업로드 중...');
        const accessibleUrl = await uploadToFalCdn(faceImageUrl);
        console.log('Fal CDN 업로드 완료:', accessibleUrl);

        const result = await fal.subscribe('fal-ai/flux-pro/kontext', {
            input: {
                image_url: accessibleUrl,
                prompt: `Change this person's hairstyle to: ${hairStylePrompt}. Keep the face, facial features, expression, skin tone, clothing, and background exactly the same. Only modify the hair.`,
            },
        });

        const data = result.data as FalResponse;
        return data.images?.[0]?.url ?? '';
    } catch (error) {
        const userMessage = classifyFalError(error);
        console.error('Kontext Pro 이미지 생성 실패:', userMessage, error);
        return '';
    }
}

/** Fal.ai 에러 분류 유틸 (라우트에서 사용) */
export { classifyFalError };
