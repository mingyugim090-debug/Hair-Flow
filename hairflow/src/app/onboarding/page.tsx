"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const SPECIALTY_OPTIONS = [
  "커트", "염색", "탈색", "펌", "매직",
  "클리닉", "두피케어", "업스타일", "남성컷", "키즈컷",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Form data
  const [shopName, setShopName] = useState("");
  const [designerName, setDesignerName] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [instagramId, setInstagramId] = useState("");
  const [bio, setBio] = useState("");

  const toggleSpecialty = (s: string) => {
    setSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const canNext = () => {
    if (step === 1) return shopName.trim() && designerName.trim();
    if (step === 2) return specialties.length > 0;
    return true;
  };

  const handleSubmit = async () => {
    setSaving(true);
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopName, designerName, instagramId, specialties, bio }),
    });
    const result = await res.json();
    if (result.data) {
      router.push("/dashboard");
    } else {
      alert(result.error?.message ?? "저장에 실패했습니다.");
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-charcoal flex flex-col">
      {/* Header */}
      <div className="pt-12 pb-6 px-6 text-center">
        <Image src="/logo.png" alt="HairFlow" width={48} height={48} className="mx-auto mb-4 object-contain" />
        <h1 className="font-heading text-[28px] font-light text-white tracking-[2px]">
          HAIRFLOW
        </h1>
        <p className="text-[13px] text-white/40 font-light mt-2">
          디자이너님의 정보를 알려주세요
        </p>
      </div>

      {/* Progress Bar */}
      <div className="px-8 max-w-md mx-auto w-full mb-8">
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-[2px] flex-1 transition-colors duration-500 ${
                s <= step ? "bg-gold" : "bg-white/10"
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] tracking-[2px] text-gold/60 uppercase">
            Step {step} of 3
          </span>
          <span className="text-[10px] tracking-[2px] text-white/30 uppercase">
            {step === 1 ? "기본 정보" : step === 2 ? "전문 분야" : "소셜 & 소개"}
          </span>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 px-6 max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <h2 className="font-heading text-[24px] font-light text-white mb-1">
                  매장 <em className="italic text-gold-light">정보</em>
                </h2>
                <p className="text-[13px] text-white/40 font-light">
                  활동하시는 매장과 이름을 입력해주세요
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-[11px] tracking-[3px] text-gold uppercase block mb-3">
                    매장명
                  </label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="예: 헤어플로우 강남점"
                    className="w-full bg-transparent border border-gold/20 px-5 py-4 text-[15px] font-light text-white placeholder:text-white/20 focus:border-gold/50 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11px] tracking-[3px] text-gold uppercase block mb-3">
                    디자이너명
                  </label>
                  <input
                    type="text"
                    value={designerName}
                    onChange={(e) => setDesignerName(e.target.value)}
                    placeholder="예: 김헤어"
                    className="w-full bg-transparent border border-gold/20 px-5 py-4 text-[15px] font-light text-white placeholder:text-white/20 focus:border-gold/50 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <h2 className="font-heading text-[24px] font-light text-white mb-1">
                  전문 <em className="italic text-gold-light">분야</em>
                </h2>
                <p className="text-[13px] text-white/40 font-light">
                  자신 있는 시술을 선택해주세요 (복수 선택)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {SPECIALTY_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleSpecialty(s)}
                    className={`py-4 px-4 border text-[13px] tracking-[1px] font-light transition-all duration-300 ${
                      specialties.includes(s)
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-white/10 text-white/40 hover:border-gold/30 hover:text-white/60"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <h2 className="font-heading text-[24px] font-light text-white mb-1">
                  소셜 & <em className="italic text-gold-light">소개</em>
                </h2>
                <p className="text-[13px] text-white/40 font-light">
                  고객에게 보여질 정보를 입력해주세요
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-[11px] tracking-[3px] text-gold uppercase block mb-3">
                    인스타그램 아이디
                  </label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 text-[15px]">@</span>
                    <input
                      type="text"
                      value={instagramId}
                      onChange={(e) => setInstagramId(e.target.value.replace(/^@/, ""))}
                      placeholder="instagram_id"
                      className="w-full bg-transparent border border-gold/20 pl-10 pr-5 py-4 text-[15px] font-light text-white placeholder:text-white/20 focus:border-gold/50 focus:outline-none transition-colors"
                    />
                  </div>
                  <p className="text-[11px] text-white/20 mt-2 font-light">선택사항</p>
                </div>
                <div>
                  <label className="text-[11px] tracking-[3px] text-gold uppercase block mb-3">
                    한 줄 소개
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="예: 10년 경력 컬러 전문 디자이너, 자연스러운 아름다움을 추구합니다"
                    rows={3}
                    maxLength={100}
                    className="w-full bg-transparent border border-gold/20 px-5 py-4 text-[15px] font-light text-white placeholder:text-white/20 focus:border-gold/50 focus:outline-none transition-colors resize-none"
                  />
                  <p className="text-[11px] text-white/20 mt-1 text-right font-light">{bio.length}/100</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Actions */}
      <div className="px-6 pb-8 pt-6 max-w-md mx-auto w-full space-y-3 safe-area-bottom">
        {step < 3 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canNext()}
            className="w-full py-4 border border-gold text-gold text-[12px] tracking-[3px] uppercase hover:bg-gold hover:text-charcoal transition-all duration-500 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            다음
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full py-4 bg-gold text-charcoal text-[12px] tracking-[3px] uppercase font-medium hover:bg-gold-light transition-all duration-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? "프로필 생성 중..." : "시작하기"}
          </button>
        )}
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            className="w-full py-3 text-white/30 text-[12px] tracking-[2px] uppercase hover:text-white/50 transition-colors"
          >
            이전
          </button>
        )}
      </div>
    </div>
  );
}
