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
  const [fiveViewPhotos, setFiveViewPhotos] = useState<Record<string, string> | null>(null);

  // AI 스타일 추천 관련
  const [styleRecommendations, setStyleRecommendations] = useState<StyleRecommendationResult | null>(null);
  const [loadingStyles, setLoadingStyles] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<StyleRecommendation | null>(null);
  const [styleRecipe, setStyleRecipe] = useState<StyleBasedRecipeResult | null>(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [imageGenerationFailed, setImageGenerationFailed] = useState(false);

  // 미래 예측 타임라인 관련
  const completedPhotoInputRef = useRef<HTMLInputElement>(null);
  const [completedPhoto, setCompletedPhoto] = useState<File | null>(null);
  const [treatmentType, setTreatmentType] = useState<'cut' | 'perm' | 'color'>('cut');
  const [timeline, setTimeline] = useState<PostTreatmentTimeline | null>(null);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  // 세션 데이터 복원 (Persistence)
  const restoreSession = (sessionNum: number, consultations: Consultation[]) => {
    // DB의 sessionNumber가 null이거나 0일 경우 1로 취급하여 필터링
    const sessionRows = consultations.filter(c => (c.sessionNumber || 1) === sessionNum);

    // 1. 5면 분석 결과 복원
    const analysisRow = sessionRows.find(c => c.treatmentType === 'five-view-analysis');
    if (analysisRow?.fiveViewAnalysis) {
      setFiveViewAnalysisResult(analysisRow.fiveViewAnalysis);
      // Photos restoration (map explicitly)
      if (analysisRow.photos) {
        setFiveViewPhotos({
          front: analysisRow.photos.front ?? '',
          back: analysisRow.photos.back ?? '',
          left: analysisRow.photos.left ?? '',
          right: analysisRow.photos.right ?? '',
          top: analysisRow.photos.top ?? '',
        });
      }
    }

    // 2. 스타일 추천 복원
    const styleRow = sessionRows.find(c => c.treatmentType === 'style-recommendation');
    if (styleRow?.styleRecommendations) {
      setStyleRecommendations(styleRow.styleRecommendations);
    } else {
      setStyleRecommendations(null); // Reset if not found in this session
    }

    // 3. 레시피 복원
    const recipeRow = sessionRows.find(c => c.treatmentType === 'style-based-recipe');
    if (recipeRow?.styleBasedRecipe) {
      setStyleRecipe(recipeRow.styleBasedRecipe);
    } else {
      setStyleRecipe(null);
    }

    // 4. 타임라인 복원
    const timelineRow = sessionRows.find(c => c.treatmentType === 'post-treatment-timeline');
    if (timelineRow?.postTreatmentTimeline) {
      setTimeline(timelineRow.postTreatmentTimeline);
    } else {
      setTimeline(null);
    }
  };

  // 최신 세션 자동 복원
  useEffect(() => {
    if (data?.consultations && data.consultations.length > 0) {
      // Find max session number
      const maxSession = Math.max(...data.consultations.map(c => c.sessionNumber ?? 0));
      if (maxSession > 0) {
        restoreSession(maxSession, data.consultations);
      }
    }
  }, [data]);

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
      setFiveViewPhotos(result.data.photos);
      await fetchData();
      setSelectedPhotos({});
      alert("5면 사진 종합 분석이 완료되었습니다! AI 스타일 추천 탭으로 이동합니다.");
      setActiveTab("style"); // 자동으로 스타일 추천 탭으로 전환
    } else if (result.error?.code === "USAGE_LIMIT") {
      setLimitMessage(result.error.message);
      setShowLimitModal(true);
    } else {
      alert(result.error?.message ?? "분석에 실패했습니다.");
    }
    setAnalyzing(false);
  };

  // AI 스타일 추천 자동 호출
  const handleStyleRecommendation = async (analysis: FiveViewAnalysisResult) => {
    setLoadingStyles(true);
    const res = await fetch(`/api/customers/${id}/style-recommendations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fiveViewAnalysis: analysis,
        frontPhotoUrl: fiveViewPhotos?.front,
      }),
    });
    const result = await res.json();

    if (result.data) {
      setStyleRecommendations(result.data.styleRecommendations);
      if (result.data.imageGenerationFailed) {
        setImageGenerationFailed(true);
      }
    } else if (result.error?.code === "USAGE_LIMIT") {
      setLimitMessage(result.error.message);
      setShowLimitModal(true);
    } else {
      alert(result.error?.message ?? "스타일 추천에 실패했습니다.");
    }
    setLoadingStyles(false);
  };

  // 스타일 선택 시 레시피 생성
  const handleStyleSelect = async (style: StyleRecommendation) => {
    if (!fiveViewAnalysisResult) return;
    setSelectedStyle(style);
    setLoadingRecipe(true);

    const res = await fetch(`/api/customers/${id}/style-to-recipe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        styleName: style.name,
        styleDescription: style.description,
        styleImageUrl: style.imageUrl,
        currentHairState: fiveViewAnalysisResult,
      }),
    });
    const result = await res.json();

    if (result.data) {
      setStyleRecipe(result.data.recipe);
      await fetchData();
    } else if (result.error?.code === "USAGE_LIMIT") {
      setLimitMessage(result.error.message);
      setShowLimitModal(true);
    } else {
      alert(result.error?.message ?? "레시피 생성에 실패했습니다.");
    }
    setLoadingRecipe(false);
  };

  // 타임라인 예측
  const handleTimelinePrediction = async () => {
    if (!completedPhoto) {
      alert("시술 완료 사진을 업로드해주세요.");
      return;
    }

    setLoadingTimeline(true);
    const formData = new FormData();
    formData.append("completedPhoto", completedPhoto);
    formData.append("treatmentType", treatmentType);

    const res = await fetch(`/api/customers/${id}/post-treatment-timeline`, {
      method: "POST",
      body: formData,
    });
    const result = await res.json();

    if (result.data) {
      setTimeline(result.data.timeline);
      if (result.data.imageGenerationFailed) {
        setImageGenerationFailed(true);
      }
      await fetchData();
      setCompletedPhoto(null);
    } else if (result.error?.code === "USAGE_LIMIT") {
      setLimitMessage(result.error.message);
      setShowLimitModal(true);
    } else {
      alert(result.error?.message ?? "타임라인 예측에 실패했습니다.");
    }
    setLoadingTimeline(false);
  };

  // 스타일 추천 탭 진입 시 자동으로 추천 생성
  useEffect(() => {
    if (activeTab === "style" && fiveViewAnalysisResult && !styleRecommendations && !loadingStyles) {
      handleStyleRecommendation(fiveViewAnalysisResult);
    }
  }, [activeTab, fiveViewAnalysisResult]);

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
            {!fiveViewAnalysisResult ? (
              <div className="border border-gold/10 p-16 text-center">
                <p className="font-heading text-[24px] font-light text-white/40 mb-2">
                  AI 스타일 추천
                </p>
                <p className="text-[13px] text-white/30 font-light mb-4">
                  먼저 AI 종합 분석을 진행하면, AI가 고객 얼굴에 맞는 스타일을 추천합니다.
                </p>
                <button
                  onClick={() => setActiveTab("analysis")}
                  className="px-6 py-3 bg-gold/20 text-gold border border-gold/40 font-bold text-[12px] tracking-[2px] uppercase hover:bg-gold/30 transition-all"
                >
                  AI 종합 분석으로 이동
                </button>
              </div>
            ) : loadingStyles ? (
              <div className="space-y-6">
                {/* 프로그레스 스텝 */}
                <div className="border border-gold/20 p-8">
                  <div className="flex flex-col items-center gap-6">
                    <p className="font-heading text-[18px] font-light text-gold">
                      AI 스타일 추천 생성 중
                    </p>
                    <div className="w-full max-w-md space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center animate-pulse">
                          <span className="text-[14px]">📊</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-[13px] text-gold font-medium">얼굴형 · 모질 분석 중...</p>
                          <div className="mt-1 h-1 bg-gold/10 rounded-full overflow-hidden">
                            <div className="h-full bg-gold rounded-full animate-[loading_2s_ease-in-out_infinite]" style={{ width: '80%' }} />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 opacity-50">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                          <span className="text-[14px]">🎨</span>
                        </div>
                        <p className="text-[13px] text-white/40 font-light">스타일 이미지 생성 대기 중</p>
                      </div>
                      <div className="flex items-center gap-3 opacity-30">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                          <span className="text-[14px]">✅</span>
                        </div>
                        <p className="text-[13px] text-white/30 font-light">완료</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-white/20 font-light">약 30~60초 소요</p>
                  </div>
                </div>

                {/* 스켈레톤 카드 */}
                <div className="grid sm:grid-cols-2 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border border-gold/10 overflow-hidden animate-pulse">
                      <div className="aspect-square bg-gold/5" />
                      <div className="p-6 space-y-3">
                        <div className="flex justify-between">
                          <div className="h-4 bg-gold/10 rounded w-24" />
                          <div className="h-4 bg-gold/10 rounded w-16" />
                        </div>
                        <div className="space-y-2">
                          <div className="h-3 bg-white/5 rounded w-full" />
                          <div className="h-3 bg-white/5 rounded w-3/4" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : styleRecommendations ? (
              <div className="space-y-8">
                <div className="border border-gold/10 p-6">
                  <h3 className="text-[12px] tracking-[3px] uppercase text-gold mb-3 font-bold">현재 헤어 분석</h3>
                  <p className="text-[14px] text-white/70 font-light leading-relaxed">
                    {styleRecommendations.currentAnalysis}
                  </p>
                </div>

                <div>
                  <h3 className="text-[12px] tracking-[3px] uppercase text-gold mb-4 font-bold">
                    추천 스타일 ({styleRecommendations.recommendations.length}개)
                  </h3>
                  {imageGenerationFailed && (
                    <div className="mb-4 p-3 bg-amber-900/30 border border-amber-500/30 rounded text-amber-200 text-[12px]">
                      ⚠️ 이미지 생성에 일부 실패했습니다. AI 분석 결과는 아래 텍스트로 확인할 수 있습니다.
                    </div>
                  )}
                  <div className="grid sm:grid-cols-2 gap-6">
                    {styleRecommendations.recommendations.map((style) => (
                      <motion.div
                        key={style.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`border cursor-pointer transition-all ${selectedStyle?.id === style.id
                          ? "border-gold bg-gold/5"
                          : "border-gold/20 hover:border-gold/50"
                          }`}
                        onClick={() => handleStyleSelect(style)}
                      >
                        {style.imageUrl ? (
                          <div className="aspect-square w-full overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={style.imageUrl}
                              alt={style.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                  parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-white/5"><div class="text-center text-white/30 p-4"><span class="text-3xl block mb-2">✂️</span><span class="text-[11px]">이미지 로딩 실패</span></div></div>';
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="aspect-square w-full overflow-hidden bg-white/5 flex items-center justify-center">
                            <div className="text-center text-white/30 p-4">
                              <span className="text-3xl block mb-2">✂️</span>
                              <span className="text-[11px]">이미지 생성 실패</span>
                            </div>
                          </div>
                        )}
                        <div className="p-6 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[16px] font-bold text-gold">{style.name}</h4>
                            <Badge className="bg-gold/20 text-gold border-gold/30 text-[10px] font-bold">
                              {style.suitability}% 어울림
                            </Badge>
                          </div>
                          <p className="text-[13px] text-white/60 font-light leading-relaxed">
                            {style.description}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-white/40 font-light">
                            <span>난이도: {style.difficulty === 'easy' ? '쉬움' : style.difficulty === 'medium' ? '보통' : '어려움'}</span>
                            <span>•</span>
                            <span>예상 시간: {style.estimatedTime}</span>
                          </div>
                          <div className="pt-3 border-t border-gold/10">
                            <p className="text-[12px] text-white/50 font-light">
                              💡 {style.matchReason}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {styleRecommendations.faceShapeNote && (
                  <div className="border border-gold/10 p-6">
                    <h3 className="text-[12px] tracking-[3px] uppercase text-gold mb-3 font-bold">얼굴형 조언</h3>
                    <p className="text-[13px] text-white/60 font-light leading-relaxed">
                      {styleRecommendations.faceShapeNote}
                    </p>
                  </div>
                )}

                {loadingRecipe && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="border border-gold/20 p-10"
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
                      <p className="text-[14px] text-gold font-light">시술 레시피 생성 중...</p>
                    </div>
                  </motion.div>
                )}

                {styleRecipe && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-gold p-8 bg-gold/5 space-y-6"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      {styleRecipe.selectedStyle.imageUrl && (
                        <div className="w-24 h-24 overflow-hidden border border-gold/30 flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={styleRecipe.selectedStyle.imageUrl}
                            alt={styleRecipe.selectedStyle.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <h3 className="text-[18px] font-bold text-gold mb-1">
                          {styleRecipe.selectedStyle.name} 시술 레시피
                        </h3>
                        <p className="text-[12px] text-white/40 font-light">
                          예상 소요 시간: {styleRecipe.estimatedTotalTime} / 난이도: {styleRecipe.difficulty === 'easy' ? '쉬움' : styleRecipe.difficulty === 'medium' ? '보통' : '어려움'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h4 className="text-[12px] tracking-[2px] uppercase text-gold mb-3 font-bold">커트 절차</h4>
                        <p className="text-[13px] text-white/60 font-light mb-3">{styleRecipe.cutProcedure.description}</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {styleRecipe.cutProcedure.techniques.map((tech, i) => (
                            <Badge key={i} className="bg-gold/10 text-gold border-gold/20 text-[10px] font-bold">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                        <div className="space-y-2">
                          {styleRecipe.cutProcedure.steps.map((step) => (
                            <div key={step.order} className="border border-gold/10 p-4">
                              <div className="flex items-start gap-3">
                                <span className="text-[12px] font-bold text-gold">#{step.order}</span>
                                <div className="flex-1">
                                  <p className="text-[13px] font-bold text-white/80 mb-1">{step.action}</p>
                                  <p className="text-[12px] text-white/50 font-light mb-1">{step.details}</p>
                                  <p className="text-[11px] text-white/30 font-light">⏱ {step.duration}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {styleRecipe.cautions.length > 0 && (
                        <div>
                          <h4 className="text-[12px] tracking-[2px] uppercase text-gold mb-3 font-bold">⚠️ 주의사항</h4>
                          <ul className="space-y-2">
                            {styleRecipe.cautions.map((caution, i) => (
                              <li key={i} className="text-[13px] text-white/60 font-light flex items-start gap-2">
                                <span className="text-gold">•</span>
                                <span>{caution}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            ) : null}
          </TabsContent>

          {/* Tab 3: 미래 예측 */}
          <TabsContent value="timeline" className="mt-6 space-y-6">
            <div className="space-y-8">
              <div>
                <h2 className="text-[12px] tracking-[4px] uppercase text-gold mb-4 font-bold">
                  시술 완료 사진 업로드
                </h2>
                <div className="grid sm:grid-cols-3 gap-4 mb-4">
                  <div className="col-span-2">
                    <input
                      ref={completedPhotoInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const maxSize = 10 * 1024 * 1024;
                          const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
                          if (file.size > maxSize) {
                            alert("이미지는 10MB 이하여야 합니다.");
                            return;
                          }
                          if (!allowedTypes.includes(file.type)) {
                            alert("JPG, PNG, WebP 형식만 지원합니다.");
                            return;
                          }
                          setCompletedPhoto(file);
                        }
                        e.target.value = "";
                      }}
                      className="hidden"
                    />
                    <button
                      onClick={() => completedPhotoInputRef.current?.click()}
                      className="w-full aspect-video border-2 border-dashed border-gold/30 hover:border-gold/60 transition-all flex flex-col items-center justify-center gap-3 group relative overflow-hidden"
                    >
                      {completedPhoto ? (
                        <div className="absolute inset-0">
                          <Image
                            src={URL.createObjectURL(completedPhoto)}
                            alt="시술 완료 사진"
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
                          <span className="text-[12px] text-white/50 font-bold tracking-[2px]">시술 완료 사진</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] tracking-[2px] uppercase text-white/50 font-bold block">
                      시술 타입
                    </label>
                    <div className="space-y-2">
                      {(['cut', 'perm', 'color'] as const).map((type) => {
                        const labels = { cut: '커트', perm: '펌', color: '염색' };
                        return (
                          <button
                            key={type}
                            onClick={() => setTreatmentType(type)}
                            className={`w-full px-4 py-3 border font-bold text-[12px] tracking-[2px] uppercase transition-all ${treatmentType === type
                              ? "border-gold bg-gold/20 text-gold"
                              : "border-gold/20 text-white/50 hover:border-gold/50 hover:text-white/80"
                              }`}
                          >
                            {labels[type]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleTimelinePrediction}
                  disabled={loadingTimeline || !completedPhoto}
                  className="w-full px-8 py-5 bg-gold text-charcoal font-bold text-[13px] tracking-[2px] uppercase hover:bg-gold/90 transition-all duration-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {loadingTimeline ? "AI 타임라인 예측 중..." : "미래 변화 예측 시작"}
                </button>
                <p className="text-[12px] text-white/30 font-light mt-3 text-center">
                  시술 완료 직후 사진을 업로드하면, 1주차부터 8주차까지 모발 변화를 예측합니다.
                </p>
              </div>

              <AnimatePresence>
                {loadingTimeline && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-6"
                  >
                    {/* 프로그레스 스텝 */}
                    <div className="border border-gold/20 p-8">
                      <div className="flex flex-col items-center gap-6">
                        <p className="font-heading text-[18px] font-light text-gold">
                          AI 타임라인 예측 중
                        </p>
                        <div className="w-full max-w-md space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center animate-pulse">
                              <span className="text-[14px]">📸</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-[13px] text-gold font-medium">시술 사진 분석 중...</p>
                              <div className="mt-1 h-1 bg-gold/10 rounded-full overflow-hidden">
                                <div className="h-full bg-gold rounded-full animate-[loading_2s_ease-in-out_infinite]" style={{ width: '70%' }} />
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 opacity-50">
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                              <span className="text-[14px]">🔮</span>
                            </div>
                            <p className="text-[13px] text-white/40 font-light">주차별 변화 이미지 생성 대기</p>
                          </div>
                          <div className="flex items-center gap-3 opacity-30">
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                              <span className="text-[14px]">✅</span>
                            </div>
                            <p className="text-[13px] text-white/30 font-light">완료</p>
                          </div>
                        </div>
                        <p className="text-[11px] text-white/20 font-light">약 1~2분 소요</p>
                      </div>
                    </div>

                    {/* 스켈레톤 카드 */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="border border-gold/10 overflow-hidden animate-pulse">
                          <div className="aspect-square bg-gold/5" />
                          <div className="p-4 space-y-2">
                            <div className="flex justify-between">
                              <div className="h-4 bg-gold/10 rounded w-20" />
                              <div className="h-4 bg-gold/10 rounded w-14" />
                            </div>
                            <div className="h-3 bg-white/5 rounded w-full" />
                            <div className="h-3 bg-white/5 rounded w-2/3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {timeline ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div className="border border-gold/10 p-6">
                    <h3 className="text-[12px] tracking-[3px] uppercase text-gold mb-3 font-bold">
                      시술 완료 상태 분석
                    </h3>
                    <div className="flex gap-4">
                      {timeline.completedPhotoUrl && (
                        <div className="w-32 h-32 overflow-hidden border border-gold/30 flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={timeline.completedPhotoUrl}
                            alt="시술 완료"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <Badge className="bg-gold/20 text-gold border-gold/30 text-[10px] font-bold mb-2">
                          {timeline.treatmentType === 'cut' ? '커트' : timeline.treatmentType === 'perm' ? '펌' : '염색'}
                        </Badge>
                        <p className="text-[13px] text-white/70 font-light leading-relaxed">
                          {timeline.currentAnalysis}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[12px] tracking-[3px] uppercase text-gold mb-4 font-bold">
                      주차별 변화 예측
                    </h3>
                    {imageGenerationFailed && (
                      <div className="mb-4 p-3 bg-amber-900/30 border border-amber-500/30 rounded text-amber-200 text-[12px]">
                        ⚠️ 이미지 생성에 일부 실패했습니다. AI 분석 결과는 아래 텍스트로 확인할 수 있습니다.
                      </div>
                    )}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {timeline.weeklyPredictions.map((pred) => (
                        <motion.div
                          key={pred.week}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: pred.week * 0.05 }}
                          className="border border-gold/20 overflow-hidden"
                        >
                          {pred.imageUrl ? (
                            <div className="aspect-square w-full overflow-hidden">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={pred.imageUrl}
                                alt={pred.label}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const parent = e.currentTarget.parentElement;
                                  if (parent) {
                                    parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-white/5"><div class="text-center text-white/30 p-4"><span class="text-3xl block mb-2">📸</span><span class="text-[11px]">이미지 로딩 실패</span></div></div>';
                                  }
                                }}
                              />
                            </div>
                          ) : (
                            <div className="aspect-square w-full overflow-hidden bg-white/5 flex items-center justify-center">
                              <div className="text-center text-white/30 p-4">
                                <span className="text-3xl block mb-2">📸</span>
                                <span className="text-[11px]">이미지 생성 실패</span>
                              </div>
                            </div>
                          )}
                          <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-[14px] font-bold text-gold">{pred.label}</h4>
                              <Badge className="bg-gold/10 text-gold border-gold/20 text-[10px] font-bold">
                                Week {pred.week}
                              </Badge>
                            </div>
                            <p className="text-[12px] text-white/60 font-light leading-relaxed">
                              {pred.description}
                            </p>
                            {pred.careTips.length > 0 && (
                              <div className="pt-3 border-t border-gold/10">
                                <p className="text-[11px] tracking-[2px] uppercase text-white/40 mb-2 font-bold">
                                  관리 팁
                                </p>
                                <ul className="space-y-1">
                                  {pred.careTips.map((tip, i) => (
                                    <li key={i} className="text-[11px] text-white/50 font-light flex items-start gap-1">
                                      <span className="text-gold">•</span>
                                      <span>{tip}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {timeline.revisitRecommendation && (
                    <div className="border border-gold p-6 bg-gold/5">
                      <h3 className="text-[12px] tracking-[3px] uppercase text-gold mb-3 font-bold">
                        💡 재방문 추천
                      </h3>
                      <p className="text-[14px] text-white/80 font-light mb-2">
                        <span className="font-bold text-gold">{timeline.revisitRecommendation.week}주 후</span> 재방문을 권장합니다.
                      </p>
                      <p className="text-[13px] text-white/60 font-light">
                        {timeline.revisitRecommendation.reason}
                      </p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="border border-gold/10 p-16 text-center">
                  <p className="font-heading text-[24px] font-light text-white/40 mb-2">
                    미래 예측 타임라인
                  </p>
                  <p className="text-[13px] text-white/30 font-light">
                    위 버튼으로 첫 예측을 시작해보세요.
                  </p>
                </div>
              )}
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
                  {/* 세션 수 계산 */}
                  {new Set(consultations.map(c => c.sessionNumber ?? 0)).size}회차
                </span>
              </div>

              {consultations.length > 0 ? (
                <div className="space-y-4">
                  {/* 세션별 그룹화 */}
                  {Array.from(new Set(consultations.map(c => c.sessionNumber ?? 0)))
                    .sort((a, b) => b - a) // 최신순 정렬
                    .map((sessionNum) => {
                      const sessionData = consultations.filter(c => c.sessionNumber === sessionNum);
                      const latestDate = new Date(Math.max(...sessionData.map(c => new Date(c.createdAt).getTime())));

                      const hasAnalysis = sessionData.some(c => c.treatmentType === 'five-view-analysis');
                      const hasStyle = sessionData.some(c => c.treatmentType === 'style-recommendation');
                      const hasRecipe = sessionData.some(c => c.treatmentType === 'style-based-recipe');
                      const hasTimeline = sessionData.some(c => c.treatmentType === 'post-treatment-timeline');

                      return (
                        <motion.div
                          key={sessionNum}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border border-gold/20 bg-gold/5 p-6 space-y-4 hover:border-gold/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-[16px] font-bold text-gold">Session {sessionNum || '?'}</h3>
                                <span className="text-[12px] text-white/40 font-light">
                                  {latestDate.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                {hasAnalysis && <Badge className="bg-charcoal text-white/60 border-white/10 text-[10px]">종합 분석</Badge>}
                                {hasStyle && <Badge className="bg-charcoal text-white/60 border-white/10 text-[10px]">스타일 추천</Badge>}
                                {hasRecipe && <Badge className="bg-charcoal text-white/60 border-white/10 text-[10px]">레시피</Badge>}
                                {hasTimeline && <Badge className="bg-charcoal text-white/60 border-white/10 text-[10px]">미래 예측</Badge>}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                restoreSession(sessionNum, consultations);
                                setActiveTab('analysis');
                                alert(`${sessionNum}차 시술 데이터를 불러왔습니다. 확인해보세요!`);
                              }}
                              className="px-4 py-2 bg-gold text-charcoal font-bold text-[11px] tracking-[1px] uppercase hover:bg-gold/90 transition-all rounded-sm"
                            >
                              상세보기
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
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
