import { createClient } from '@/lib/supabase/server';
import { getRemainingUsage } from '@/lib/subscription';
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
      user: mapProfile(newProfile, null),
      error: null,
    };
  }

  if (profileError) {
    return { user: null, error: '프로필 조회에 실패했습니다.' };
  }

  // Check for enterprise membership to upgrade plan in UI
  const { data: membership } = await supabase
    .from('memberships')
    .select(`
        organization:organizations (
            name,
            owner:profiles (
                plan
            )
        )
    `)
    .eq('user_id', user.id)
    .single();

  if (membership) {
    console.log("Membership found for user:", user.id, membership);
  }

  let userProfile = profile;

  // @ts-ignore
  if (membership?.organization?.owner?.plan === 'enterprise' && profile.plan === 'free') {
    userProfile = { ...profile, plan: 'basic' };
  }

  // @ts-ignore
  const orgName = membership?.organization?.name;
  if (orgName) {
    console.log("Mapping org name to profile:", orgName);
    // @ts-ignore
    userProfile = { ...userProfile, organization_name: orgName };
  }

  // Fetch active subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return { user: mapProfile(userProfile, subscription), error: null };
}

function mapProfile(row: Record<string, unknown>, subscription: Record<string, unknown> | null): UserProfile {
  const plan = (row.plan as 'free' | 'basic' | 'enterprise') ?? 'free';
  const dailyUsage = (row.daily_usage as number) ?? 0;
  const lastUsageDate = (row.last_usage_date as string) ?? null;

  return {
    id: row.id as string,
    email: row.email as string,
    name: (row.name as string) ?? null,
    avatarUrl: (row.avatar_url as string) ?? null,
    shopName: (row.shop_name as string) ?? null,
    organizationName: (row.organization_name as string) ?? null,
    designerName: (row.designer_name as string) ?? null,
    instagramId: (row.instagram_id as string) ?? null,
    specialties: (row.specialties as string[]) ?? [],
    bio: (row.bio as string) ?? null,
    isOnboarded: (row.is_onboarded as boolean) ?? false,
    plan,
    dailyUsage,
    lastUsageDate,
    portfolioWorks: (row.portfolio_works as { url: string; caption: string; createdAt: string }[]) ?? [],
    createdAt: row.created_at as string,
    // Subscription fields
    subscriptionEnd: (subscription?.current_period_end as string) ?? null,
    isCanceled: (subscription?.is_canceled as boolean) ?? false,
    remainingUsage: getRemainingUsage(dailyUsage, lastUsageDate, plan),
  };
}

const DAILY_LIMITS: Record<string, number> = {
  free: 3,
  basic: 999999,
  enterprise: 999999,
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

  // Check if user is a member of an enterprise organization
  const { data: membership } = await supabase
    .from('memberships')
    .select(`
        organization:organizations (
            owner:profiles (
                plan
            )
        )
    `)
    .eq('user_id', userId)
    .single();

  let userPlan = profile.plan;

  // @ts-ignore - Supabase type inference might be tricky here
  const orgPlan = membership?.organization?.owner?.plan;

  // If user belongs to an Enterprise organization, upgrade their effective plan to 'basic' (unlimited)
  // unless they are already enterprise
  if (orgPlan === 'enterprise' && userPlan === 'free') {
    userPlan = 'basic';
  }

  const limit = DAILY_LIMITS[userPlan] ?? 3;

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
