"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

interface ProfileData {
  id: string;
  shopName: string;
  designerName: string;
  instagramId: string;
  specialties: string[];
  bio: string;
  email: string;
  plan: string;
  createdAt: string;
}

const SPECIALTY_OPTIONS = [
  "커트", "염색", "탈색", "펌", "매직",
  "클리닉", "두피케어", "업스타일", "남성컷", "키즈컷",
];

export default function SettingsPage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await fetch("/api/profile");
      const result = await res.json();
      if (result.data) {
        setData({
          id: result.data.id,
          shopName: result.data.shopName ?? "",
          designerName: result.data.designerName ?? "",
          instagramId: result.data.instagramId ?? "",
          specialties: result.data.specialties ?? [],
          bio: result.data.bio ?? "",
          email: result.data.email,
          plan: result.data.plan,
          createdAt: result.data.createdAt,
        });
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const toggleSpecialty = (s: string) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = prev.specialties.includes(s)
        ? prev.specialties.filter((x) => x !== s)
        : [...prev.specialties, s];
      return { ...prev, specialties: next };
    });
  };

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    setSaved(false);

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shopName: data.shopName,
        designerName: data.designerName,
        instagramId: data.instagramId,
        specialties: data.specialties,
        bio: data.bio,
      }),
    });

    const result = await res.json();
    if (result.data) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      alert(result.error?.message ?? "저장에 실패했습니다.");
    }
    setSaving(false);
  };

  const handleCopyPortfolioUrl = async () => {
    if (!data) return;
    const url = `${window.location.origin}/portfolio/${data.id}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const planLabel =
    data?.plan === "pro" ? "Pro" : data?.plan === "basic" ? "Basic" : "Free";

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-8 h-8 border border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <span className="section-label">Settings</span>
        <h1 className="font-heading text-[clamp(28px,4vw,42px)] font-light mt-4 mb-2">
          프로필 <em className="italic text-gold-light">설정</em>
        </h1>
        <p className="text-[15px] text-white/50 font-light">
          디자이너 프로필을 관리하고 포트폴리오를 공유하세요
        </p>
      </motion.div>

      {/* Portfolio Share */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="border border-gold/20 bg-gold/5 p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[14px] text-white font-light mb-1">
              내 디지털 포트폴리오
            </h2>
            <p className="text-[12px] text-white/40 font-light">
              링크를 복사해서 인스타그램 프로필, 스토리, 명함 등에 활용하세요
            </p>
          </div>
          <Link
            href={`/portfolio/${data?.id}`}
            target="_blank"
            className="text-[11px] tracking-[1px] text-gold hover:underline whitespace-nowrap mt-1"
          >
            미리보기
          </Link>
        </div>
        <button
          onClick={handleCopyPortfolioUrl}
          className="mt-4 w-full py-3 border border-gold text-gold text-[12px] tracking-[3px] uppercase hover:bg-gold hover:text-charcoal transition-all duration-500"
        >
          {copied ? "복사 완료!" : "포트폴리오 URL 복사하기"}
        </button>
      </motion.div>

      {/* Profile Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-6"
      >
        {/* Shop Name */}
        <div>
          <label className="text-[11px] tracking-[3px] text-gold uppercase block mb-3">
            매장명
          </label>
          <input
            type="text"
            value={data?.shopName ?? ""}
            onChange={(e) =>
              setData((prev) => prev ? { ...prev, shopName: e.target.value } : prev)
            }
            placeholder="예: 헤어플로우 강남점"
            className="w-full bg-transparent border border-gold/20 px-5 py-4 text-[15px] font-light text-white placeholder:text-white/20 focus:border-gold/50 focus:outline-none transition-colors"
          />
        </div>

        {/* Designer Name */}
        <div>
          <label className="text-[11px] tracking-[3px] text-gold uppercase block mb-3">
            디자이너명
          </label>
          <input
            type="text"
            value={data?.designerName ?? ""}
            onChange={(e) =>
              setData((prev) => prev ? { ...prev, designerName: e.target.value } : prev)
            }
            placeholder="예: 김헤어"
            className="w-full bg-transparent border border-gold/20 px-5 py-4 text-[15px] font-light text-white placeholder:text-white/20 focus:border-gold/50 focus:outline-none transition-colors"
          />
        </div>

        {/* Instagram */}
        <div>
          <label className="text-[11px] tracking-[3px] text-gold uppercase block mb-3">
            인스타그램 아이디
          </label>
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 text-[15px]">@</span>
            <input
              type="text"
              value={data?.instagramId ?? ""}
              onChange={(e) =>
                setData((prev) => prev ? { ...prev, instagramId: e.target.value.replace(/^@/, "") } : prev)
              }
              placeholder="instagram_id"
              className="w-full bg-transparent border border-gold/20 pl-10 pr-5 py-4 text-[15px] font-light text-white placeholder:text-white/20 focus:border-gold/50 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Specialties */}
        <div>
          <label className="text-[11px] tracking-[3px] text-gold uppercase block mb-3">
            전문 분야
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {SPECIALTY_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => toggleSpecialty(s)}
                className={`py-2.5 px-2 border text-[12px] tracking-[0.5px] font-light transition-all duration-300 ${
                  data?.specialties.includes(s)
                    ? "border-gold bg-gold/10 text-gold"
                    : "border-white/10 text-white/40 hover:border-gold/30"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="text-[11px] tracking-[3px] text-gold uppercase block mb-3">
            한 줄 소개
          </label>
          <textarea
            value={data?.bio ?? ""}
            onChange={(e) =>
              setData((prev) => prev ? { ...prev, bio: e.target.value } : prev)
            }
            placeholder="예: 10년 경력 컬러 전문 디자이너"
            rows={2}
            maxLength={100}
            className="w-full bg-transparent border border-gold/20 px-5 py-4 text-[15px] font-light text-white placeholder:text-white/20 focus:border-gold/50 focus:outline-none transition-colors resize-none"
          />
          <p className="text-[11px] text-white/20 mt-1 text-right font-light">
            {(data?.bio ?? "").length}/100
          </p>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full px-8 py-4 border border-gold text-gold text-[12px] tracking-[3px] uppercase hover:bg-gold hover:text-charcoal transition-all duration-500 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? "저장 중..." : saved ? "저장 완료" : "저장하기"}
        </button>
      </motion.div>

      {/* Account Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-[11px] tracking-[3px] text-gold uppercase mb-4">
          계정 정보
        </h2>
        <div className="border border-gold/10 divide-y divide-gold/10">
          <div className="px-5 py-4 flex items-center justify-between">
            <span className="text-[13px] text-white/40 font-light">이메일</span>
            <span className="text-[13px] text-white/70 font-light">
              {data?.email}
            </span>
          </div>
          <div className="px-5 py-4 flex items-center justify-between">
            <span className="text-[13px] text-white/40 font-light">현재 플랜</span>
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-white/70 font-light">
                {planLabel}
              </span>
              {data?.plan === "free" && (
                <Link
                  href="/pricing"
                  className="text-[11px] tracking-[1px] text-gold hover:underline"
                >
                  업그레이드
                </Link>
              )}
            </div>
          </div>
          <div className="px-5 py-4 flex items-center justify-between">
            <span className="text-[13px] text-white/40 font-light">가입일</span>
            <span className="text-[13px] text-white/70 font-light">
              {data?.createdAt
                ? new Date(data.createdAt).toLocaleDateString("ko-KR")
                : "-"}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Logout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <button
          onClick={handleLogout}
          className="w-full px-8 py-4 border border-white/10 text-white/40 text-[12px] tracking-[3px] uppercase hover:border-red-400/30 hover:text-red-400 transition-all duration-500"
        >
          로그아웃
        </button>
      </motion.div>
    </div>
  );
}
