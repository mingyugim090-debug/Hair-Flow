
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET: Fetch organization members and invite code (Owner only)
export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is an owner of an organization
    const { data: membership, error: membershipError } = await supabase
        .from("memberships")
        .select("organization_id, role, organizations(name, invite_code)")
        .eq("user_id", user.id)
        .single();

    if (membershipError || !membership) {
        return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }

    if (membership.role !== "owner") {
        return NextResponse.json({ error: "Forbidden: Only owners can manage staff" }, { status: 403 });
    }

    // Fetch members
    const { data: members, error: membersError } = await supabase
        .from("memberships")
        .select(`
      user_id,
      role,
      joined_at,
      profiles:user_id (name, email, avatar_url, designer_name)
    `)
        .eq("organization_id", membership.organization_id);

    if (membersError) {
        return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
    }

    return NextResponse.json({
        data: {
            organization: membership.organizations,
            members: members.map(m => ({
                userId: m.user_id,
                role: m.role,
                joinedAt: m.joined_at,
                // @ts-ignore
                name: m.profiles?.name,
                // @ts-ignore
                email: m.profiles?.email,
                // @ts-ignore
                avatarUrl: m.profiles?.avatar_url,
                // @ts-ignore
                designerName: m.profiles?.designer_name
            }))
        }
    });
}

// POST: Regenerate invite code (Owner only)
export async function POST() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check ownership
    const { data: membership } = await supabase
        .from("memberships")
        .select("organization_id, role")
        .eq("user_id", user.id)
        .single();

    if (!membership || membership.role !== "owner") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Generate new code (simple random string)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const newCode = `HF-${result}`;

    const { error } = await supabase
        .from('organizations')
        .update({ invite_code: newCode })
        .eq('id', membership.organization_id);

    if (error) {
        return NextResponse.json({ error: "Failed to update code" }, { status: 500 });
    }

    return NextResponse.json({ data: { inviteCode: newCode } });
}

// DELETE: Remove a member (Owner only)
export async function DELETE(req: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('userId');

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!targetUserId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    // Check ownership
    const { data: membership } = await supabase
        .from("memberships")
        .select("organization_id, role")
        .eq("user_id", user.id)
        .single();

    if (!membership || membership.role !== "owner") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Prevent removing self
    if (user.id === targetUserId) {
        return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
    }

    // Remove member
    const { error } = await supabase
        .from('memberships')
        .delete()
        .eq('organization_id', membership.organization_id)
        .eq('user_id', targetUserId);

    if (error) {
        return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
