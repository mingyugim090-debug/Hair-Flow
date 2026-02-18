import { SupabaseClient } from '@supabase/supabase-js';

/**
 * AI 생성 이미지를 Supabase Storage에 영구 저장합니다.
 *
 * Fal.ai / Replicate 가 반환하는 임시 URL의 이미지를 다운로드하여
 * customer-photos 버킷에 업로드하고- 영구 public URL을 반환합니다.
 *
 * @param supabase - Supabase 클라이언트
 * @param tempUrl  - AI가 반환한 임시 이미지 URL
 * @param path     - 버킷 내 저장 경로 (예: "ai-generated/timeline/abc-week1.jpg")
 * @returns 영구 public URL (실패 시 원본 tempUrl 반환)
 */
export async function cacheGeneratedImage(
    supabase: SupabaseClient,
    tempUrl: string,
    path: string
): Promise<string> {
    if (!tempUrl) return '';

    try {
        // 1. 임시 URL에서 이미지 다운로드 (12초 타임아웃)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);
        let response: Response;
        try {
            response = await fetch(tempUrl, { signal: controller.signal });
        } finally {
            clearTimeout(timeoutId);
        }

        if (!response.ok) {
            console.error(`이미지 다운로드 실패: ${response.status}`);
            return tempUrl;
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Content-Type 감지 (기본 jpeg)
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        // 2. Supabase Storage에 업로드
        const { error: uploadError } = await supabase.storage
            .from('customer-photos')
            .upload(path, buffer, {
                contentType,
                upsert: true, // 동일 경로면 덮어쓰기
            });

        if (uploadError) {
            console.error('Storage 업로드 실패:', uploadError);
            return tempUrl; // 실패 시 원본 URL 반환
        }

        // 3. 영구 Public URL 반환 (customer-photos 버킷은 public)
        const { data: urlData } = supabase.storage
            .from('customer-photos')
            .getPublicUrl(path);

        if (!urlData?.publicUrl) {
            console.error('Public URL 생성 실패');
            return tempUrl;
        }

        return urlData.publicUrl;
    } catch (error) {
        console.error('이미지 캐싱 실패:', error);
        return tempUrl; // 에러 시 원본 URL로 fallback
    }
}
