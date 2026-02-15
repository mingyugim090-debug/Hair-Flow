"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ExtendedConsultation } from "@/types";
import DashboardWidget from "@/components/salon/DashboardWidget";
import DesignerWorkList from "@/components/salon/DesignerWorkList";
import WorkDetailDialog from "@/components/salon/WorkDetailDialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner"; // Assuming sonner is used, or replace with alert/custom toast

export default function SalonPortfolioPage() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [consultations, setConsultations] = useState<ExtendedConsultation[]>([]);
    const [filter, setFilter] = useState<'all' | 'cut' | 'color' | 'perm'>('all');
    const [selectedWork, setSelectedWork] = useState<ExtendedConsultation | null>(null);
    const [isOwner, setIsOwner] = useState(false);

    // 데이터 로드
    useEffect(() => {
        const fetchPortfolio = async () => {
            try {
                setLoading(true);
                // 1. 권한 확인 (Owner 여부)
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: membership } = await supabase
                        .from('memberships')
                        .select('role')
                        .eq('user_id', user.id)
                        .single();
                    setIsOwner(membership?.role === 'owner');
                }

                // 2. 포트폴리오 데이터 조회
                const res = await fetch(`/api/organization/portfolio?filter=${filter}`);
                if (!res.ok) throw new Error('Failed to fetch');
                const { data } = await res.json();
                setConsultations(data || []);

            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchPortfolio();
    }, [filter, supabase]);

    // 공유 상태 토글
    const handleToggleShare = async (workId: string, currentStatus: boolean) => {
        try {
            const newStatus = !currentStatus;
            const res = await fetch(`/api/consultations/${workId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isSharedWithShop: newStatus }),
            });

            if (res.ok) {
                // 로컬 상태 업데이트
                setConsultations(prev => prev.map(c =>
                    c.id === workId ? { ...c, isSharedWithShop: newStatus } : c
                ));
                toast.success(newStatus ? "공유되었습니다." : "공유가 해제되었습니다.");
            } else {
                throw new Error('Update failed');
            }
        } catch (error) {
            toast.error("변경에 실패했습니다.");
        }
    };

    // 삭제 (실제 삭제는 아니고 공유 해제 혹은 notes에 삭제 표시 등을 할 수 있으나, 여기선 UI 상 제거 시늉만 하거나 API 호출 필요)
    // 요구사항에 '삭제' 버튼이 있는데, 실제 DB 삭제인지 리스트 제외인지 명확하지 않음. 
    // API에는 DELETE가 없으므로 일단 공유 해제로 처리하거나, 추후 DELETE endpoint 추가 필요.
    // 여기서는 '공유 해제'로 처리하겠습니다 (안전하게).
    const handleDeleteWork = async (workId: string) => {
        if (!confirm("정말 이 작품을 리스트에서 삭제하시겠습니까? (공유가 해제됩니다)")) return;
        await handleToggleShare(workId, true); // true -> false
    };


    // 디자이너별 그룹화
    const groupedWorks = consultations.reduce((acc, curr) => {
        const designerId = curr.designerId;
        if (!acc[designerId]) {
            acc[designerId] = {
                designer: curr.designer,
                works: []
            };
        }
        acc[designerId].works.push(curr);
        return acc;
    }, {} as Record<string, { designer: any, works: ExtendedConsultation[] }>);


    return (
        <div className="min-h-screen bg-charcoal text-white pt-24 pb-20 px-4 md:px-12">
            <div className="max-w-7xl mx-auto space-y-12">

                {/* Header */}
                <div>
                    <h1 className="font-heading text-4xl md:text-5xl text-gold mb-4">Salon Portfolio</h1>
                    <p className="text-white/60 font-light max-w-2xl">
                        우리 매장의 우수한 시술 사례를 모아보고, 고객 상담에 활용하세요.
                    </p>
                </div>

                {/* Dashboard (Owner Only) */}
                {isOwner && (
                    <div className="mb-12">
                        <DashboardWidget />
                    </div>
                )}

                {/* Filters */}
                <div className="flex gap-4 border-b border-white/10 pb-4 overflow-x-auto">
                    {['all', 'cut', 'perm', 'color'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilter(type as any)}
                            className={`px-6 py-2 rounded-full text-sm tracking-widest uppercase transition-all ${filter === type
                                    ? 'bg-gold text-charcoal font-medium'
                                    : 'bg-white/5 text-white/50 hover:bg-white/10'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-gold" size={40} />
                    </div>
                ) : (
                    <div className="space-y-16">
                        {Object.values(groupedWorks).map((group) => (
                            <DesignerWorkList
                                key={group.designer.id}
                                designerName={group.designer.designerName || group.designer.name}
                                avatarUrl={group.designer.avatarUrl}
                                works={group.works}
                                isOwner={isOwner}
                                onWorkClick={setSelectedWork}
                                onDeleteWork={handleDeleteWork}
                                onToggleShare={handleToggleShare}
                            />
                        ))}

                        {Object.keys(groupedWorks).length === 0 && (
                            <div className="text-center py-20 text-white/30 font-light">
                                등록된 작품이 없습니다.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Detail Dialog */}
            <WorkDetailDialog
                consultation={selectedWork}
                isOpen={!!selectedWork}
                onClose={() => setSelectedWork(null)}
            />
        </div>
    );
}
