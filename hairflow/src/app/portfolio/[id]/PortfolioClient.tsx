"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

interface DesignerProfile {
  id: string;
  name: string | null;
  designerName: string | null;
  shopName: string | null;
  instagramId: string | null;
  specialties: string[];
  bio: string | null;
  avatarUrl: string | null;
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

  return (
    <div className="min-h-screen bg-charcoal">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/5 to-transparent" />
        <div className="relative px-6 pt-12 pb-10 max-w-lg mx-auto text-center">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link href="/" className="inline-flex items-center gap-2 mb-8">
              <Image src="/logo.png" alt="HairFlow" width={28} height={28} className="object-contain" />
              <span className="font-heading text-[14px] font-light tracking-[3px] text-white/40">
                HAIRFLOW
              </span>
            </Link>
          </motion.div>

          {/* Avatar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            {designer.avatarUrl ? (
              <Image
                src={designer.avatarUrl}
                alt={designer.designerName ?? "디자이너"}
                width={96}
                height={96}
                className="w-24 h-24 rounded-full object-cover mx-auto border-2 border-gold/20"
              />
            ) : (
              <div className="w-24 h-24 rounded-full mx-auto border border-gold/20 flex items-center justify-center bg-gold/5">
                <span className="text-gold text-[32px] font-heading font-light">
                  {(designer.designerName ?? "D")[0]}
                </span>
              </div>
            )}
          </motion.div>

          {/* Name & Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
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
          </motion.div>

          {/* Specialties */}
          {designer.specialties.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap justify-center gap-2 mb-6"
            >
              {designer.specialties.map((s) => (
                <span
                  key={s}
                  className="px-4 py-1.5 border border-gold/20 text-gold/70 text-[11px] tracking-[1px]"
                >
                  {s}
                </span>
              ))}
            </motion.div>
          )}

          {/* Instagram */}
          {designer.instagramId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
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
            </motion.div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="max-w-lg mx-auto px-6">
        <div className="h-px bg-gold/10" />
      </div>

      {/* Portfolio Works */}
      <div className="px-6 py-10 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <span className="section-label">Portfolio</span>
          <h2 className="font-heading text-[24px] font-light text-white mt-3 mb-6">
            시술 <em className="italic text-gold-light">사례</em>
          </h2>
        </motion.div>

        {timelines.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center py-16 border border-gold/10"
          >
            <p className="text-[14px] text-white/30 font-light">
              아직 공개된 시술 사례가 없습니다
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {timelines.map((timeline, i) => (
              <motion.div
                key={timeline.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="border border-gold/10 p-5 hover:border-gold/20 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] tracking-[2px] text-gold uppercase">
                    {treatmentLabel[timeline.treatmentType] ?? timeline.treatmentType}
                  </span>
                  <span className="text-[11px] text-white/30 font-light">
                    {new Date(timeline.createdAt).toLocaleDateString("ko-KR")}
                  </span>
                </div>
                {timeline.revisitRecommendation && (
                  <p className="text-[13px] text-white/50 font-light">
                    {timeline.revisitRecommendation}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 pb-12 max-w-lg mx-auto text-center">
        <div className="h-px bg-gold/10 mb-8" />
        <p className="text-[11px] text-white/20 font-light tracking-[2px]">
          Powered by HAIRFLOW
        </p>
      </div>
    </div>
  );
}
