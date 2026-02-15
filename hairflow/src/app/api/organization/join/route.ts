
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

    // Find organization by code
    const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("id, name")
        .eq("invite_code", inviteCode)
        .single();

    if (orgError || !org) {
        return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
    }

    // Check if already a member
    const { data: existing } = await supabase
        .from("memberships")
        .select("id")
        .eq("user_id", user.id)
        .eq("organization_id", org.id)
        .single();

    if (existing) {
        return NextResponse.json({ error: "Already a member of this organization" }, { status: 400 });
    }

    // Join as staff
    const { error: joinError } = await supabase
        .from("memberships")
        .insert({
            organization_id: org.id,
            user_id: user.id,
            role: "staff"
        });

    if (joinError) {
        return NextResponse.json({ error: "Failed to join organization" }, { status: 500 });
    }

    return NextResponse.json({
        success: true,
        data: { organizationName: org.name }
    });
}
