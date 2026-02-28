"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { UsageLimitModal } from "@/components/UsageLimitModal";
import { getStylesByCategory } from "@/lib/hairStyles";
import type { HairStyleOption } from "@/lib/hairStyles";
import type {
  Customer,
  Consultation,
  FiveViewAnalysisResult,
  StyleRecommendation,
  StyleRecommendationResult,
  StyleBasedRecipeResult,
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

  // 시술 회차 관리
  const [currentSessionNumber, setCurrentSessionNumber] = useState<number | 'new'>('new');
  const [sessionList, setSessionList] = useState<number[]>([]);

  // 앞면 사진 업로드 ref
  const frontInputRef = useRef<HTMLInputElement>(null);

  // 선택된 앞면 사진
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);

  // 앞면 분석 결과 (스타일 추천용)
  const [fiveViewAnalysisResult, setFiveViewAnalysisResult] = useState<FiveViewAnalysisResult | null>(null);
  const [frontPhotoUrl, setFrontPhotoUrl] = useState<string | null>(null);

  // AI 스타일 추천 관련
  const [styleRecommendations, setStyleRecommendations] = useState<StyleRecommendationResult | null>(null);
  const [loadingStyles, setLoadingStyles] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<StyleRecommendation | null>(null);
  const [styleRecipe, setStyleRecipe] = useState<StyleBasedRecipeResult | null>(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [imageGenerationFailed, setImageGenerationFailed] = useState(false);

  // 헤어스타일 카탈로그 선택
  const [catalogGender, setCatalogGender] = useState<'M' | 'F'>('M');
  const [selectedCatalogStyle, setSelectedCatalogStyle] = useState<HairStyleOption | null>(null);

  // 세션 데이터 복원 (Persistence)
  const restoreSession = (sessionNum: number, consultations: Consultation[]) => {
    // DB의 sessionNumber가 null이거나 0일 경우 1로 취급하여 필터링
    const sessionRows = consultations.filter(c => (c.sessionNumber || 1) === sessionNum);

    // 1. 앞면 분석 결과 복원
    const analysisRow = sessionRows.find(c => c.treatmentType === 'five-view-analysis');
    if (analysisRow?.fiveViewAnalysis) {
      setFiveViewAnalysisResult(analysisRow.fiveViewAnalysis);
      if (analysisRow.photos?.front) {
        setFrontPhotoUrl(analysisRow.photos.front);
      }
    } else {
      setFiveViewAnalysisResult(null);
      setFrontPhotoUrl(null);
    }

    // 2. 스타일 추천 복원 (DB에서 복원)
    const styleRow = sessionRows.find(c => c.treatmentType === 'style-recommendation');
    if (styleRow?.styleRecommendations) {
      setStyleRecommendations(styleRow.styleRecommendations);
    } else {
      setStyleRecommendations(null);
    }

    // 3. 레시피 복원
    const recipeRow = sessionRows.find(c => c.treatmentType === 'style-based-recipe');
    if (recipeRow?.styleBasedRecipe) {
      setStyleRecipe(recipeRow.styleBasedRecipe);
    } else {
      setStyleRecipe(null);
    }
  };

  // 최신 세션 자동 복원 + 세션 목록 업데이트
  useEffect(() => {
    if (data?.consultations && data.consultations.length > 0) {
      // 세션 목록 업데이트
      const sessions = Array.from(new Set(data.consultations.map(c => c.sessionNumber ?? 0))).filter(s => s > 0).sort((a, b) => b - a);
      setSessionList(sessions);

      // Find max session number
      const maxSession = Math.max(...data.consultations.map(c => c.sessionNumber ?? 0));
      if (maxSession > 0) {
        restoreSession(maxSession, data.consultations);
        if (currentSessionNumber === 'new') {
          setCurrentSessionNumber('new');
        }
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

  const handlePhotoSelect = (file: File) => {
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

    setSelectedPhoto(file);
  };

  const handleFiveViewAnalysis = async () => {
    if (!selectedPhoto) {
      alert("앞면 사진을 선택해주세요.");
      return;
    }

    setAnalyzing(true);
    const formData = new FormData();
    formData.append("front", selectedPhoto);
    // 세션 번호 전달
    if (currentSessionNumber !== 'new') {
      formData.append("sessionNumber", String(currentSessionNumber));
    }

    const res = await fetch(`/api/customers/${id}/five-view-analysis`, {
      method: "POST",
      body: formData,
    });
    const result = await res.json();

    if (result.data) {
      setFiveViewAnalysisResult(result.data.analysis);
      setFrontPhotoUrl(result.data.photos?.front ?? null);
      // 새 세션 번호 업데이트
      if (result.data.sessionNumber) {
        setCurrentSessionNumber(result.data.sessionNumber);
      }
      // fetchData() 호출 제거: restoreSession이 fiveViewAnalysisResult를 null로 초기화하는 race condition 방지
      setSelectedPhoto(null);
      setStyleRecommendations(null);
      setStyleRecipe(null);
      alert("AI 종합 분석이 완료되었습니다! AI 스타일 추천 탭으로 이동합니다.");
      setActiveTab("style");
    } else if (result.error?.code === "USAGE_LIMIT") {
      setLimitMessage(result.error.message);
      setShowLimitModal(true);
    } else {
      alert(result.error?.message ?? "분석에 실패했습니다.");
    }
    setAnalyzing(false);
  };

  // 선택된 스타일로 이미지 생성 + AI 분석
  const handleStyleRecommendation = async (analysis: FiveViewAnalysisResult, style?: HairStyleOption) => {
    if (!style) return;
    setLoadingStyles(true);
    setImageGenerationFailed(false);
    try {
      const res = await fetch(`/api/customers/${id}/style-recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fiveViewAnalysis: analysis,
          frontPhotoUrl: frontPhotoUrl,
          selectedStyleName: style.name,
          selectedStyleNameEn: style.nameEn,
        }),
      });

      if (!res.ok) {
        console.error('Style recommendation 오류:', res.status);
        throw new Error(`서버 오류 (${res.status})`);
      }

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
        alert(result.error?.message ?? "스타일 이미지 생성에 실패했습니다.");
      }
    } catch (error) {
      console.error('스타일 이미지 생성 오류:', error);
      alert("이미지 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoadingStyles(false);
    }
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
      // fetchData() 호출 제거: restoreSession이 DB에서 레시피를 못 찾으면 null로 초기화하는 race condition 방지
    } else if (result.error?.code === "USAGE_LIMIT") {
      setLimitMessage(result.error.message);
      setShowLimitModal(true);
    } else {
      alert(result.error?.message ?? "레시피 생성에 실패했습니다.");
    }
    setLoadingRecipe(false);
  };

  // (자동 추천 제거 — 고객이 스타일을 직접 선택하는 방식으로 변경)

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

      {/* 3 Tabs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-charcoal border border-gold/20 p-1 gap-1">
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
              value="history"
              className="data-[state=active]:bg-gold/20 data-[state=active]:text-gold data-[state=active]:border data-[state=active]:border-gold/60 text-[10px] sm:text-[11px] tracking-[1px] uppercase transition-all duration-500 px-2 font-bold text-white/70 hover:text-white/90 hover:bg-gold/10 border border-transparent"
            >
              시술 히스토리
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: AI 종합 분석 */}
          <TabsContent value="analysis" className="mt-6 space-y-6">
            <div className="space-y-8">
              {/* 시술 회차 선택 */}
              <div>
                <h2 className="text-[12px] tracking-[4px] uppercase text-gold mb-4 font-bold">시술 회차 설정</h2>
                <div className="flex flex-wrap gap-2 mb-2">
                  <button
                    onClick={() => setCurrentSessionNumber('new')}
                    className={`px-5 py-3 border font-bold text-[12px] tracking-[2px] transition-all ${currentSessionNumber === 'new'
                      ? 'border-gold bg-gold/20 text-gold'
                      : 'border-gold/20 text-white/50 hover:border-gold/50'
                      }`}
                  >
                    + 새 회차
                  </button>
                  {sessionList.map((sNum) => (
                    <button
                      key={sNum}
                      onClick={() => {
                        setCurrentSessionNumber(sNum);
                        if (data?.consultations) {
                          restoreSession(sNum, data.consultations);
                        }
                      }}
                      className={`px-5 py-3 border font-bold text-[12px] tracking-[2px] transition-all ${currentSessionNumber === sNum
                        ? 'border-gold bg-gold/20 text-gold'
                        : 'border-gold/20 text-white/50 hover:border-gold/50'
                        }`}
                    >
                      {sNum}회차
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-white/30 font-light">
                  {currentSessionNumber === 'new'
                    ? '새로운 시술 회차를 시작합니다.'
                    : `${currentSessionNumber}회차 데이터를 이어서 작업합니다.`}
                </p>
              </div>

              <div>
                <h2 className="text-[12px] tracking-[4px] uppercase text-gold mb-4 font-bold">고객 사진 업로드</h2>
                <div className="flex justify-center">
                  <div className="w-full max-w-sm">
                    <input
                      ref={frontInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoSelect(file);
                        e.target.value = "";
                      }}
                      className="hidden"
                    />
                    <button
                      onClick={() => frontInputRef.current?.click()}
                      className="w-full aspect-[3/4] border-2 border-dashed border-gold/30 hover:border-gold/60 transition-all flex flex-col items-center justify-center gap-3 group relative overflow-hidden"
                    >
                      {selectedPhoto ? (
                        <div className="absolute inset-0">
                          <Image
                            src={URL.createObjectURL(selectedPhoto)}
                            alt="앞면 사진"
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-gold/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[13px] text-white font-bold tracking-[2px]">변경</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span className="text-[40px] text-gold/50 group-hover:text-gold transition-colors">📷</span>
                          <span className="text-[13px] text-white/50 font-bold tracking-[2px]">앞면 사진</span>
                          <span className="text-[11px] text-white/30 font-light">클릭하여 업로드</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleFiveViewAnalysis}
                  disabled={analyzing || !selectedPhoto}
                  className="w-full mt-6 px-8 py-5 bg-gold text-charcoal font-bold text-[13px] tracking-[2px] uppercase hover:bg-gold/90 transition-all duration-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {analyzing ? "AI 종합 분석 중..." : "AI 종합 분석 시작"}
                </button>
                <p className="text-[12px] text-white/30 font-light mt-3 text-center">
                  앞면 사진 1장으로 AI가 얼굴형, 두상 형태, 모발 상태, 손상도를 종합 분석합니다.
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
                          얼굴형, 두상 형태, 모발 상태를 분석 중입니다...
                        </p>
                        <p className="text-[11px] text-white/20 font-light mt-2">
                          약 10~20초 정도 소요됩니다
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="border border-gold/10 p-16 text-center">
                <p className="font-heading text-[24px] font-light text-white/40 mb-2">
                  AI 종합 분석 결과
                </p>
                <p className="text-[13px] text-white/30 font-light">
                  위 버튼으로 첫 분석을 시작해보세요.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: AI 스타일 시뮬레이션 */}
          <TabsContent value="style" className="mt-6 space-y-6">
            {!fiveViewAnalysisResult ? (
              <div className="border border-gold/10 p-16 text-center">
                <p className="font-heading text-[24px] font-light text-white/40 mb-2">
                  AI 스타일 시뮬레이션
                </p>
                <p className="text-[13px] text-white/30 font-light mb-4">
                  먼저 AI 종합 분석을 진행한 후, 원하는 헤어스타일을 선택하세요.
                </p>
                <button
                  onClick={() => setActiveTab("analysis")}
                  className="px-6 py-3 bg-gold/20 text-gold border border-gold/40 font-bold text-[12px] tracking-[2px] uppercase hover:bg-gold/30 transition-all"
                >
                  AI 종합 분석으로 이동
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 성별 토글 */}
                <div className="flex gap-2">
                  {(['M', 'F'] as const).map(g => (
                    <button
                      key={g}
                      onClick={() => { setCatalogGender(g); setSelectedCatalogStyle(null); }}
                      className={`px-5 py-2 border font-bold text-[12px] tracking-[2px] transition-all ${catalogGender === g
                        ? 'border-gold bg-gold/20 text-gold'
                        : 'border-gold/20 text-white/50 hover:border-gold/50'
                        }`}
                    >
                      {g === 'M' ? '남성' : '여성'}
                    </button>
                  ))}
                </div>

                {/* 카테고리별 스타일 목록 */}
                {getStylesByCategory(catalogGender).map(group => (
                  <div key={group.category}>
                    <h3 className="text-[12px] tracking-[3px] uppercase text-gold mb-3 font-bold">
                      {group.category}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {group.styles.map(style => (
                        <button
                          key={style.id}
                          onClick={() => setSelectedCatalogStyle(style)}
                          disabled={loadingStyles}
                          className={`border p-3 text-left transition-all ${selectedCatalogStyle?.id === style.id
                            ? 'border-gold bg-gold/15 text-gold'
                            : 'border-gold/15 hover:border-gold/40 text-white/70 hover:text-white/90'
                            } disabled:opacity-40`}
                        >
                          <p className="text-[13px] font-bold">{style.name}</p>
                          <p className="text-[10px] text-white/40 font-light mt-1">{style.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* 이미지 생성 버튼 */}
                <button
                  onClick={() => selectedCatalogStyle && handleStyleRecommendation(fiveViewAnalysisResult, selectedCatalogStyle)}
                  disabled={!selectedCatalogStyle || loadingStyles}
                  className="w-full px-8 py-5 bg-gold text-charcoal font-bold text-[13px] tracking-[2px] uppercase hover:bg-gold/90 transition-all duration-500 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loadingStyles
                    ? `${selectedCatalogStyle?.name || '스타일'} 이미지 생성 중...`
                    : selectedCatalogStyle
                      ? `${selectedCatalogStyle.name} 시뮬레이션 시작`
                      : '헤어스타일을 선택하세요'}
                </button>

                {/* 로딩 */}
                <AnimatePresence>
                  {loadingStyles && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border border-gold/20 p-8"
                    >
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
                        <p className="text-[14px] text-gold font-light">
                          {selectedCatalogStyle?.name} 스타일 이미지 생성 중...
                        </p>
                        <p className="text-[11px] text-white/20 font-light">약 30~60초 소요</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 결과 표시 */}
                {styleRecommendations && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {imageGenerationFailed && (
                      <div className="p-3 bg-amber-900/30 border border-amber-500/30 rounded text-amber-200 text-[12px]">
                        ⚠️ 이미지 생성에 실패했습니다. 분석 결과는 텍스트로 확인할 수 있습니다.
                      </div>
                    )}

                    {/* 생성된 이미지 */}
                    <div className="max-w-lg mx-auto">
                      {styleRecommendations.recommendations.map((style) => (
                        <div
                          key={style.id}
                          className="border border-gold/20 cursor-pointer hover:border-gold/50 transition-all"
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
                            <div className="aspect-square w-full bg-white/5 flex items-center justify-center">
                              <div className="text-center text-white/30 p-4">
                                <span className="text-3xl block mb-2">✂️</span>
                                <span className="text-[11px]">이미지 생성 실패</span>
                              </div>
                            </div>
                          )}
                          <div className="p-5 space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-[16px] font-bold text-gold">{style.name}</h4>
                              <Badge className="bg-gold/20 text-gold border-gold/30 text-[10px] font-bold">
                                {style.suitability}% 어울림
                              </Badge>
                            </div>
                            <p className="text-[13px] text-white/60 font-light leading-relaxed">
                              {style.description}
                            </p>
                            <div className="flex items-center gap-3 text-[11px] text-white/40">
                              <span>난이도: {style.difficulty === 'easy' ? '쉬움' : style.difficulty === 'medium' ? '보통' : '어려움'}</span>
                              <span>•</span>
                              <span>{style.estimatedTime}</span>
                            </div>
                            {style.matchReason && (
                              <p className="text-[12px] text-white/50 font-light pt-2 border-t border-gold/10">
                                💡 {style.matchReason}
                              </p>
                            )}
                            {style.designerNote && (
                              <p className="text-[12px] text-gold/80 font-medium pt-2 border-t border-gold/10">
                                ✂️ {style.designerNote}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {styleRecommendations.faceShapeNote && (
                      <div className="border border-gold/10 p-4">
                        <p className="text-[12px] text-white/50 font-light">
                          📐 {styleRecommendations.faceShapeNote}
                        </p>
                      </div>
                    )}

                    {/* 다른 스타일 시도 버튼 */}
                    <button
                      onClick={() => { setStyleRecommendations(null); setSelectedCatalogStyle(null); }}
                      className="w-full px-6 py-3 border border-gold/30 text-gold font-bold text-[12px] tracking-[2px] uppercase hover:bg-gold/10 transition-all"
                    >
                      다른 스타일 시도
                    </button>
                  </motion.div>
                )}

                {/* 레시피 로딩 */}
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
                          {styleRecipe.estimatedTotalTime} / {styleRecipe.difficulty === 'easy' ? '쉬움' : styleRecipe.difficulty === 'medium' ? '보통' : '어려움'}
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
            )}
          </TabsContent>


          {/* Tab 3: 시술 히스토리 */}
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
                <div className="space-y-6">
                  {/* 세션별 그룹화 */}
                  {Array.from(new Set(consultations.map(c => c.sessionNumber ?? 0)))
                    .sort((a, b) => b - a) // 최신순 정렬
                    .map((sessionNum) => {
                      const sessionData = consultations.filter(c => c.sessionNumber === sessionNum);
                      const latestDate = new Date(Math.max(...sessionData.map(c => new Date(c.createdAt).getTime())));

                      const hasAnalysis = sessionData.some(c => c.treatmentType === 'five-view-analysis');
                      const hasRecipe = sessionData.some(c => c.treatmentType === 'style-based-recipe');
                      const hasTimeline = sessionData.some(c => c.treatmentType === 'post-treatment-timeline');

                      // 결정된 스타일 (레시피 생성된 스타일) 추출
                      const recipeConsultation = sessionData.find(c => c.treatmentType === 'style-based-recipe');
                      const decidedStyle = recipeConsultation?.styleBasedRecipe?.selectedStyle;

                      return (
                        <motion.div
                          key={sessionNum}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border border-gold/20 bg-gold/5 overflow-hidden hover:border-gold/50 transition-colors"
                        >
                          <div className="flex">
                            {/* 결정된 스타일 이미지 */}
                            <div className="w-32 sm:w-40 flex-shrink-0">
                              {decidedStyle?.imageUrl ? (
                                <div className="aspect-[3/4] w-full overflow-hidden">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={decidedStyle.imageUrl}
                                    alt={decidedStyle.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      const parent = e.currentTarget.parentElement;
                                      if (parent) {
                                        parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-white/5"><div class="text-center"><span class="text-2xl block mb-1">✂️</span><span class="text-white/20 text-[10px]">이미지 없음</span></div></div>';
                                      }
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="aspect-[3/4] w-full bg-white/5 flex items-center justify-center">
                                  <div className="text-center">
                                    <span className="text-2xl block mb-1">✂️</span>
                                    <span className="text-white/15 text-[10px]">스타일 미선택</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* 세션 정보 */}
                            <div className="flex-1 p-5 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-[16px] font-bold text-gold">{sessionNum}회차</h3>
                                  <span className="text-[11px] text-white/30 font-light">
                                    {latestDate.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
                                  </span>
                                </div>
                                {decidedStyle?.name && (
                                  <p className="text-[14px] text-white/80 font-medium mb-2">
                                    {decidedStyle.name}
                                  </p>
                                )}
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {hasAnalysis && <Badge className="bg-charcoal text-white/60 border-white/10 text-[10px]">종합 분석</Badge>}
                                  {hasRecipe && <Badge className="bg-gold/20 text-gold border-gold/30 text-[10px]">레시피 완료</Badge>}
                                  {hasTimeline && <Badge className="bg-charcoal text-white/60 border-white/10 text-[10px]">미래 예측</Badge>}
                                </div>
                              </div>
                            </div>
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
