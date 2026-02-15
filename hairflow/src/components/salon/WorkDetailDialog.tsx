"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ExtendedConsultation } from "@/types";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface WorkDetailDialogProps {
    consultation: ExtendedConsultation | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function WorkDetailDialog({
    consultation,
    isOpen,
    onClose,
}: WorkDetailDialogProps) {
    if (!consultation) return null;

    const styleRec = consultation.styleRecommendations?.recommendations?.[0];
    const recipe = consultation.styleBasedRecipe;
    const analysis = consultation.fiveViewAnalysis;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-charcoal border-gold/20 text-white p-0 gap-0">
                <ScrollArea className="h-full max-h-[90vh]">
                    <div className="p-6">
                        <DialogHeader className="mb-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Badge variant="outline" className="text-gold border-gold/50 uppercase tracking-wider">
                                    {consultation.treatmentType}
                                </Badge>
                                <span className="text-white/40 text-sm">
                                    {new Date(consultation.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <DialogTitle className="font-heading text-3xl text-white">
                                {styleRec?.name || "맞춤 스타일링"}
                            </DialogTitle>
                            <DialogDescription className="text-white/60">
                                Designed by {consultation.designer?.designerName || consultation.designer?.name}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Left Column: Images */}
                            <div className="space-y-6">
                                <div className="aspect-[3/4] relative rounded-lg overflow-hidden border border-white/10 shadow-lg">
                                    <Image
                                        src={consultation.postTreatmentTimeline?.completedPhotoUrl || consultation.photos.front || "/placeholder-hair.png"}
                                        alt="Main Result"
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                                        <span className="text-white font-medium">Final Look</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    {['front', 'left', 'back', 'right', 'top'].map((pos) => {
                                        // @ts-ignore
                                        const url = consultation.photos[pos];
                                        if (!url) return null;
                                        return (
                                            <div key={pos} className="aspect-square relative rounded-md overflow-hidden border border-white/10">
                                                <Image src={url} alt={pos} fill className="object-cover" />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                                                    <span className="text-[10px] uppercase text-white font-bold">{pos}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Right Column: Details */}
                            <div className="space-y-8">
                                {/* 1. Analysis Summary */}
                                {analysis && (
                                    <div className="bg-white/5 rounded-lg p-5 border border-white/10">
                                        <h4 className="text-gold font-heading text-xl mb-3">AI Analysis</h4>
                                        <div className="space-y-2 text-sm text-white/80">
                                            <div className="flex justify-between">
                                                <span className="text-white/50">Face Shape</span>
                                                <span>{analysis.faceShape?.type}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-white/50">Damage Level</span>
                                                <span>{analysis.damageAnalysis?.overallLevel}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-white/50">Hair Density</span>
                                                <span>{analysis.hairDensityDistribution?.overallPattern}</span>
                                            </div>
                                            <p className="mt-3 text-white/60 leading-relaxed text-xs border-t border-white/10 pt-3">
                                                {analysis.comprehensiveAdvice}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* 2. Recipe */}
                                {recipe && (
                                    <div className="bg-white/5 rounded-lg p-5 border border-white/10">
                                        <h4 className="text-gold font-heading text-xl mb-3">Recipe Guide</h4>
                                        <div className="space-y-4">
                                            {recipe.cutProcedure && (
                                                <div>
                                                    <div className="text-xs uppercase tracking-wider text-white/40 mb-1">Cut</div>
                                                    <p className="text-sm text-white/80">{recipe.cutProcedure.description}</p>
                                                </div>
                                            )}

                                            {recipe.colorProcedure && (
                                                <div>
                                                    <div className="text-xs uppercase tracking-wider text-white/40 mb-1">Color</div>
                                                    <div className="flex gap-2 text-sm text-white/80">
                                                        <span className="bg-gold/20 text-gold px-2 py-0.5 rounded text-xs">{recipe.colorProcedure.formula}</span>
                                                        <span>{recipe.colorProcedure.processingTime}</span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex gap-2 mt-2">
                                                <Badge variant="secondary" className="bg-white/10 hover:bg-white/20 text-white/80 border-none">
                                                    ⏱ {recipe.estimatedTotalTime}
                                                </Badge>
                                                <Badge variant="secondary" className="bg-white/10 hover:bg-white/20 text-white/80 border-none">
                                                    Difficult: {recipe.difficulty}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 3. Designer Note */}
                                <div className="bg-gold/5 rounded-lg p-5 border border-gold/20">
                                    <h4 className="text-gold font-heading text-xl mb-2">Designer Note</h4>
                                    <p className="text-sm text-white/70 italic">
                                        "{consultation.notes || "특이사항 없음"}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
