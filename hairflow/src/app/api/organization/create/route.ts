
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { name } = await req.json() as { name: string };

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!name) {
        return NextResponse.json({ error: "매장명은 필수입니다." }, { status: 400 });
    }

    // Check if already owns an organization
    const { data: existing } = await supabase
        .from("organizations")
        .select("id")
        .eq("owner_id", user.id)
        .single();

    if (existing) {
        return NextResponse.json({ error: "이미 생성된 매장이 있습니다." }, { status: 400 });
    }

    // Generate invite code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const inviteCode = `HF-${result}`;

    // Create Organization
    const { data: org, error: createError } = await supabase
        .from("organizations")
        .insert({
            name,
            owner_id: user.id,
            invite_code: inviteCode
        })
        .select()
        .single();

    if (createError || !org) {
        console.error("Org create error:", createError);
        return NextResponse.json({
            error: `매장 생성 실패: ${createError.message || createError.code}`,
            details: createError
        }, { status: 500 });
    }

    // Auto-join as owner (memberships)
    const { error: joinError } = await supabase
        .from("memberships")
        .insert({
            organization_id: org.id,
            user_id: user.id,
            role: "owner"
        });

    if (joinError) {
        // Rollback logic would be good here, but for now just error
        console.error("Membership join error:", joinError);
        return NextResponse.json({ error: "멤버십 생성 실패" }, { status: 500 });
    }

    return NextResponse.json({
        success: true,
        data: {
            name: org.name,
            invite_code: org.invite_code
        }
    });
}
