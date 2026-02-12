"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import type { Customer, CustomerTimeline, CustomerAnalysisResult } from "@/types";

interface CustomerDetail {
  customer: Customer;
  timelines: CustomerTimeline[];
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`/api/customers/${id}`);
      const result = await res.json();
      if (result.data) setData(result.data);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleAnalyze = async (file: File) => {
    setAnalyzing(true);
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(`/api/customers/${id}/analyze`, {
      method: "POST",
      body: formData,
    });
    const result = await res.json();

    if (result.data) {
      setData((prev) =>
        prev
          ? { ...prev, timelines: [result.data, ...prev.timelines] }
          : prev
      );
      setExpandedId(result.data.id);
    } else {
      alert(result.error?.message ?? "분석에 실패했습니다.");
    }
    setAnalyzing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("이미지 크기는 10MB 이하여야 합니다.");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("JPG, PNG, WebP 형식만 지원합니다.");
      return;
    }

    handleAnalyze(file);
    e.target.value = "";
  };

  const getDamageBadge = (level: string) => {
    const num = parseInt(level);
    if (num <= 2) return { label: "양호", color: "text-green-400 border-green-400/30 bg-green-400/10" };
    if (num <= 3) return { label: "보통", color: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10" };
    if (num <= 4) return { label: "주의", color: "text-orange-400 border-orange-400/30 bg-orange-400/10" };
    return { label: "위험", color: "text-red-400 border-red-400/30 bg-red-400/10" };
  };

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-8 h-8 border border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-32">
        <p className="font-heading text-[24px] font-light text-white/40 mb-4">고객을 찾을 수 없습니다</p>
        <Link href="/customers" className="text-[12px] tracking-[2px] text-gold uppercase hover:underline">
          ← 고객 목록으로
        </Link>
      </div>
    );
  }

  const { customer, timelines } = data;

  return (
    <div className="space-y-10">
      {/* Back + Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          href="/customers"
          className="text-[12px] tracking-[2px] text-white/40 hover:text-gold transition-colors uppercase mb-6 inline-block"
        >
          ← 고객 목록
        </Link>
        <div className="border border-gold/15 p-8 mt-2">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-heading text-[clamp(28px,4vw,42px)] font-light mb-2">
                {customer.name}
              </h1>
              {customer.phone && (
                <p className="text-[14px] text-white/50 font-light mb-1">
                  {customer.phone}
                </p>
              )}
              {customer.memo && (
                <p className="text-[13px] text-white/30 font-light mt-2">
                  {customer.memo}
                </p>
              )}
            </div>
            <span className="text-[11px] text-white/20 font-light">
              등록일 {new Date(customer.createdAt).toLocaleDateString("ko-KR")}
            </span>
          </div>
        </div>
      </motion.div>

      {/* New Analysis Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={analyzing}
          className="w-full px-8 py-5 border border-gold text-gold text-[12px] tracking-[3px] uppercase hover:bg-gold hover:text-charcoal transition-all duration-500 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {analyzing ? "분석 중..." : "새 분석 시작 (사진 촬영/업로드)"}
        </button>
      </motion.div>

      {/* Analyzing Loading */}
      <AnimatePresence>
        {analyzing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border border-gold/20 p-10"
          >
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div className="w-16 h-16 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
                <div className="absolute inset-0 w-16 h-16 border-2 border-transparent border-b-gold/40 rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
              </div>
              <div className="text-center">
                <p className="font-heading text-[18px] font-light text-gold mb-2">
                  AI 모발 분석 중
                </p>
                <p className="text-[13px] text-white/40 font-light">
                  AI가 모발 상태를 정밀 분석하고 맞춤 레시피를 생성 중입니다...
                </p>
                <p className="text-[11px] text-white/20 font-light mt-2">
                  약 10~20초 정도 소요됩니다
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analysis History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[12px] tracking-[4px] uppercase text-gold">
            분석 히스토리
          </h2>
          <span className="text-[12px] text-white/30 font-light">
            {timelines.length}건
          </span>
        </div>

        {timelines.length > 0 ? (
          <div className="space-y-3">
            {timelines.map((timeline, i) => {
              const isExpanded = expandedId === timeline.id;
              const analysis = timeline.analysis;
              const damage = getDamageBadge(analysis?.hairAnalysis?.damageLevel ?? "0");

              return (
                <motion.div
                  key={timeline.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  {/* Card Header */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : timeline.id)}
                    className="border border-gold/10 p-5 hover:bg-gold/5 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      {/* Thumbnail */}
                      {timeline.imageUrl && (
                        <div className="w-14 h-14 shrink-0 border border-gold/10 overflow-hidden">
                          <Image
                            src={timeline.imageUrl}
                            alt="분석 사진"
                            width={56}
                            height={56}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[14px] font-light">
                            {analysis?.hairAnalysis?.condition ?? "분석 완료"}
                          </span>
                          <span className={`text-[10px] tracking-[1px] px-2 py-0.5 border ${damage.color}`}>
                            손상도 {analysis?.hairAnalysis?.damageLevel ?? "-"}
                          </span>
                        </div>
                        <p className="text-[12px] text-white/30 font-light">
                          {new Date(timeline.createdAt).toLocaleDateString("ko-KR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <span className="text-[12px] text-gold/40 shrink-0">
                        {isExpanded ? "▲" : "▼"}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  <AnimatePresence>
                    {isExpanded && analysis && (
                      <AnalysisDetail analysis={analysis} imageUrl={timeline.imageUrl} />
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="border border-gold/10 p-16 text-center">
            <p className="font-heading text-[24px] font-light text-white/40 mb-2">
              No Analysis
            </p>
            <p className="text-[13px] text-white/30 font-light">
              아직 분석 기록이 없습니다. 위 버튼으로 첫 분석을 시작해보세요.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function AnalysisDetail({ analysis, imageUrl }: { analysis: CustomerAnalysisResult; imageUrl: string | null }) {
  const { hairAnalysis, recipe } = analysis;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="border border-gold/10 border-t-0 overflow-hidden"
    >
      <div className="p-6 space-y-8">
        {/* Photo + Summary */}
        <div className="flex flex-col sm:flex-row gap-6">
          {imageUrl && (
            <div className="w-full sm:w-48 h-48 shrink-0 border border-gold/10 overflow-hidden">
              <Image
                src={imageUrl}
                alt="분석 사진"
                width={192}
                height={192}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-[11px] tracking-[3px] text-gold uppercase mb-3">모발 상태 분석</h3>
            <p className="text-[14px] text-white/70 font-light leading-relaxed mb-4">
              {hairAnalysis.summary}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <InfoItem label="모발 유형" value={hairAnalysis.hairType} />
              <InfoItem label="굵기" value={hairAnalysis.thickness} />
              <InfoItem label="다공성" value={hairAnalysis.porosity} />
              <InfoItem label="두피 상태" value={hairAnalysis.scalpCondition} />
            </div>
          </div>
        </div>

        {/* Recipe */}
        <div>
          <h3 className="text-[11px] tracking-[3px] text-gold uppercase mb-3">맞춤 케어 레시피</h3>
          <div className="border border-gold/10 p-5 mb-4">
            <p className="font-heading text-[20px] font-light mb-2">{recipe.recommendedTreatment}</p>
            <p className="text-[13px] text-white/50 font-light">{recipe.description}</p>
          </div>

          {/* Steps */}
          {recipe.steps.length > 0 && (
            <div className="mb-4">
              <h4 className="text-[10px] tracking-[2px] text-white/30 uppercase mb-3">시술 단계</h4>
              <div className="space-y-2">
                {recipe.steps.map((step) => (
                  <div key={step.order} className="border border-gold/5 p-4 flex gap-4">
                    <span className="font-heading text-[14px] text-gold shrink-0">{String(step.order).padStart(2, "0")}</span>
                    <div>
                      <p className="text-[13px] font-light mb-1">{step.action}</p>
                      <p className="text-[11px] text-white/30 font-light">{step.duration} · {step.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Products */}
          {recipe.products.length > 0 && (
            <div className="mb-4">
              <h4 className="text-[10px] tracking-[2px] text-white/30 uppercase mb-3">추천 제품</h4>
              <div className="space-y-2">
                {recipe.products.map((product, i) => (
                  <div key={i} className="border border-gold/5 p-4">
                    <p className="text-[13px] font-light mb-1">{product.name}</p>
                    <p className="text-[11px] text-white/30 font-light">{product.purpose} · {product.usage}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Homecare */}
          {recipe.homecare.length > 0 && (
            <div className="mb-4">
              <h4 className="text-[10px] tracking-[2px] text-white/30 uppercase mb-3">홈케어 가이드</h4>
              <ul className="space-y-1">
                {recipe.homecare.map((item, i) => (
                  <li key={i} className="text-[13px] text-white/50 font-light flex gap-2">
                    <span className="text-gold/40">·</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Cautions */}
          {recipe.cautions.length > 0 && (
            <div className="mb-4">
              <h4 className="text-[10px] tracking-[2px] text-white/30 uppercase mb-3">주의사항</h4>
              <ul className="space-y-1">
                {recipe.cautions.map((item, i) => (
                  <li key={i} className="text-[13px] text-red-400/70 font-light flex gap-2">
                    <span className="text-red-400/40">!</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Revisit */}
          <div className="border border-gold/15 p-4 text-center">
            <p className="text-[11px] tracking-[2px] text-white/30 uppercase mb-1">추천 재방문</p>
            <p className="font-heading text-[24px] text-gold font-light">
              {recipe.revisitWeeks}주 후
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] tracking-[1px] text-white/25 uppercase mb-1">{label}</p>
      <p className="text-[13px] text-white/60 font-light">{value}</p>
    </div>
  );
}
