"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface PortfolioWork {
  url: string;
  caption: string;
  createdAt: string;
}

interface DesignerProfile {
  id: string;
  name: string | null;
  designerName: string | null;
  shopName: string | null;
  instagramId: string | null;
  specialties: string[];
  bio: string | null;
  avatarUrl: string | null;
  portfolioWorks: PortfolioWork[];
}

interface TimelineItem {
  id: string;
  treatmentType: string;
  resultImages: Record<string, unknown>;
  revisitRecommendation: string | null;
  createdAt: string;
}

interface PortfolioData {
  designer: DesignerProfile;
  timelines: TimelineItem[];
}

const treatmentLabel: Record<string, string> = {
  color: "염색",
  cut: "커트",
  perm: "펌",
};

export default function PortfolioClient({ designerId }: { designerId: string }) {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedWork, setSelectedWork] = useState<PortfolioWork | null>(null);

  useEffect(() => {
    const fetchPortfolio = async () => {
      const res = await fetch(`/api/portfolio/${designerId}`);
      const result = await res.json();
      if (result.data) {
        setData(result.data);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    };
    fetchPortfolio();
  }, [designerId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center">
        <div className="w-8 h-8 border border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen bg-charcoal flex flex-col items-center justify-center text-center px-6">
        <h1 className="font-heading text-[28px] font-light text-white mb-4">
          포트폴리오를 찾을 수 없습니다
        </h1>
        <p className="text-[14px] text-white/40 font-light mb-8">
          디자이너가 아직 포트폴리오를 설정하지 않았어요
        </p>
        <Link
          href="/"
          className="px-8 py-3 border border-gold text-gold text-[12px] tracking-[3px] uppercase hover:bg-gold hover:text-charcoal transition-all duration-500"
        >
          HairFlow 홈
        </Link>
      </div>
    );
  }

  const { designer, timelines } = data;
  const works = designer.portfolioWorks ?? [];

  return (
    <div className="min-h-screen bg-charcoal">
      {/* ═══ AI Tech Intro Section ═══ */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/[0.03] via-transparent to-transparent" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-1/4 w-64 h-64 bg-gold/[0.02] rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-48 h-48 bg-gold/[0.03] rounded-full blur-3xl" />
        </div>

        <div className="relative px-6 pt-10 pb-8 max-w-2xl mx-auto">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <Link href="/" className="inline-flex items-center gap-2">
              <Image src="/logo.png" alt="HairFlow" width={28} height={28} className="object-contain" />
              <span className="font-heading text-[14px] font-light tracking-[3px] text-white/40">
                HAIRFLOW
              </span>
            </Link>
          </motion.div>

          {/* AI Intro Banner */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="border border-gold/15 bg-gradient-to-br from-gold/[0.04] to-transparent p-8 mb-10"
          >
            <div className="text-center mb-8">
              <p className="text-[10px] tracking-[5px] text-gold/50 uppercase mb-4">
                AI-Powered Hair Design
              </p>
              <h2 className="font-heading text-[clamp(20px,4vw,28px)] font-light text-white leading-snug">
                AI가 설계하고,<br />
                <em className="italic text-gold-light">디자이너가 완성</em>합니다
              </h2>
            </div>

            {/* 3-Step Process Visualization */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { step: "01", label: "레퍼런스 분석", desc: "고객 원하는 스타일", icon: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" },
                { step: "02", label: "AI 레시피 생성", desc: "GPT-4o Vision 분석", icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" },
                { step: "03", label: "시술 완성", desc: "전문가 핸드 터치", icon: "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="text-center"
                >
                  <div className="w-12 h-12 mx-auto mb-3 border border-gold/20 rounded-full flex items-center justify-center bg-gold/5">
                    <svg className="w-5 h-5 text-gold/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                    </svg>
                  </div>
                  <p className="text-[10px] tracking-[2px] text-gold/40 mb-1">{item.step}</p>
                  <p className="text-[12px] text-white/70 font-light">{item.label}</p>
                  <p className="text-[10px] text-white/30 font-light mt-0.5">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Connection arrows */}
            <div className="flex justify-center items-center gap-2 mt-4 mb-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 + i * 0.05 }}
                  className={`h-px ${i % 2 === 0 ? "w-8 bg-gold/20" : "w-1.5 h-1.5 rounded-full bg-gold/30"}`}
                />
              ))}
            </div>
          </motion.div>

          {/* ─── Designer Profile ─── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            {/* Avatar */}
            <div className="mb-6">
              {designer.avatarUrl ? (
                <Image
                  src={designer.avatarUrl}
                  alt={designer.designerName ?? "디자이너"}
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-full object-cover mx-auto border-2 border-gold/20"
                  unoptimized
                />
              ) : (
                <div className="w-24 h-24 rounded-full mx-auto border border-gold/20 flex items-center justify-center bg-gold/5">
                  <span className="text-gold text-[32px] font-heading font-light">
                    {(designer.designerName ?? "D")[0]}
                  </span>
                </div>
              )}
            </div>

            <h1 className="font-heading text-[32px] font-light text-white mb-1">
              {designer.designerName ?? designer.name ?? "디자이너"}
            </h1>
            <p className="text-[13px] text-gold tracking-[2px] uppercase mb-4">
              {designer.shopName}
            </p>
            {designer.bio && (
              <p className="text-[14px] text-white/50 font-light leading-relaxed max-w-sm mx-auto mb-6">
                {designer.bio}
              </p>
            )}

            {/* Specialties */}
            {designer.specialties.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {designer.specialties.map((s) => (
                  <span
                    key={s}
                    className="px-4 py-1.5 border border-gold/20 text-gold/70 text-[11px] tracking-[1px]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}

            {/* Instagram */}
            {designer.instagramId && (
              <a
                href={`https://instagram.com/${designer.instagramId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 border border-gold/20 text-[12px] tracking-[2px] text-white/50 hover:text-gold hover:border-gold/40 transition-all duration-300"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
                @{designer.instagramId}
              </a>
            )}
          </motion.div>
        </div>
      </div>

      {/* ═══ Portfolio Gallery ═══ */}
      {works.length > 0 && (
        <div className="px-6 py-12 max-w-2xl mx-auto">
          <div className="h-px bg-gold/10 mb-12" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center mb-8"
          >
            <p className="text-[10px] tracking-[5px] text-gold/40 uppercase mb-3">Gallery</p>
            <h2 className="font-heading text-[24px] font-light text-white">
              대표 <em className="italic text-gold-light">작품</em>
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {works.map((work, i) => (
              <motion.div
                key={work.url}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + i * 0.05 }}
                className="relative aspect-[3/4] overflow-hidden cursor-pointer group"
                onClick={() => setSelectedWork(work)}
              >
                <Image
                  src={work.url}
                  alt={work.caption || `작품 ${i + 1}`}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    {work.caption && (
                      <p className="text-[12px] text-white/90 font-light">{work.caption}</p>
                    )}
                  </div>
                </div>
                <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm px-2 py-0.5">
                  <span className="text-[9px] text-gold/70 tracking-[2px] font-heading">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ AI Timeline Predictions ═══ */}
      {timelines.length > 0 && (
        <div className="px-6 py-12 max-w-2xl mx-auto">
          <div className="h-px bg-gold/10 mb-12" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-center mb-8"
          >
            <p className="text-[10px] tracking-[5px] text-gold/40 uppercase mb-3">AI Timeline</p>
            <h2 className="font-heading text-[24px] font-light text-white">
              AI 미래 <em className="italic text-gold-light">예측</em>
            </h2>
            <p className="text-[13px] text-white/30 font-light mt-2">
              시술 후 시간 경과에 따른 변화를 AI가 분석합니다
            </p>
          </motion.div>

          {/* Timeline Visual */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-gold/30 via-gold/10 to-transparent" />

            <div className="space-y-0">
              {timelines.map((timeline, i) => (
                <motion.div
                  key={timeline.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  className="relative pl-16 pb-8"
                >
                  {/* Timeline dot */}
                  <div className="absolute left-[18px] top-1 w-3 h-3 border border-gold/40 rounded-full bg-charcoal">
                    <div className="absolute inset-1 bg-gold/30 rounded-full" />
                  </div>

                  <div className="border border-gold/10 p-5 hover:border-gold/25 transition-all duration-300 bg-gradient-to-r from-gold/[0.02] to-transparent">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] tracking-[2px] text-gold/70 uppercase px-2 py-0.5 border border-gold/15 bg-gold/5">
                          {treatmentLabel[timeline.treatmentType] ?? timeline.treatmentType}
                        </span>
                        <span className="text-[10px] tracking-[1px] text-white/20">
                          AI Analysis
                        </span>
                      </div>
                      <span className="text-[11px] text-white/25 font-light">
                        {new Date(timeline.createdAt).toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    {timeline.revisitRecommendation && (
                      <p className="text-[13px] text-white/50 font-light leading-relaxed">
                        {timeline.revisitRecommendation}
                      </p>
                    )}

                    {/* Mini prediction bar */}
                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-[9px] text-white/20 tracking-[1px]">변화 예측</span>
                      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, 30 + i * 20)}%` }}
                          transition={{ delay: 1 + i * 0.1, duration: 0.8 }}
                          className="h-full bg-gradient-to-r from-gold/40 to-gold/20 rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ CTA Section ═══ */}
      <div className="px-6 py-12 max-w-2xl mx-auto">
        <div className="h-px bg-gold/10 mb-12" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="text-center"
        >
          <p className="text-[13px] text-white/30 font-light mb-6">
            AI 기반 헤어 컨설팅이 궁금하신가요?
          </p>
          <Link
            href="/"
            className="inline-block px-10 py-4 border border-gold text-gold text-[11px] tracking-[3px] uppercase hover:bg-gold hover:text-charcoal transition-all duration-500"
          >
            HairFlow 시작하기
          </Link>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-12 max-w-2xl mx-auto text-center">
        <div className="h-px bg-gold/10 mb-8" />
        <p className="text-[11px] text-white/20 font-light tracking-[2px]">
          Powered by HAIRFLOW
        </p>
      </div>

      {/* ═══ Lightbox Modal ═══ */}
      <AnimatePresence>
        {selectedWork && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6"
            onClick={() => setSelectedWork(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-lg w-full max-h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-[3/4] w-full">
                <Image
                  src={selectedWork.url}
                  alt={selectedWork.caption || "작품"}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              {selectedWork.caption && (
                <div className="mt-4 text-center">
                  <p className="text-[14px] text-white/70 font-light">{selectedWork.caption}</p>
                </div>
              )}
              <button
                onClick={() => setSelectedWork(null)}
                className="absolute -top-12 right-0 text-white/40 hover:text-white text-[12px] tracking-[2px] uppercase transition-colors"
              >
                닫기
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
