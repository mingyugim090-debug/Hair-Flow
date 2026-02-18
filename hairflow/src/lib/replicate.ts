import Replicate from 'replicate';

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

/** Replicate 에러를 사용자 친화적으로 분류 */
function classifyReplicateError(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    const status =
        (error as { status?: number })?.status ??
        (error as { statusCode?: number })?.statusCode;

    if (status === 402 || status === 429 || message.includes('insufficient') || message.includes('spending limit') || message.includes('quota')) {
        return '💳 AI 이미지 생성 크레딧이 부족합니다. Replicate 대시보드에서 크레딧을 충전해주세요.';
    }
    if (status === 401 || message.includes('Unauthenticated') || message.includes('api_token')) {
        return '🔑 Replicate API 토큰이 유효하지 않습니다. 설정을 확인해주세요.';
    }
    if (message.includes('timeout') || message.includes('TIMEOUT') || message.includes('timed out')) {
        return '⏱ AI 이미지 생성 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.';
    }
    return '⚠️ AI 이미지 생성에 실패했습니다. 분석 결과는 텍스트로 확인할 수 있습니다.';
}

/**
 * ControlNet (Canny) + SDXL을 사용한 타임라인 이미지 생성
 * 실패 시 빈 문자열을 반환합니다 (throw 하지 않음).
 */
export async function generateTimelineImage(
    sourceImageUrl: string,
    prompt: string,
    strength: number = 0.5
): Promise<string> {
    if (!process.env.REPLICATE_API_TOKEN) {
        console.warn('REPLICATE_API_TOKEN 환경변수 미설정 — 이미지 생성 건너뜀');
        return '';
    }

    try {
        const output = await replicate.run(
            'lucataco/sdxl-controlnet:db2ffdbdc7f6cb4d691c0c1aedb3dadf208dd110e5a70d4497a65acf8b076c62',
            {
                input: {
                    image: sourceImageUrl,
                    prompt: `${prompt}. Ultra-realistic photograph, professional salon lighting, natural hair texture, Canon EOS R5, 85mm f/1.4, no text, no watermarks`,
                    negative_prompt:
                        'cartoon, illustration, painting, drawing, anime, unrealistic, deformed face, extra fingers, blurry, low quality, text, watermark, logo, mutated hands, poorly drawn face, disfigured, oversaturated, cropped',
                    num_inference_steps: 25,
                    guidance_scale: 7.0,
                    controlnet_conditioning_scale: strength > 0.5 ? 0.6 : 0.8,
                    seed: 42,
                },
            }
        );

        if (Array.isArray(output) && output.length > 0) {
            return String(output[0]);
        }
        if (typeof output === 'string') {
            return output;
        }

        console.error('Unexpected Replicate output format:', output);
        return '';
    } catch (error) {
        const userMessage = classifyReplicateError(error);
        console.error('Replicate ControlNet 이미지 생성 실패:', userMessage, error);
        return '';
    }
}

/**
 * 주차(week)에 따른 변화 강도(strength) 계산
 */
export function getTimelineStrength(week: number): number {
    if (week <= 1) return 0.3;
    if (week <= 2) return 0.4;
    if (week <= 4) return 0.5;
    if (week <= 6) return 0.6;
    return 0.7;
}

/** Replicate 에러 분류 유틸 (라우트에서 사용) */
export { classifyReplicateError };
