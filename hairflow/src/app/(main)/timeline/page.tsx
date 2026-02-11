"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ImageUploader } from "@/components/ImageUploader";
import { TimelineView } from "@/components/TimelineView";
import type { TimelineResult } from "@/types";

const treatmentTypes = [
  { value: "color" as const, label: "Color", labelKr: "염색", desc: "퇴색 과정 예측" },
  { value: "cut" as const, label: "Cut", labelKr: "커트", desc: "자라나는 과정 예측" },
  { value: "perm" as const, label: "Perm", labelKr: "펌", desc: "풀리는 과정 예측" },
];

export default function TimelinePage() {
  const [treatmentImage, setTreatmentImage] = useState<string>("");
  const [treatmentType, setTreatmentType] = useState<"color" | "cut" | "perm">("color");
  const [result, setResult] = useState<TimelineResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!treatmentImage) {
      setError("시술 완료 사진을 업로드해주세요.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ treatmentImage, treatmentType }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error.message);
      } else {
        setResult(data.data);
      }
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <span className="section-label">AI Timeline</span>
        <h1 className="font-heading text-[clamp(28px,4vw,42px)] font-light mt-4 mb-2">
          AI <em className="italic text-gold-light">미래 타임라인</em>
        </h1>
        <p className="text-[15px] text-white/50 font-light">
          시술 완료 사진을 업로드하면, AI가 시간 경과에 따른 모발 변화를 예측합니다.
        </p>
      </div>

      {/* Treatment Type Selection */}
      <div>
        <p className="text-[12px] tracking-[4px] uppercase text-gold mb-4">시술 종류</p>
        <div className="grid grid-cols-3 gap-px">
          {treatmentTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setTreatmentType(type.value)}
              className={`p-6 border text-center transition-all duration-500 ${
                treatmentType === type.value
                  ? "border-gold bg-gold/10 text-white"
                  : "border-gold/10 text-white/40 hover:border-gold/30"
              }`}
            >
              <p className="font-heading text-[20px] font-normal mb-1">{type.label}</p>
              <p className="text-[12px] text-white/40 font-light">{type.labelKr}</p>
              <p className="text-[11px] text-white/25 font-light mt-1">{type.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Upload Area */}
      <div className="max-w-md mx-auto">
        <ImageUploader
          label="시술 완료 사진"
          description="시술이 완료된 직후의 모발 사진"
          onImageSelect={setTreatmentImage}
          preview={treatmentImage || null}
        />
      </div>

      {/* Generate Button */}
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={handleGenerate}
          disabled={!treatmentImage || loading}
          className="px-12 py-4 border border-gold text-gold text-[12px] tracking-[4px] uppercase hover:bg-gold hover:text-charcoal transition-all duration-500 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gold"
        >
          {loading ? (
            <span className="flex items-center gap-3">
              <span className="w-4 h-4 border border-gold/30 border-t-gold rounded-full animate-spin" />
              AI 분석 중...
            </span>
          ) : (
            "타임라인 생성하기"
          )}
        </button>
        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[13px] text-red-400/80 font-light">
            {error}
          </motion.p>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-6 border border-gold/30 border-t-gold rounded-full animate-spin" />
          <p className="text-white/50 font-light">AI가 미래 변화를 예측하고 이미지를 생성 중입니다...</p>
          <p className="text-[12px] text-white/30 font-light mt-2 tracking-[1px]">약 30~60초 소요됩니다 (DALL-E 3 이미지 생성)</p>
        </motion.div>
      )}

      {/* Result */}
      {result && <TimelineView result={result} />}
    </div>
  );
}
