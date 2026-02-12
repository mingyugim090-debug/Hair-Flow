import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser();
    if (!user || authError) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' },
      }, { status: 401 });
    }

    const body = await request.json();
    const { shopName, designerName, instagramId, specialties, bio } = body as {
      shopName: string;
      designerName: string;
      instagramId?: string;
      specialties?: string[];
      bio?: string;
    };

    if (!shopName?.trim() || !designerName?.trim()) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: { code: 'VALIDATION_ERROR', message: '매장명과 디자이너명은 필수입니다.' },
      }, { status: 400 });
    }

    const supabase = await createClient();
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        shop_name: shopName.trim(),
        designer_name: designerName.trim(),
        instagram_id: instagramId?.trim()?.replace(/^@/, '') || null,
        specialties: specialties ?? [],
        bio: bio?.trim() || null,
        is_onboarded: true,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Onboarding update error:', updateError);
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: { code: 'UPDATE_FAILED', message: '프로필 저장에 실패했습니다.' },
      }, { status: 500 });
    }

    return NextResponse.json<ApiResponse<{ success: boolean }>>({
      data: { success: true },
      error: null,
    });
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: { code: 'SERVER_ERROR', message: '서버 오류가 발생했습니다.' },
    }, { status: 500 });
  }
}
