import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse, UserProfile } from '@/types';

export async function GET() {
  try {
    const { user, error: authError } = await getAuthUser();
    if (!user || authError) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' },
      }, { status: 401 });
    }

    return NextResponse.json<ApiResponse<UserProfile>>({
      data: user,
      error: null,
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: { code: 'FETCH_FAILED', message: '프로필 조회에 실패했습니다.' },
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser();
    if (!user || authError) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' },
      }, { status: 401 });
    }

    const body = await request.json();
    const { shopName, designerName } = body as { shopName?: string; designerName?: string };

    const supabase = await createClient();
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        shop_name: shopName?.trim() || null,
        designer_name: designerName?.trim() || null,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: { code: 'UPDATE_FAILED', message: '프로필 저장에 실패했습니다.' },
      }, { status: 500 });
    }

    // 업데이트된 프로필 반환
    const { user: updatedUser } = await getAuthUser();

    return NextResponse.json<ApiResponse<UserProfile | null>>({
      data: updatedUser,
      error: null,
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: { code: 'UPDATE_FAILED', message: '프로필 저장에 실패했습니다.' },
    }, { status: 500 });
  }
}
