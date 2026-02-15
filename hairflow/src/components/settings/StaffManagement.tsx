"use client";

import { useState, useEffect } from "react";



interface Member {
    userId: string;
    role: "owner" | "staff";
    name: string;
    designerName: string;
    email: string;
    joinedAt: string;
}

interface OrganizationData {
    name: string;
    invite_code?: string;
}

interface Props {
    defaultShopName?: string;
}

export function StaffManagement({ defaultShopName }: Props) {
    const [loading, setLoading] = useState(true);
    const [organization, setOrganization] = useState<OrganizationData | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [regenerating, setRegenerating] = useState(false);

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        setLoading(true);
        const res = await fetch("/api/organization/members");
        const result = await res.json();

        if (result.data) {
            setOrganization(result.data.organization);
            setMembers(result.data.members);
            setInviteCode(result.data.organization.invite_code);
        }
        setLoading(false);
    };

    const regenerateCode = async () => {
        if (!confirm("초대 코드를 새로 발급하면 기존 코드는 사용할 수 없습니다. 계속하시겠습니까?")) return;

        setRegenerating(true);
        const res = await fetch("/api/organization/members", { method: "POST" });
        const result = await res.json();

        if (result.data) {
            setInviteCode(result.data.inviteCode);
        } else {
            alert("코드 재발급 실패");
        }
        setRegenerating(false);
    };

    const removeMember = async (userId: string) => {
        if (!confirm("정말 이 스태프를 내보내시겠습니까?")) return;

        const res = await fetch(`/api/organization/members?userId=${userId}`, { method: "DELETE" });
        const result = await res.json();

        if (result.success) {
            setMembers(members.filter(m => m.userId !== userId));
        } else {
            alert("멤버 삭제 실패: " + (result.error || "알 수 없는 오류"));
        }
    };

    const copyCode = () => {
        if (inviteCode) {
            navigator.clipboard.writeText(inviteCode);
            alert("초대 코드가 복사되었습니다!");
        }
    };

    const [creating, setCreating] = useState(false);
    const [newShopName, setNewShopName] = useState(defaultShopName || "");

    useEffect(() => {
        if (defaultShopName) setNewShopName(defaultShopName);
    }, [defaultShopName]);

    const handleCreateShop = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newShopName.trim()) return;

        setCreating(true);
        try {
            const res = await fetch("/api/organization/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newShopName.trim() })
            });
            const result = await res.json();

            if (result.success) {
                // Refresh members/org data
                await fetchMembers();
            } else {
                alert(result.error || "매장 생성 실패");
            }
        } catch (error) {
            alert("오류가 발생했습니다.");
        }
        setCreating(false);
    };

    if (loading) return <div className="text-white/40 text-sm py-8 text-center">로딩 중...</div>;

    // If no organization, show creation form
    if (!organization) {
        return (
            <div className="bg-white/5 border border-white/10 p-8 rounded-lg text-center">
                <h3 className="text-white text-lg font-light mb-2">매장 관리 시작하기</h3>
                <p className="text-white/40 text-xs mb-8">
                    스태프를 관리하고 포트폴리오를 공유하려면<br />먼저 매장을 생성해야 합니다.
                </p>

                <form onSubmit={handleCreateShop} className="max-w-xs mx-auto space-y-4">
                    <input
                        type="text"
                        value={newShopName}
                        onChange={(e) => setNewShopName(e.target.value)}
                        placeholder="매장명 입력 (예: 헤어플로우 강남점)"
                        className="w-full bg-black/40 border border-gold/20 px-4 py-3 text-center text-white placeholder:text-white/20 focus:border-gold/50 focus:outline-none"
                        disabled={creating}
                    />
                    <button
                        type="submit"
                        disabled={creating || !newShopName.trim()}
                        className="w-full py-3 bg-gold text-charcoal font-medium text-sm tracking-widest hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {creating ? "생성 중..." : "매장 생성하기"}
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Invite Code Section */}
            <div className="bg-gold/5 border border-gold/10 p-6 rounded-lg">
                <h3 className="text-gold text-sm tracking-widest uppercase mb-2">스태프 초대 코드</h3>
                <p className="text-white/40 text-xs mb-4">
                    이 코드를 스태프에게 전달하세요. 스태프가 설정 페이지에서 코드를 입력하면 매장에 합류할 수 있습니다.
                </p>
                <div className="flex items-center gap-3">
                    <div className="bg-black/40 border border-gold/20 px-6 py-3 text-xl tracking-[4px] text-white font-mono rounded">
                        {inviteCode}
                    </div>
                    <button
                        onClick={copyCode}
                        className="px-4 py-3 bg-gold/10 text-gold text-xs hover:bg-gold/20 transition-colors border border-gold/20 uppercase tracking-wider"
                    >
                        복사
                    </button>
                    <button
                        onClick={regenerateCode}
                        disabled={regenerating}
                        className="px-4 py-3 bg-white/5 text-white/40 text-xs hover:bg-white/10 transition-colors border border-white/10 uppercase tracking-wider"
                    >
                        {regenerating ? "발급 중..." : "재발급"}
                    </button>
                </div>
            </div>

            {/* Members List */}
            <div>
                <h3 className="text-white text-sm tracking-widest uppercase mb-4">소속 스태프 ({members.length})</h3>
                <div className="grid gap-3">
                    {members.map((member) => (
                        <div key={member.userId} className="flex items-center justify-between bg-white/5 border border-white/10 p-4 rounded hover:border-gold/20 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 font-medium">
                                    {member.name?.[0] || "S"}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-white text-sm font-medium">{member.designerName || member.name}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${member.role === 'owner' ? 'border-gold text-gold bg-gold/10' : 'border-white/20 text-white/40'}`}>
                                            {member.role === 'owner' ? 'OWNER' : 'STAFF'}
                                        </span>
                                    </div>
                                    <span className="text-white/30 text-xs">{member.email}</span>
                                </div>
                            </div>
                            {member.role !== 'owner' && (
                                <button
                                    onClick={() => removeMember(member.userId)}
                                    className="text-red-400/50 hover:text-red-400 text-xs px-3 py-1 border border-transparent hover:border-red-400/20 rounded transition-all"
                                >
                                    내보내기
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
