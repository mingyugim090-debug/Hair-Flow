"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ExtendedConsultation } from "@/types";
import { Lock, Globe, Trash2, Edit3 } from "lucide-react";

interface WorkCardProps {
    consultation: ExtendedConsultation;
    isOwner: boolean;
    onClick: () => void;
    onDelete?: () => void;
    onToggleShare?: () => void;
}

export default function WorkCard({
    consultation,
    isOwner,
    onClick,
    onDelete,
    onToggleShare,
}: WorkCardProps) {
    // 대표 이미지 결정 (시술 후 사진 > 5면 중 앞면 > 기타)
    const mainImage = consultation.postTreatmentTimeline?.completedPhotoUrl
        || consultation.photos.front
        || consultation.photos.left
        || "/placeholder-hair.png";

    const treatmentTypeLabel = {
        'color': 'Color',
        'cut': 'Cut',
        'perm': 'Perm',
        'analysis': 'Analysis',
        'style-recommendation': 'Style',
        'recipe': 'Recipe',
        'timeline': 'Timeline',
        'five-view-analysis': '5-View Analysis',
        'style-based-recipe': 'Recipe',
        'post-treatment-timeline': 'Timeline',
    }[consultation.treatmentType] || consultation.treatmentType;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer shadow-luxury hover-gold-glow transition-all duration-300"
            onClick={onClick}
        >
            {/* Background Image */}
            <div className="absolute inset-0 bg-charcoal">
                <Image
                    src={mainImage}
                    alt="Work Result"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/20 to-transparent opacity-80" />
            </div>

            {/* Content */}
            <div className="absolute inset-0 p-4 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <span className="px-2 py-1 text-[10px] tracking-widest uppercase border border-gold/30 text-gold bg-black/30 backdrop-blur-sm rounded-sm">
                        {treatmentTypeLabel}
                    </span>

                    {isOwner && (
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                                onClick={onToggleShare}
                                className={`p-2 rounded-full backdrop-blur-md transition-colors ${consultation.isSharedWithShop ? 'bg-gold/20 text-gold hover:bg-gold/40' : 'bg-charcoal/60 text-white/50 hover:text-white'}`}
                                title={consultation.isSharedWithShop ? "공유 중" : "비공개"}
                            >
                                {consultation.isSharedWithShop ? <Globe size={14} /> : <Lock size={14} />}
                            </button>
                            <button
                                onClick={onDelete}
                                className="p-2 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/30 backdrop-blur-md transition-colors"
                                title="삭제"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    )}
                </div>

                <div>
                    <h3 className="font-heading text-lg text-white mb-1 truncate">
                        {consultation.styleRecommendations?.recommendations?.[0]?.name || "맞춤 스타일링"}
                    </h3>
                    <p className="text-[12px] text-white/60 line-clamp-2 font-light">
                        {consultation.notes || "상세 설명이 없습니다."}
                    </p>
                    <div className="mt-3 flex items-center gap-2 pt-3 border-t border-white/10">
                        <div className="relative w-6 h-6 rounded-full overflow-hidden border border-gold/30">
                            {/* Avatar will be handled by parent if needed, showing simple logic here */}
                            <div className="w-full h-full bg-charcoal flex items-center justify-center text-[10px] text-gold">
                                {consultation.designer?.name?.[0] || "D"}
                            </div>
                        </div>
                        <span className="text-[11px] text-white/80 font-light">
                            {consultation.designer?.designerName || consultation.designer?.name || "Designer"}
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
