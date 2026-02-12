"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ImageUploader } from "@/components/ImageUploader";
import { RecipeCard } from "@/components/RecipeCard";
import { UsageLimitModal } from "@/components/UsageLimitModal";
import type { RecipeResult } from "@/types";

export default function RecipePage() {
  const [currentImage, setCurrentImage] = useState<string>("");
  const [referenceImage, setReferenceImage] = useState<string>("");
  const [recipe, setRecipe] = useState<RecipeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitMessage, setLimitMessage] = useState("");

  const handleGenerate = async () => {
    if (!currentImage || !referenceImage) {
      setError("두 장의 사진을 모두 업로드해주세요.");
      return;
    }
    setLoading(true);
    setError(null);
    setRecipe(null);
    try {
      const res = await fetch("/api/recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentImage, referenceImage }),
      });
      const result = await res.json();
      if (result.error) {
        if (result.error.code === "USAGE_LIMIT") {
          setLimitMessage(result.error.message);
          setShowLimitModal(true);
        } else {
          setError(result.error.message);
        }
      } else {
        setRecipe(result.data);
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
        <span className="section-label">AI Recipe</span>
        <h1 className="font-heading text-[clamp(28px,4vw,42px)] font-light mt-4 mb-2">
          AI <em className="italic text-gold-light">시술 레시피</em>
        </h1>
        <p className="text-[15px] text-white/50 font-light">
          현재 모발 사진과 레퍼런스 사진을 업로드하면, AI가 맞춤 시술 레시피를 생성합니다.
        </p>
      </div>

      {/* Upload Area */}
      <div className="grid sm:grid-cols-2 gap-4">
        <ImageUploader
          label="현재 모발 사진"
          description="고객의 현재 모발 상태를 촬영한 사진"
          onImageSelect={setCurrentImage}
          preview={currentImage || null}
        />
        <ImageUploader
          label="레퍼런스 사진"
          description="고객이 원하는 스타일 (연예인 사진 등)"
          onImageSelect={setReferenceImage}
          preview={referenceImage || null}
        />
      </div>

      {/* Generate Button */}
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={handleGenerate}
          disabled={!currentImage || !referenceImage || loading}
          className="px-12 py-4 border border-gold text-gold text-[12px] tracking-[4px] uppercase hover:bg-gold hover:text-charcoal transition-all duration-500 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gold"
        >
          {loading ? (
            <span className="flex items-center gap-3">
              <span className="w-4 h-4 border border-gold/30 border-t-gold rounded-full animate-spin" />
              AI 분석 중...
            </span>
          ) : (
            "레시피 생성하기"
          )}
        </button>
        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[13px] text-red-400/80 font-light">
            {error}
          </motion.p>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-6 border border-gold/30 border-t-gold rounded-full animate-spin" />
          <p className="text-white/50 font-light">GPT-4o Vision이 두 사진을 비교 분석 중입니다...</p>
          <p className="text-[12px] text-white/30 font-light mt-2 tracking-[1px]">약 10~20초 소요됩니다</p>
        </motion.div>
      )}

      {/* Result */}
      {recipe && <RecipeCard recipe={recipe} />}

      <UsageLimitModal
        open={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        message={limitMessage}
      />
    </div>
  );
}
