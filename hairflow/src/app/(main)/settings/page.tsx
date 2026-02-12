"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

interface ProfileData {
  shopName: string;
  designerName: string;
  email: string;
  plan: string;
  createdAt: string;
}

export default function SettingsPage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await fetch("/api/profile");
      const result = await res.json();
      if (result.data) {
        setData({
          shopName: result.data.shopName ?? "",
          designerName: result.data.designerName ?? "",
          email: result.data.email,
          plan: result.data.plan,
          createdAt: result.data.createdAt,
        });
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

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
          매장 정보와 디자이너 이름을 설정하세요
        </p>
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
