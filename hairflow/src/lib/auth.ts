import { createClient } from '@/lib/supabase/server';
import type { UserProfile } from '@/types';

interface AuthResult {
  user: UserProfile | null;
  error: string | null;
}

export async function getAuthUser(): Promise<AuthResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, error: '로그인이 필요합니다.' };
  }

  // profiles 테이블에서 사용자 조회, 없으면 자동 생성
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError && profileError.code === 'PGRST116') {
    // 프로필 없으면 생성
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email ?? '',
        name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
        avatar_url: user.user_metadata?.avatar_url ?? null,
        plan: 'free',
        daily_usage: 0,
        last_usage_date: null,
      })
      .select()
      .single();

    if (createError) {
      return { user: null, error: '프로필 생성에 실패했습니다.' };
    }

    return {
      user: mapProfile(newProfile),
      error: null,
    };
  }

  if (profileError) {
    return { user: null, error: '프로필 조회에 실패했습니다.' };
  }

  return { user: mapProfile(profile), error: null };
}

function mapProfile(row: Record<string, unknown>): UserProfile {
  return {
    id: row.id as string,
    email: row.email as string,
    name: (row.name as string) ?? null,
    avatarUrl: (row.avatar_url as string) ?? null,
    shopName: (row.shop_name as string) ?? null,
    designerName: (row.designer_name as string) ?? null,
    instagramId: (row.instagram_id as string) ?? null,
    specialties: (row.specialties as string[]) ?? [],
    bio: (row.bio as string) ?? null,
    isOnboarded: (row.is_onboarded as boolean) ?? false,
    plan: (row.plan as 'free' | 'basic' | 'pro') ?? 'free',
    dailyUsage: (row.daily_usage as number) ?? 0,
    lastUsageDate: (row.last_usage_date as string) ?? null,
    createdAt: row.created_at as string,
  };
}

const DAILY_LIMITS: Record<string, number> = {
  free: 3,
  basic: 999999,
  pro: 999999,
};

export async function checkUsageLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, daily_usage, last_usage_date')
    .eq('id', userId)
    .single();

  if (!profile) {
    return { allowed: false, remaining: 0 };
  }

  const limit = DAILY_LIMITS[profile.plan] ?? 3;

  // 날짜가 바뀌면 사용량 리셋
  if (profile.last_usage_date !== today) {
    return { allowed: true, remaining: limit };
  }

  const remaining = Math.max(0, limit - (profile.daily_usage ?? 0));
  return { allowed: remaining > 0, remaining };
}

export async function incrementUsage(userId: string): Promise<void> {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  const { data: profile } = await supabase
    .from('profiles')
    .select('last_usage_date, daily_usage')
    .eq('id', userId)
    .single();

  if (!profile) return;

  const isNewDay = profile.last_usage_date !== today;

  await supabase
    .from('profiles')
    .update({
      daily_usage: isNewDay ? 1 : (profile.daily_usage ?? 0) + 1,
      last_usage_date: today,
    })
    .eq('id', userId);
}
