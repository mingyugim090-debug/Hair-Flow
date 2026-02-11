"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import type { TimelineResult } from "@/types";

interface TimelineViewProps {
  result: TimelineResult;
}

export function TimelineView({ result }: TimelineViewProps) {
  const typeLabel = { color: "염색", cut: "커트", perm: "펌" }[result.treatmentType];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* 분석 요약 */}
      <div className="border border-gold/20 p-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="section-label">Result</span>
            <h2 className="font-heading text-[28px] font-light mt-2">AI 미래 타임라인</h2>
          </div>
          <Badge className="bg-gold/15 text-gold border-gold/30 text-[10px] tracking-[2px] uppercase">
            {typeLabel}
          </Badge>
        </div>
        <p className="text-[14px] text-white/50 font-light leading-relaxed">{result.currentAnalysis}</p>
      </div>

      {/* 타임라인 이미지 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {result.predictions.map((pred, i) => (
          <motion.div
            key={pred.week}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="border border-gold/15 overflow-hidden group"
          >
            <div className="aspect-square relative bg-charcoal">
              {pred.imageUrl ? (
                <img
                  src={pred.imageUrl}
                  alt={pred.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/15">
                  <span className="font-heading text-[48px] font-light">?</span>
                </div>
              )}
              <div className="absolute top-3 left-3">
                <span className="bg-charcoal/80 backdrop-blur-sm px-3 py-1 text-[10px] tracking-[2px] text-gold uppercase">
                  {pred.label}
                </span>
              </div>
            </div>
            <div className="p-4">
              <p className="text-[12px] text-white/40 font-light leading-relaxed">
                {pred.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 재방문 추천 */}
      <div className="border border-gold/20 p-8">
        <div className="flex items-start gap-5">
          <div className="w-12 h-12 border border-gold/30 flex items-center justify-center flex-shrink-0">
            <span className="font-heading text-[20px] text-gold">{result.revisitRecommendation.week}</span>
          </div>
          <div>
            <h3 className="text-[12px] tracking-[4px] uppercase text-gold mb-2">추천 재방문 시점</h3>
            <p className="font-heading text-[20px] font-light mb-2">
              <span className="text-gold-light">{result.revisitRecommendation.week}주 후</span> 재방문 추천
            </p>
            <p className="text-[13px] text-white/40 font-light">{result.revisitRecommendation.reason}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
