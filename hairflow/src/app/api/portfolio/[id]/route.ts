import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@/types';

interface PortfolioWork {
  url: string;
  caption: string;
  createdAt: string;
}

interface PortfolioData {
  designer: {
    id: string;
    name: string | null;
    designerName: string | null;
    shopName: string | null;
    instagramId: string | null;
    specialties: string[];
    bio: string | null;
    avatarUrl: string | null;
    portfolioWorks: PortfolioWork[];
  };
  timelines: {
    id: string;
    treatmentType: string;
    resultImages: Record<string, unknown>;
    revisitRecommendation: string | null;
    createdAt: string;
  }[];
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 디자이너 프로필 조회
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, designer_name, shop_name, instagram_id, specialties, bio, avatar_url, is_onboarded, portfolio_works')
      .eq('id', id)
      .single();

    if (profileError || !profile || !profile.is_onboarded) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: { code: 'NOT_FOUND', message: '디자이너를 찾을 수 없습니다.' },
      }, { status: 404 });
    }

    // 공개된 타임라인 조회
    const { data: timelines } = await supabase
      .from('timelines')
      .select('id, treatment_type, result_images, revisit_recommendation, created_at')
      .eq('user_id', id)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(12);

    const portfolioData: PortfolioData = {
      designer: {
        id: profile.id,
        name: profile.name,
        designerName: profile.designer_name,
        shopName: profile.shop_name,
        instagramId: profile.instagram_id,
        specialties: profile.specialties ?? [],
        bio: profile.bio,
        avatarUrl: profile.avatar_url,
        portfolioWorks: (profile.portfolio_works as PortfolioWork[]) ?? [],
      },
      timelines: (timelines ?? []).map((t) => ({
        id: t.id,
        treatmentType: t.treatment_type,
        resultImages: t.result_images as Record<string, unknown>,
        revisitRecommendation: t.revisit_recommendation,
        createdAt: t.created_at,
      })),
    };

    return NextResponse.json<ApiResponse<PortfolioData>>({
      data: portfolioData,
      error: null,
    });
  } catch (error) {
    console.error('Portfolio fetch error:', error);
    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: { code: 'FETCH_FAILED', message: '포트폴리오 조회에 실패했습니다.' },
    }, { status: 500 });
  }
}
