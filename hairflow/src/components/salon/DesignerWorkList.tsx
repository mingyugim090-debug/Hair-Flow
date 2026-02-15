"use client";

import { ExtendedConsultation } from "@/types";
import WorkCard from "./WorkCard"; // Assuming WorkCard is in the same directory
import { motion } from "framer-motion";

interface DesignerWorkListProps {
    designerName: string;
    avatarUrl?: string | null;
    works: ExtendedConsultation[];
    isOwner: boolean;
    onWorkClick: (work: ExtendedConsultation) => void;
    onDeleteWork: (workId: string) => void;
    onToggleShare: (workId: string, currentStatus: boolean) => void;
}

export default function DesignerWorkList({
    designerName,
    avatarUrl,
    works,
    isOwner,
    onWorkClick,
    onDeleteWork,
    onToggleShare,
}: DesignerWorkListProps) {
    if (works.length === 0) return null;

    return (
        <div className="mb-12">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full border border-gold/30 overflow-hidden relative">
                    {/* Avatar Image or Fallback */}
                    <div className="w-full h-full bg-charcoal flex items-center justify-center text-gold text-lg font-heading">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={designerName} className="w-full h-full object-cover" />
                        ) : (
                            designerName[0]
                        )}
                    </div>
                </div>
                <div>
                    <h3 className="font-heading text-2xl text-white">{designerName}</h3>
                    <p className="text-sm text-gold-light">{works.length} Works</p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {works.map((work) => (
                    <WorkCard
                        key={work.id}
                        consultation={work}
                        isOwner={isOwner}
                        onClick={() => onWorkClick(work)}
                        onDelete={() => onDeleteWork(work.id)}
                        onToggleShare={() => onToggleShare(work.id, work.isSharedWithShop)}
                    />
                ))}
            </div>
        </div>
    );
}
