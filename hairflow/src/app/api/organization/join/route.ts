
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// POST: Join organization with invite code
export async function POST(req: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { inviteCode } = await req.json();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!inviteCode) {
        return NextResponse.json({ error: "Invite code is required" }, { status: 400 });
    }

    // Find organization by code using RPC (to bypass RLS)
    const { data: org, error: orgError } = await supabase
        .rpc('get_org_by_invite_code', { code: inviteCode })
        .single();

    if (orgError || !org) {
        console.error("Invite code check failed:", orgError);
        return NextResponse.json({ error: "유효하지 않은 초대 코드입니다." }, { status: 404 });
    }

    // Check if already a member
    const { data: existing } = await supabase
        .from("memberships")
        .select("id")
        .eq("user_id", user.id)
        .eq("organization_id", organization.id)
        .single();

    if (existing) {
        return NextResponse.json({ error: "Already a member of this organization" }, { status: 400 });
    }

    // Join as staff
    const { error: joinError } = await supabase
        .from("memberships")
        .insert({
            organization_id: organization.id,
            user_id: user.id,
            role: "staff"
        });

    if (joinError) {
        return NextResponse.json({ error: "Failed to join organization" }, { status: 500 });
    }

    return NextResponse.json({
        success: true,
        data: { organizationName: organization.name }
    });
}
