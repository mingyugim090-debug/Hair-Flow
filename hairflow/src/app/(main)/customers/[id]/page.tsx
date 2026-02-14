"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { UsageLimitModal } from "@/components/UsageLimitModal";
import type {
  Customer,
  Consultation,
  FiveViewAnalysisResult,
  StyleRecommendation,
  StyleRecommendationResult,
  StyleBasedRecipeResult,
  PostTreatmentTimeline
} from "@/types";

interface CustomerDetailResponse {
  customer: Customer;
  consultations: Consultation[];
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CustomerDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitMessage, setLimitMessage] = useState("");
  const [activeTab, setActiveTab] = useState<string>("analysis");

  // 5면 사진 업로드 ref
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const leftInputRef = useRef<HTMLInputElement>(null);
  const rightInputRef = useRef<HTMLInputElement>(null);
  const topInputRef = useRef<HTMLInputElement>(null);

  // 선택된 5면 사진
  const [selectedPhotos, setSelectedPhotos] = useState<{
    front?: File;
    back?: File;
    left?: File;
    right?: File;
    top?: File;
  }>({});

  // 5면 분석 결과 (스타일 추천용)
  const [fiveViewAnalysisResult, setFiveViewAnalysisResult] = useState<FiveViewAnalysisResult | null>(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    const res = await fetch(`/api/customers/${id}`);
    const result = await res.json();
    if (result.data) setData(result.data);
    setLoading(false);
  };

  const handlePhotoSelect = (file: File, position: 'front' | 'back' | 'left' | 'right' | 'top') => {
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("이미지는 10MB 이하여야 합니다.");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("JPG, PNG, WebP 형식만 지원합니다.");
      return;
    }

    setSelectedPhotos((prev) => ({ ...prev, [position]: file }));
  };

  const handleFiveViewAnalysis = async () => {
    if (!selectedPhotos.front || !selectedPhotos.back || !selectedPhotos.left || !selectedPhotos.right || !selectedPhotos.top) {
      alert("앞면, 뒷면, 좌측, 우측, 윗면 사진 5장을 모두 선택해주세요.");
      return;
    }

    setAnalyzing(true);
    const formData = new FormData();
    formData.append("front", selectedPhotos.front);
    formData.append("back", selectedPhotos.back);
    formData.append("left", selectedPhotos.left);
    formData.append("right", selectedPhotos.right);
    formData.append("top", selectedPhotos.top);

    const res = await fetch(`/api/customers/${id}/five-view-analysis`, {
      method: "POST",
      body: formData,
    });
    const result = await res.json();

    if (result.data) {
      setFiveViewAnalysisResult(result.data.analysis);
      await fetchData();
      setSelectedPhotos({});
      alert("5면 사진 종합 분석이 완료되었습니다!");
    } else if (result.error?.code === "USAGE_LIMIT") {
      setLimitMessage(result.error.message);
      setShowLimitModal(true);
    } else {
      alert(result.error?.message ?? "분석에 실패했습니다.");
    }
    setAnalyzing(false);
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
      <div className="flex flex-col items-center justify-center py-32">
        <p className="font-heading text-[24px] font-light text-white/40 mb-4">고객을 찾을 수 없습니다</p>
        <Link href="/customers" className="text-[12px] tracking-[2px] text-gold uppercase hover:underline font-bold">
          ← 고객 목록으로
        </Link>
      </div>
    );
  }

  const { customer, consultations } = data;

  return (
    <div className="space-y-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          href="/customers"
          className="text-[12px] tracking-[2px] text-white/40 hover:text-gold transition-colors uppercase mb-6 inline-block font-bold"
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
                <p className="text-[14px] text-white/50 font-light mb-1">{customer.phone}</p>
              )}
              {customer.memo && (
                <p className="text-[13px] text-white/40 font-light mt-3 max-w-md leading-relaxed">
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

      {/* 4 Tabs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-charcoal border border-gold/20 p-1 gap-1">
            <TabsTrigger
              value="analysis"
              className="data-[state=active]:bg-gold/20 data-[state=active]:text-gold data-[state=active]:border data-[state=active]:border-gold/60 text-[10px] sm:text-[11px] tracking-[1px] uppercase transition-all duration-500 px-2 font-bold text-white/70 hover:text-white/90 hover:bg-gold/10 border border-transparent"
            >
              AI 종합 분석
            </TabsTrigger>
            <TabsTrigger
              value="style"
              className="data-[state=active]:bg-gold/20 data-[state=active]:text-gold data-[state=active]:border data-[state=active]:border-gold/60 text-[10px] sm:text-[11px] tracking-[1px] uppercase transition-all duration-500 px-2 font-bold text-white/70 hover:text-white/90 hover:bg-gold/10 border border-transparent"
            >
              AI 스타일 추천
            </TabsTrigger>
            <TabsTrigger
              value="timeline"
              className="data-[state=active]:bg-gold/20 data-[state=active]:text-gold data-[state=active]:border data-[state=active]:border-gold/60 text-[10px] sm:text-[11px] tracking-[1px] uppercase transition-all duration-500 px-2 font-bold text-white/70 hover:text-white/90 hover:bg-gold/10 border border-transparent"
            >
              미래 예측
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-gold/20 data-[state=active]:text-gold data-[state=active]:border data-[state=active]:border-gold/60 text-[10px] sm:text-[11px] tracking-[1px] uppercase transition-all duration-500 px-2 font-bold text-white/70 hover:text-white/90 hover:bg-gold/10 border border-transparent"
            >
              시술 히스토리
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: AI 종합 분석 (5면 사진) */}
          <TabsContent value="analysis" className="mt-6 space-y-6">
            <div className="space-y-8">
              <div>
                <h2 className="text-[12px] tracking-[4px] uppercase text-gold mb-4 font-bold">5면 사진 업로드</h2>
                <div className="grid sm:grid-cols-5 gap-4">
                  {(['front', 'back', 'left', 'right', 'top'] as const).map((position) => {
                    const labels = { front: '앞면', back: '뒷면', left: '좌측', right: '우측', top: '윗면' };
                    const refs = { front: frontInputRef, back: backInputRef, left: leftInputRef, right: rightInputRef, top: topInputRef };
                    const selected = selectedPhotos[position];

                    return (
                      <div key={position}>
                        <input
                          ref={refs[position]}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handlePhotoSelect(file, position);
                            e.target.value = "";
                          }}
                          className="hidden"
                        />
                        <button
                          onClick={() => refs[position].current?.click()}
                          className="w-full aspect-square border-2 border-dashed border-gold/30 hover:border-gold/60 transition-all flex flex-col items-center justify-center gap-3 group relative overflow-hidden"
                        >
                          {selected ? (
                            <div className="absolute inset-0">
                              <Image
                                src={URL.createObjectURL(selected)}
                                alt={labels[position]}
                                fill
                                className="object-cover"
                              />
                              <div className="absolute inset-0 bg-gold/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[13px] text-white font-bold tracking-[2px]">변경</span>
                              </div>
                            </div>
                          ) : (
                            <>
                              <span className="text-[32px] text-gold/50 group-hover:text-gold transition-colors">+</span>
                              <span className="text-[12px] text-white/50 font-bold tracking-[2px]">{labels[position]}</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={handleFiveViewAnalysis}
                  disabled={analyzing || !selectedPhotos.front || !selectedPhotos.back || !selectedPhotos.left || !selectedPhotos.right || !selectedPhotos.top}
                  className="w-full mt-6 px-8 py-5 bg-gold text-charcoal font-bold text-[13px] tracking-[2px] uppercase hover:bg-gold/90 transition-all duration-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {analyzing ? "AI 종합 분석 중..." : "5면 사진 종합 분석 시작"}
                </button>
                <p className="text-[12px] text-white/30 font-light mt-3 text-center">
                  앞/뒤/좌/우/윗 사진 5장을 모두 촬영하면, AI가 두상 형태, 모발 밀도 분포, 손상도를 종합 분석합니다.
                </p>
              </div>

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
                      </div>
                      <div className="text-center">
                        <p className="font-heading text-[18px] font-light text-gold mb-2">
                          AI 종합 분석 중
                        </p>
                        <p className="text-[13px] text-white/40 font-light">
                          두상 형태, 모발 밀도 분포, 손상도를 정밀 분석 중입니다...
                        </p>
                        <p className="text-[11px] text-white/20 font-light mt-2">
                          약 15~30초 정도 소요됩니다
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="border border-gold/10 p-16 text-center">
                <p className="font-heading text-[24px] font-light text-white/40 mb-2">
                  5면 사진 분석 결과
                </p>
                <p className="text-[13px] text-white/30 font-light">
                  위 버튼으로 첫 분석을 시작해보세요.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: AI 스타일 추천 */}
          <TabsContent value="style" className="mt-6 space-y-6">
            <div className="border border-gold/10 p-16 text-center">
              <p className="font-heading text-[24px] font-light text-white/40 mb-2">
                AI 스타일 추천
              </p>
              <p className="text-[13px] text-white/30 font-light">
                먼저 AI 종합 분석을 진행하면, DALL-E 3로 생성된 스타일을 추천받을 수 있습니다.
              </p>
            </div>
          </TabsContent>

          {/* Tab 3: 미래 예측 */}
          <TabsContent value="timeline" className="mt-6 space-y-6">
            <div className="border border-gold/10 p-16 text-center">
              <p className="font-heading text-[24px] font-light text-white/40 mb-2">
                미래 예측 타임라인
              </p>
              <p className="text-[13px] text-white/30 font-light">
                시술 완료 직후 사진을 업로드하면, 1주차부터 8주차까지 변화를 예측합니다.
              </p>
            </div>
          </TabsContent>

          {/* Tab 4: 시술 히스토리 */}
          <TabsContent value="history" className="mt-6 space-y-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[12px] tracking-[4px] uppercase text-gold font-bold">
                  전체 시술 히스토리
                </h2>
                <span className="text-[12px] text-white/30 font-light">
                  {consultations.length}건
                </span>
              </div>

              {consultations.length > 0 ? (
                <div className="space-y-4">
                  {consultations.map((consultation, i) => (
                    <motion.div
                      key={consultation.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="border border-gold/10 p-6"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <Badge className="bg-gold/20 text-gold border-gold/30 text-[11px] font-bold">
                          {consultation.sessionNumber}차 시술
                        </Badge>
                        <Badge className="bg-gold/10 text-gold border-gold/20 text-[10px] font-bold uppercase">
                          {consultation.treatmentType}
                        </Badge>
                        <span className="text-[12px] text-white/30 font-light ml-auto">
                          {new Date(consultation.createdAt).toLocaleDateString("ko-KR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>

                      {consultation.notes && (
                        <div>
                          <p className="text-[11px] tracking-[2px] text-white/40 uppercase mb-2 font-bold">시술 노트</p>
                          <p className="text-[13px] text-white/60 font-light">{consultation.notes}</p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="border border-gold/10 p-16 text-center">
                  <p className="font-heading text-[24px] font-light text-white/40 mb-2">
                    No History
                  </p>
                  <p className="text-[13px] text-white/30 font-light">
                    아직 시술 히스토리가 없습니다.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      <UsageLimitModal
        open={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        message={limitMessage}
      />
    </div>
  );
}
