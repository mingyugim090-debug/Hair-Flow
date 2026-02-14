"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { UsageLimitModal } from "@/components/UsageLimitModal";
import type { Customer, Consultation, ThreeViewAnalysisResult } from "@/types";

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
  const [activeTab, setActiveTab] = useState<string>("comprehensive");
  
  // 3면 사진 업로드 ref
  const frontInputRef = useRef<HTMLInputElement>(null!);
  const backInputRef = useRef<HTMLInputElement>(null!);
  const sideInputRef = useRef<HTMLInputElement>(null);
  
  // 선택된 사진들
  const [selectedPhotos, setSelectedPhotos] = useState<{
    front?: File;
    back?: File;
    side?: File;
  }>({});

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    const res = await fetch(`/api/customers/${id}`);
    const result = await res.json();
    if (result.data) setData(result.data);
    setLoading(false);
  };

  const handlePhotoSelect = (file: File, position: 'front' | 'back' | 'side') => {
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

  const handleComprehensiveAnalysis = async () => {
    if (!selectedPhotos.front || !selectedPhotos.back || !selectedPhotos.side) {
      alert("앞면, 뒷면, 옆면 사진 3장을 모두 선택해주세요.");
      return;
    }

    setAnalyzing(true);
    const formData = new FormData();
    formData.append("front", selectedPhotos.front);
    formData.append("back", selectedPhotos.back);
    formData.append("side", selectedPhotos.side);

    const res = await fetch(`/api/customers/${id}/comprehensive-analysis`, {
      method: "POST",
      body: formData,
    });
    const result = await res.json();

    if (result.data) {
      await fetchData();
      setSelectedPhotos({});
      alert("종합 분석이 완료되었습니다!");
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
      <div className="text-center py-32">
        <p className="font-heading text-[24px] font-light text-white/40 mb-4">고객을 찾을 수 없습니다</p>
        <Link href="/customers" className="text-[12px] tracking-[2px] text-gold uppercase hover:underline">
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

      {/* 4 Tabs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-charcoal border border-gold/20 p-1 gap-1">
            <TabsTrigger
              value="comprehensive"
              className="data-[state=active]:bg-gold/20 data-[state=active]:text-gold data-[state=active]:border data-[state=active]:border-gold/60 text-[10px] sm:text-[11px] tracking-[1px] uppercase transition-all duration-500 px-2 font-bold text-white/70 hover:text-white/90 hover:bg-gold/10 border border-transparent"
            >
              AI 종합 분석
            </TabsTrigger>
            <TabsTrigger
              value="recipe"
              className="data-[state=active]:bg-gold/20 data-[state=active]:text-gold data-[state=active]:border data-[state=active]:border-gold/60 text-[10px] sm:text-[11px] tracking-[1px] uppercase transition-all duration-500 px-2 font-bold text-white/70 hover:text-white/90 hover:bg-gold/10 border border-transparent"
            >
              시술 레시피
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

          {/* Tab 1: AI 종합 분석 */}
          <TabsContent value="comprehensive" className="mt-6 space-y-6">
            <ComprehensiveAnalysisTab
              frontInputRef={frontInputRef}
              backInputRef={backInputRef}
              sideInputRef={sideInputRef}
              selectedPhotos={selectedPhotos}
              onPhotoSelect={handlePhotoSelect}
              onAnalyze={handleComprehensiveAnalysis}
              analyzing={analyzing}
              consultations={consultations}
            />
          </TabsContent>

          {/* Tab 2: 시술 레시피 */}
          <TabsContent value="recipe" className="mt-6 space-y-6">
            <RecipeTab consultations={consultations} customerId={id as string} />
          </TabsContent>

          {/* Tab 3: 미래 예측 타임라인 */}
          <TabsContent value="timeline" className="mt-6 space-y-6">
            <TimelineTab consultations={consultations} />
          </TabsContent>

          {/* Tab 4: 시술 히스토리 */}
          <TabsContent value="history" className="mt-6 space-y-6">
            <HistoryTab consultations={consultations} />
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

// Tab 1: AI 종합 분석 (3면 사진 + 모발 + 스타일)
function ComprehensiveAnalysisTab({
  frontInputRef,
  backInputRef,
  sideInputRef,
  selectedPhotos,
  onPhotoSelect,
  onAnalyze,
  analyzing,
  consultations,
}: {
  frontInputRef: React.RefObject<HTMLInputElement | null>;
  backInputRef: React.RefObject<HTMLInputElement | null>;
  sideInputRef: React.RefObject<HTMLInputElement | null>;
  selectedPhotos: { front?: File; back?: File; side?: File };
  onPhotoSelect: (file: File, position: 'front' | 'back' | 'side') => void;
  onAnalyze: () => void;
  analyzing: boolean;
  consultations: Consultation[];
}) {
  const analysisConsultations = consultations.filter((c) => c.treatmentType === 'analysis' && c.analysisResult);

  return (
    <div className="space-y-8">
      {/* 3면 사진 업로드 */}
      <div>
        <h2 className="text-[12px] tracking-[4px] uppercase text-gold mb-4 font-bold">3면 사진 업로드</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {(['front', 'back', 'side'] as const).map((position) => {
            const labels = { front: '앞면', back: '뒷면', side: '옆면' };
            const refs = { front: frontInputRef, back: backInputRef, side: sideInputRef };
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
                    if (file) onPhotoSelect(file, position);
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
          onClick={onAnalyze}
          disabled={analyzing || !selectedPhotos.front || !selectedPhotos.back || !selectedPhotos.side}
          className="w-full mt-6 px-8 py-5 bg-gold text-charcoal font-bold text-[13px] tracking-[2px] uppercase hover:bg-gold/90 transition-all duration-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          {analyzing ? "AI 종합 분석 중..." : "3면 사진 종합 분석 시작"}
        </button>
        <p className="text-[12px] text-white/30 font-light mt-3 text-center">
          앞면, 뒷면, 옆면 사진 3장을 모두 촬영하면, AI가 얼굴형, 스타일, 모발 상태를 종합 분석합니다.
        </p>
      </div>

      {/* 분석 중 로딩 */}
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
                  얼굴형, 스타일, 모발 상태를 정밀 분석하고 맞춤 추천을 생성 중입니다...
                </p>
                <p className="text-[11px] text-white/20 font-light mt-2">
                  약 15~30초 정도 소요됩니다
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 분석 히스토리 */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[12px] tracking-[4px] uppercase text-gold font-bold">
            종합 분석 히스토리
          </h2>
          <span className="text-[12px] text-white/30 font-light">
            {analysisConsultations.length}건
          </span>
        </div>

        {analysisConsultations.length > 0 ? (
          <div className="space-y-4">
            {analysisConsultations.map((consultation, i) => (
              <AnalysisResultCard key={consultation.id} consultation={consultation} delay={i * 0.05} />
            ))}
          </div>
        ) : (
          <div className="border border-gold/10 p-16 text-center">
            <p className="font-heading text-[24px] font-light text-white/40 mb-2">
              No Analysis
            </p>
            <p className="text-[13px] text-white/30 font-light">
              아직 종합 분석 기록이 없습니다. 위 버튼으로 첫 분석을 시작해보세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// 분석 결과 카드
function AnalysisResultCard({ consultation, delay }: { consultation: Consultation; delay: number }) {
  const [expanded, setExpanded] = useState(false);
  const analysis = consultation.analysisResult!;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <div
        onClick={() => setExpanded(!expanded)}
        className="border border-gold/10 p-6 hover:bg-gold/5 transition-colors cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge className="bg-gold/20 text-gold border-gold/30 text-[10px] font-bold">
                {consultation.sessionNumber}차 시술
              </Badge>
              <span className="text-[14px] font-light">
                {analysis.faceShape.type} · {analysis.hairAnalysis.condition}
              </span>
            </div>
            <p className="text-[12px] text-white/30 font-light">
              {new Date(consultation.createdAt).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <span className="text-[12px] text-gold/40">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border border-gold/10 border-t-0 p-6 space-y-8"
          >
            {/* 3면 사진 */}
            <div>
              <h3 className="text-[11px] tracking-[3px] text-gold uppercase mb-4 font-bold">촬영 사진</h3>
              <div className="grid grid-cols-3 gap-3">
                {consultation.photos.front && (
                  <div className="aspect-square relative border border-gold/10">
                    <Image src={consultation.photos.front} alt="앞면" fill className="object-cover" />
                    <span className="absolute bottom-2 left-2 text-[10px] bg-charcoal/80 text-white/70 px-2 py-1 font-bold">앞면</span>
                  </div>
                )}
                {consultation.photos.back && (
                  <div className="aspect-square relative border border-gold/10">
                    <Image src={consultation.photos.back} alt="뒷면" fill className="object-cover" />
                    <span className="absolute bottom-2 left-2 text-[10px] bg-charcoal/80 text-white/70 px-2 py-1 font-bold">뒷면</span>
                  </div>
                )}
                {consultation.photos.side && (
                  <div className="aspect-square relative border border-gold/10">
                    <Image src={consultation.photos.side} alt="옆면" fill className="object-cover" />
                    <span className="absolute bottom-2 left-2 text-[10px] bg-charcoal/80 text-white/70 px-2 py-1 font-bold">옆면</span>
                  </div>
                )}
              </div>
            </div>

            {/* 얼굴형 분석 */}
            <div>
              <h3 className="text-[11px] tracking-[3px] text-gold uppercase mb-3 font-bold">얼굴형 분석</h3>
              <div className="border border-gold/10 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-heading text-[24px] text-gold-light">{analysis.faceShape.type}</span>
                  <Badge className="bg-gold/10 text-gold border-gold/20 text-[10px] font-bold">
                    신뢰도 {analysis.faceShape.confidence}%
                  </Badge>
                </div>
                <p className="text-[14px] text-white/70 font-light leading-relaxed">
                  {analysis.faceShape.description}
                </p>
              </div>
            </div>

            {/* 스타일 분석 */}
            <div>
              <h3 className="text-[11px] tracking-[3px] text-gold uppercase mb-3 font-bold">스타일 분석</h3>
              <div className="space-y-4">
                <div className="border border-gold/10 p-5">
                  <p className="text-[11px] text-white/40 uppercase mb-2 font-bold">현재 스타일</p>
                  <p className="text-[14px] text-white/70 font-light">{analysis.styleAnalysis.currentStyle}</p>
                </div>
                <div className="border border-gold/10 p-5">
                  <p className="text-[11px] text-white/40 uppercase mb-2 font-bold">분위기</p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.styleAnalysis.vibe.map((v, i) => (
                      <Badge key={i} className="bg-gold/10 text-gold border-gold/20 text-[11px] font-bold">
                        {v}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 추천 스타일 */}
            <div>
              <h3 className="text-[11px] tracking-[3px] text-gold uppercase mb-4 font-bold">추천 헤어 스타일</h3>
              <div className="space-y-3">
                {analysis.styleAnalysis.recommendedStyles.map((style, i) => (
                  <div key={i} className="border border-gold/5 p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-heading text-[18px] text-gold-light">{style.name}</span>
                      <Badge className="bg-gold/10 text-gold border-gold/20 text-[10px] font-bold">
                        {style.suitability}% 어울림
                      </Badge>
                    </div>
                    <p className="text-[13px] text-white/60 font-light mb-2">{style.reason}</p>
                    <p className="text-[11px] text-white/40 font-light italic">{style.imageDescription}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 모발 분석 */}
            <div>
              <h3 className="text-[11px] tracking-[3px] text-gold uppercase mb-3 font-bold">모발 상태 분석</h3>
              <div className="border border-gold/10 p-5 mb-4">
                <p className="text-[14px] text-white/70 font-light leading-relaxed mb-4">
                  {analysis.hairAnalysis.summary}
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <InfoItem label="전체 상태" value={analysis.hairAnalysis.condition} />
                  <InfoItem label="손상도" value={`${analysis.hairAnalysis.damageLevel}/5`} />
                  <InfoItem label="모발 유형" value={analysis.hairAnalysis.hairType} />
                  <InfoItem label="굵기" value={analysis.hairAnalysis.thickness} />
                  <InfoItem label="다공성" value={analysis.hairAnalysis.porosity} />
                  <InfoItem label="밀도" value={analysis.hairAnalysis.density} />
                  <InfoItem label="두피 상태" value={analysis.hairAnalysis.scalpCondition} />
                </div>
              </div>
            </div>

            {/* 종합 조언 */}
            <div className="border border-gold/15 p-6 bg-gold/5">
              <h3 className="text-[11px] tracking-[3px] text-gold uppercase mb-3 font-bold">종합 조언</h3>
              <p className="text-[14px] text-white/70 font-light leading-relaxed">
                {analysis.comprehensiveAdvice}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] tracking-[1px] text-white/40 uppercase mb-1 font-bold">{label}</p>
      <p className="text-[13px] text-white/70 font-light">{value}</p>
    </div>
  );
}

// Tab 2: 시술 레시피
function RecipeTab({ consultations, customerId }: { consultations: Consultation[]; customerId: string }) {
  const [showChemicalForm, setShowChemicalForm] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<string>("");
  const [chemicalForm, setChemicalForm] = useState({
    brand: "",
    productName: "",
    ratio: "",
    mixingNotes: "",
    applicationMethod: "",
    processingTime: "",
  });

  const handleChemicalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConsultation) {
      alert("시술 회차를 선택해주세요.");
      return;
    }

    const res = await fetch(`/api/customers/${customerId}/chemicals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        consultationId: selectedConsultation,
        ...chemicalForm,
      }),
    });

    const result = await res.json();
    if (result.data) {
      alert("약제 배합 기록이 저장되었습니다!");
      setShowChemicalForm(false);
      setChemicalForm({
        brand: "",
        productName: "",
        ratio: "",
        mixingNotes: "",
        applicationMethod: "",
        processingTime: "",
      });
      window.location.reload();
    } else {
      alert(result.error?.message ?? "저장에 실패했습니다.");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-[12px] tracking-[4px] uppercase text-gold mb-4 font-bold">약제 배합 기록 추가</h2>
        <button
          onClick={() => setShowChemicalForm(!showChemicalForm)}
          className="px-8 py-4 border-2 border-gold text-gold font-bold text-[12px] tracking-[2px] uppercase hover:bg-gold hover:text-charcoal transition-all duration-500 shadow-md hover:shadow-lg"
        >
          {showChemicalForm ? "취소" : "+ 약제 배합 기록 추가"}
        </button>
      </div>

      {showChemicalForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          onSubmit={handleChemicalSubmit}
          className="border border-gold/15 p-6 space-y-4"
        >
          <div>
            <label className="text-[11px] tracking-[2px] text-white/40 uppercase block mb-2 font-bold">
              시술 회차 선택 *
            </label>
            <select
              required
              value={selectedConsultation}
              onChange={(e) => setSelectedConsultation(e.target.value)}
              className="w-full bg-charcoal border border-gold/20 px-4 py-3 text-[14px] font-light text-white focus:border-gold/50 focus:outline-none transition-colors"
            >
              <option value="">선택...</option>
              {consultations.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.sessionNumber}차 시술 ({new Date(c.createdAt).toLocaleDateString("ko-KR")})
                </option>
              ))}
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] tracking-[2px] text-white/40 uppercase block mb-2 font-bold">
                브랜드 *
              </label>
              <input
                type="text"
                required
                value={chemicalForm.brand}
                onChange={(e) => setChemicalForm({ ...chemicalForm, brand: e.target.value })}
                className="w-full bg-charcoal border border-gold/20 px-4 py-3 text-[14px] font-light text-white focus:border-gold/50 focus:outline-none transition-colors"
                placeholder="웰라, 로레알, 밀본 등"
              />
            </div>
            <div>
              <label className="text-[11px] tracking-[2px] text-white/40 uppercase block mb-2 font-bold">
                제품명 *
              </label>
              <input
                type="text"
                required
                value={chemicalForm.productName}
                onChange={(e) => setChemicalForm({ ...chemicalForm, productName: e.target.value })}
                className="w-full bg-charcoal border border-gold/20 px-4 py-3 text-[14px] font-light text-white focus:border-gold/50 focus:outline-none transition-colors"
                placeholder="컬러 터치, 콜레스톤 등"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] tracking-[2px] text-white/40 uppercase block mb-2 font-bold">
              배합 비율 *
            </label>
            <input
              type="text"
              required
              value={chemicalForm.ratio}
              onChange={(e) => setChemicalForm({ ...chemicalForm, ratio: e.target.value })}
              className="w-full bg-charcoal border border-gold/20 px-4 py-3 text-[14px] font-light text-white focus:border-gold/50 focus:outline-none transition-colors"
              placeholder="6N + 7A 1:1 + 옥시 6% 1:1.5"
            />
          </div>

          <div>
            <label className="text-[11px] tracking-[2px] text-white/40 uppercase block mb-2 font-bold">
              배합 메모
            </label>
            <textarea
              value={chemicalForm.mixingNotes}
              onChange={(e) => setChemicalForm({ ...chemicalForm, mixingNotes: e.target.value })}
              rows={3}
              className="w-full bg-charcoal border border-gold/20 px-4 py-3 text-[14px] font-light text-white focus:border-gold/50 focus:outline-none transition-colors resize-none"
              placeholder="추가 배합 설명이나 특이사항"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] tracking-[2px] text-white/40 uppercase block mb-2 font-bold">
                도포 방법
              </label>
              <input
                type="text"
                value={chemicalForm.applicationMethod}
                onChange={(e) => setChemicalForm({ ...chemicalForm, applicationMethod: e.target.value })}
                className="w-full bg-charcoal border border-gold/20 px-4 py-3 text-[14px] font-light text-white focus:border-gold/50 focus:outline-none transition-colors"
                placeholder="후두부→측두부→전두부"
              />
            </div>
            <div>
              <label className="text-[11px] tracking-[2px] text-white/40 uppercase block mb-2 font-bold">
                방치 시간
              </label>
              <input
                type="text"
                value={chemicalForm.processingTime}
                onChange={(e) => setChemicalForm({ ...chemicalForm, processingTime: e.target.value })}
                className="w-full bg-charcoal border border-gold/20 px-4 py-3 text-[14px] font-light text-white focus:border-gold/50 focus:outline-none transition-colors"
                placeholder="상온 30분 또는 가온 20분"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full px-8 py-4 bg-gold text-charcoal font-bold text-[12px] tracking-[2px] uppercase hover:bg-gold/90 transition-all duration-500 shadow-lg hover:shadow-xl"
          >
            약제 기록 저장
          </button>
        </motion.form>
      )}

      {/* 약제 기록 리스트 */}
      <div>
        <h2 className="text-[12px] tracking-[4px] uppercase text-gold mb-4 font-bold">
          약제 배합 히스토리
        </h2>
        {consultations.some((c) => c.chemicalRecords.length > 0) ? (
          <div className="space-y-4">
            {consultations.map((consultation) =>
              consultation.chemicalRecords.map((record) => (
                <div key={record.id} className="border border-gold/10 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge className="bg-gold/20 text-gold border-gold/30 text-[10px] font-bold">
                      {consultation.sessionNumber}차 시술
                    </Badge>
                    <span className="text-[12px] text-white/30 font-light">
                      {new Date(record.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <InfoItem label="브랜드" value={record.brand} />
                    <InfoItem label="제품명" value={record.productName} />
                    <InfoItem label="배합 비율" value={record.ratio} />
                    {record.mixingNotes && <InfoItem label="배합 메모" value={record.mixingNotes} />}
                    {record.applicationMethod && <InfoItem label="도포 방법" value={record.applicationMethod} />}
                    {record.processingTime && <InfoItem label="방치 시간" value={record.processingTime} />}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="border border-gold/10 p-16 text-center">
            <p className="font-heading text-[24px] font-light text-white/40 mb-2">
              No Records
            </p>
            <p className="text-[13px] text-white/30 font-light">
              아직 약제 배합 기록이 없습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Tab 3: 미래 예측 타임라인
function TimelineTab({ consultations }: { consultations: Consultation[] }) {
  const timelineConsultations = consultations.filter((c) => c.treatmentType === 'timeline' && c.timelinePrediction);

  return (
    <div className="space-y-8">
      <div className="border border-gold/10 p-6 text-center bg-gold/5">
        <p className="text-[13px] text-white/60 font-light">
          타임라인 예측 기능은 기존 API를 사용합니다. (별도 탭으로 분리)
        </p>
      </div>

      {timelineConsultations.length > 0 ? (
        <div className="space-y-4">
          {timelineConsultations.map((consultation, i) => (
            <div key={consultation.id} className="border border-gold/10 p-6">
              <Badge className="bg-gold/20 text-gold border-gold/30 text-[10px] font-bold mb-4">
                {consultation.sessionNumber}차 시술
              </Badge>
              <p className="text-[12px] text-white/30 font-light mb-4">
                {new Date(consultation.createdAt).toLocaleDateString("ko-KR")}
              </p>
              {consultation.timelinePrediction && (
                <div className="space-y-4">
                  <p className="text-[14px] text-white/70 font-light">
                    {consultation.timelinePrediction.currentAnalysis}
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {consultation.timelinePrediction.predictions.map((pred) => (
                      <div key={pred.week} className="border border-gold/5">
                        {pred.imageUrl && (
                          <div className="relative aspect-square">
                            <Image src={pred.imageUrl} alt={pred.label} fill className="object-cover" />
                          </div>
                        )}
                        <div className="p-4">
                          <h4 className="text-[14px] font-light text-gold mb-2">{pred.label}</h4>
                          <p className="text-[12px] text-white/60 font-light">{pred.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-gold/10 p-16 text-center">
          <p className="font-heading text-[24px] font-light text-white/40 mb-2">
            No Predictions
          </p>
          <p className="text-[13px] text-white/30 font-light">
            아직 타임라인 예측 기록이 없습니다.
          </p>
        </div>
      )}
    </div>
  );
}

// Tab 4: 시술 히스토리
function HistoryTab({ consultations }: { consultations: Consultation[] }) {
  return (
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

              {/* 사진 */}
              {(consultation.photos.front || consultation.photos.back || consultation.photos.side) && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {consultation.photos.front && (
                    <div className="aspect-square relative border border-gold/10">
                      <Image src={consultation.photos.front} alt="앞면" fill className="object-cover" />
                    </div>
                  )}
                  {consultation.photos.back && (
                    <div className="aspect-square relative border border-gold/10">
                      <Image src={consultation.photos.back} alt="뒷면" fill className="object-cover" />
                    </div>
                  )}
                  {consultation.photos.side && (
                    <div className="aspect-square relative border border-gold/10">
                      <Image src={consultation.photos.side} alt="옆면" fill className="object-cover" />
                    </div>
                  )}
                </div>
              )}

              {/* 약제 기록 */}
              {consultation.chemicalRecords.length > 0 && (
                <div className="mb-4">
                  <p className="text-[11px] tracking-[2px] text-white/40 uppercase mb-2 font-bold">
                    약제 배합 기록 ({consultation.chemicalRecords.length}건)
                  </p>
                  <div className="space-y-2">
                    {consultation.chemicalRecords.map((record) => (
                      <div key={record.id} className="border border-gold/5 p-3 text-[12px] text-white/60 font-light">
                        {record.brand} {record.productName} · {record.ratio}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 노트 */}
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
  );
}
