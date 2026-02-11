"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import type { RecipeResult } from "@/types";

interface RecipeCardProps {
  recipe: RecipeResult;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const typeLabel = {
    color: "컬러",
    cut: "커트",
    perm: "펌",
    mixed: "복합",
  }[recipe.procedure.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="border border-gold/20">
        {/* Header */}
        <div className="p-8 border-b border-gold/10 flex items-center justify-between">
          <div>
            <span className="section-label">Result</span>
            <h2 className="font-heading text-[28px] font-light mt-2">AI 시술 레시피</h2>
          </div>
          <Badge className="bg-gold/15 text-gold border-gold/30 text-[10px] tracking-[2px] uppercase">
            {typeLabel}
          </Badge>
        </div>

        <div className="p-8 space-y-8">
          {/* 현재 모발 분석 */}
          <div>
            <h3 className="text-[12px] tracking-[4px] uppercase text-gold mb-4">현재 모발 상태</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <InfoBox label="베이스 레벨" value={recipe.currentAnalysis.baseLevel} />
              <InfoBox label="손상도" value={recipe.currentAnalysis.damageLevel} />
              <InfoBox label="모질" value={recipe.currentAnalysis.hairType} />
              <InfoBox label="모량" value={recipe.currentAnalysis.hairVolume} />
            </div>
            <p className="text-[13px] text-white/40 font-light leading-relaxed">{recipe.currentAnalysis.summary}</p>
          </div>

          <div className="border-t border-gold/10" />

          {/* 목표 분석 */}
          <div>
            <h3 className="text-[12px] tracking-[4px] uppercase text-gold mb-4">목표 스타일 분석</h3>
            <div className="space-y-3 mb-4">
              <InfoRow label="컬러 차이" value={recipe.targetAnalysis.colorGap} />
              <InfoRow label="길이 차이" value={recipe.targetAnalysis.lengthDiff} />
              <InfoRow label="텍스처 차이" value={recipe.targetAnalysis.textureDiff} />
            </div>
            <p className="text-[13px] text-white/40 font-light leading-relaxed">{recipe.targetAnalysis.summary}</p>
          </div>

          <div className="border-t border-gold/10" />

          {/* 약제 배합 */}
          <div>
            <h3 className="text-[12px] tracking-[4px] uppercase text-gold mb-4">약제 배합</h3>
            <div className="border border-gold/10 p-5 space-y-3">
              <InfoRow label="브랜드" value={recipe.chemicals.brand} />
              <InfoRow label="배합" value={recipe.chemicals.formula} />
              <InfoRow label="비율" value={recipe.chemicals.ratio} />
              <InfoRow label="도포 순서" value={recipe.chemicals.applicationOrder} />
              <InfoRow label="방치 시간" value={recipe.chemicals.processingTime} />
            </div>
          </div>

          <div className="border-t border-gold/10" />

          {/* 시술 순서 */}
          <div>
            <h3 className="text-[12px] tracking-[4px] uppercase text-gold mb-4">시술 순서</h3>
            <div className="space-y-4">
              {recipe.steps.map((step) => (
                <div key={step.order} className="flex gap-4">
                  <div className="w-8 h-8 border border-gold/30 flex items-center justify-center text-gold text-[13px] font-heading flex-shrink-0">
                    {step.order}
                  </div>
                  <div>
                    <p className="text-[14px] font-light">
                      {step.action}
                      <span className="text-white/30 ml-2 text-[12px]">({step.duration})</span>
                    </p>
                    <p className="text-[13px] text-white/40 font-light mt-1">{step.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gold/10" />

          {/* 주의사항 */}
          <div>
            <h3 className="text-[12px] tracking-[4px] uppercase text-red-400/80 mb-4">주의사항</h3>
            <ul className="space-y-2">
              {recipe.cautions.map((caution, i) => (
                <li key={i} className="text-[13px] text-white/40 font-light flex items-start gap-3">
                  <span className="text-red-400/60 mt-0.5">•</span>
                  {caution}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gold/10 p-4">
      <p className="text-[11px] text-white/30 font-light tracking-[1px] uppercase mb-1">{label}</p>
      <p className="text-[14px] font-light">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-[12px] text-white/30 min-w-[72px] tracking-[1px]">{label}</span>
      <span className="text-[13px] text-white/60 font-light">{value}</span>
    </div>
  );
}
