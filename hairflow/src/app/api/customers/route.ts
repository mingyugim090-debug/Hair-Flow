import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse, Customer } from '@/types';

// 고객 목록 조회
export async function GET() {
  try {
    const { user, error: authError } = await getAuthUser();
    if (!user || authError) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' },
      }, { status: 401 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('designer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: { code: 'FETCH_FAILED', message: '고객 목록을 불러올 수 없습니다.' },
      }, { status: 500 });
    }

    const customers: Customer[] = (data ?? []).map((row) => ({
      id: row.id,
      designerId: row.designer_id,
      name: row.name,
      phone: row.phone ?? null,
      memo: row.memo ?? null,
      createdAt: row.created_at,
    }));

    return NextResponse.json<ApiResponse<Customer[]>>({ data: customers, error: null });
  } catch {
    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: { code: 'SERVER_ERROR', message: '서버 오류가 발생했습니다.' },
    }, { status: 500 });
  }
}

// 고객 등록
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
    const { name, phone, memo } = body as { name: string; phone?: string; memo?: string };

    if (!name || !name.trim()) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: { code: 'MISSING_NAME', message: '고객 이름을 입력해주세요.' },
      }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('customers')
      .insert({
        designer_id: user.id,
        name: name.trim(),
        phone: phone?.trim() || null,
        memo: memo?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: { code: 'CREATE_FAILED', message: '고객 등록에 실패했습니다.' },
      }, { status: 500 });
    }

    const customer: Customer = {
      id: data.id,
      designerId: data.designer_id,
      name: data.name,
      phone: data.phone ?? null,
      memo: data.memo ?? null,
      createdAt: data.created_at,
    };

    return NextResponse.json<ApiResponse<Customer>>({ data: customer, error: null });
  } catch {
    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: { code: 'SERVER_ERROR', message: '서버 오류가 발생했습니다.' },
    }, { status: 500 });
  }
}

// 고객 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser();
    if (!user || authError) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' },
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('id');

    if (!customerId) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: { code: 'MISSING_ID', message: '고객 ID가 필요합니다.' },
      }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId)
      .eq('designer_id', user.id);

    if (error) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: { code: 'DELETE_FAILED', message: '고객 삭제에 실패했습니다.' },
      }, { status: 500 });
    }

    return NextResponse.json<ApiResponse<{ deleted: true }>>({ data: { deleted: true }, error: null });
  } catch {
    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: { code: 'SERVER_ERROR', message: '서버 오류가 발생했습니다.' },
    }, { status: 500 });
  }
}
