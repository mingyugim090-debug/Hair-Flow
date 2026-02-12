"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

interface PortfolioWork {
  url: string;
  caption: string;
  createdAt: string;
}

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
  avatarUrl: string | null;
  portfolioWorks: PortfolioWork[];
}

const SPECIALTY_OPTIONS = [
  "커트", "염색", "탈색", "펌", "매직",
  "클리닉", "두피케어", "업스타일", "남성컷", "키즈컷",
];

export default function ProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [workUploading, setWorkUploading] = useState(false);
  const [workCaption, setWorkCaption] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const workInputRef = useRef<HTMLInputElement>(null);
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
          avatarUrl: result.data.avatarUrl ?? null,
          portfolioWorks: result.data.portfolioWorks ?? [],
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
      setEditMode(false);
      setTimeout(() => setSaved(false), 2000);
    } else {
      alert(result.error?.message ?? "저장에 실패했습니다.");
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !data) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("5MB 이하의 이미지만 업로드 가능합니다.");
      return;
    }

    setAvatarUploading(true);
    const supabase = createClient();
    const path = `designers/${data.id}/avatar.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("hairflow")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      console.error("Avatar upload error:", uploadError);
      alert(`업로드에 실패했습니다: ${uploadError.message}`);
      setAvatarUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("hairflow")
      .getPublicUrl(path);

    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", data.id);

    setData((prev) => prev ? { ...prev, avatarUrl } : prev);
    setAvatarUploading(false);
  };

  const handleWorkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !data) return;

    if (data.portfolioWorks.length >= 10) {
      alert("최대 10장까지 업로드 가능합니다.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("10MB 이하의 이미지만 업로드 가능합니다.");
      return;
    }

    setWorkUploading(true);
    const supabase = createClient();
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
    const path = `designers/${data.id}/works/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("hairflow")
      .upload(path, file, { contentType: file.type });

    if (uploadError) {
      console.error("Work upload error:", uploadError);
      alert(`업로드에 실패했습니다: ${uploadError.message}`);
      setWorkUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("hairflow")
      .getPublicUrl(path);

    const newWork: PortfolioWork = {
      url: urlData.publicUrl,
      caption: workCaption || "",
      createdAt: new Date().toISOString(),
    };

    const updatedWorks = [...data.portfolioWorks, newWork];

    await supabase
      .from("profiles")
      .update({ portfolio_works: updatedWorks })
      .eq("id", data.id);

    setData((prev) => prev ? { ...prev, portfolioWorks: updatedWorks } : prev);
    setWorkCaption("");
    setWorkUploading(false);
    if (workInputRef.current) workInputRef.current.value = "";
  };

  const handleDeleteWork = async (index: number) => {
    if (!data) return;
    const updated = data.portfolioWorks.filter((_, i) => i !== index);
    const supabase = createClient();

    await supabase
      .from("profiles")
      .update({ portfolio_works: updated })
      .eq("id", data.id);

    setData((prev) => prev ? { ...prev, portfolioWorks: updated } : prev);
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
    <div className="space-y-10 max-w-2xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <span className="section-label">Profile</span>
        <h1 className="font-heading text-[clamp(28px,4vw,42px)] font-light mt-4 mb-2">
          내 프로필 <em className="italic text-gold-light">관리</em>
        </h1>
        <p className="text-[15px] text-white/50 font-light">
          전문가 프로필을 관리하고 포트폴리오를 공유하세요
        </p>
      </motion.div>

      {/* ── Profile Preview Card with Avatar Upload ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="border border-gold/20 bg-gradient-to-br from-gold/[0.06] to-transparent overflow-hidden"
      >
        <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

        <div className="p-8">
          {/* Avatar + Name */}
          <div className="flex items-start gap-5 mb-6">
            <div className="relative group">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              {data?.avatarUrl ? (
                <Image
                  src={data.avatarUrl}
                  alt="프로필"
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-full object-cover border-2 border-gold/20"
                  unoptimized
                />
              ) : (
                <div className="w-20 h-20 rounded-full border border-gold/20 flex items-center justify-center bg-gold/5">
                  <span className="text-gold text-[28px] font-heading font-light">
                    {(data?.designerName || "D")[0]}
                  </span>
                </div>
              )}
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                {avatarUploading ? (
                  <div className="w-5 h-5 border border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                )}
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-heading text-[22px] font-light text-white truncate">
                {data?.designerName || "디자이너명 미설정"}
              </h2>
              <p className="text-[13px] text-gold/70 tracking-[1px] truncate">
                {data?.shopName || "매장명 미설정"}
              </p>
              <p className="text-[11px] text-white/25 font-light mt-1">
                사진을 클릭하여 프로필 사진 변경
              </p>
            </div>
          </div>

          {/* Bio */}
          {data?.bio ? (
            <p className="text-[13px] text-white/50 font-light leading-relaxed mb-5 border-l-2 border-gold/20 pl-4">
              {data.bio}
            </p>
          ) : (
            <p className="text-[13px] text-white/20 font-light mb-5 border-l-2 border-white/5 pl-4 italic">
              한 줄 소개를 입력하세요
            </p>
          )}

          {/* Specialties */}
          {data && data.specialties.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-5">
              {data.specialties.map((s) => (
                <span
                  key={s}
                  className="px-3 py-1 border border-gold/15 text-gold/60 text-[11px] tracking-[0.5px]"
                >
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <div className="flex gap-2 mb-5">
              <span className="px-3 py-1 border border-white/5 text-white/15 text-[11px] tracking-[0.5px] italic">
                전문분야 미설정
              </span>
            </div>
          )}

          {/* Instagram */}
          {data?.instagramId ? (
            <a
              href={`https://instagram.com/${data.instagramId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[12px] text-white/40 hover:text-gold transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
              @{data.instagramId}
            </a>
          ) : (
            <span className="text-[12px] text-white/15 italic">인스타그램 미연결</span>
          )}
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      </motion.div>

      {/* ── Portfolio Works Upload ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-[11px] tracking-[3px] text-gold uppercase">대표 시술 작품</h2>
            <p className="text-[12px] text-white/30 font-light mt-1">
              포트폴리오에 전시할 작품 ({data?.portfolioWorks.length ?? 0}/10)
            </p>
          </div>
          {data && data.portfolioWorks.length < 10 && (
            <button
              onClick={() => workInputRef.current?.click()}
              disabled={workUploading}
              className="text-[11px] tracking-[1px] text-gold/60 hover:text-gold border border-gold/20 px-4 py-2 hover:border-gold/40 transition-all"
            >
              {workUploading ? "업로드 중..." : "+ 작품 추가"}
            </button>
          )}
        </div>

        <input
          ref={workInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleWorkUpload}
        />

        {data && data.portfolioWorks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <AnimatePresence>
              {data.portfolioWorks.map((work, i) => (
                <motion.div
                  key={work.url}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative group aspect-[3/4] border border-gold/10 overflow-hidden bg-charcoal"
                >
                  <Image
                    src={work.url}
                    alt={work.caption || `작품 ${i + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      {work.caption && (
                        <p className="text-[11px] text-white/80 font-light mb-2 line-clamp-2">{work.caption}</p>
                      )}
                      <button
                        onClick={() => handleDeleteWork(i)}
                        className="text-[10px] text-red-400/70 hover:text-red-400 tracking-[1px] uppercase transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 bg-black/50 px-2 py-0.5 text-[9px] text-gold/60 tracking-[1px]">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="border border-dashed border-gold/15 p-12 text-center">
            <div className="text-gold/20 mb-3">
              <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
            </div>
            <p className="text-[13px] text-white/25 font-light mb-1">아직 작품이 없습니다</p>
            <p className="text-[11px] text-white/15 font-light">
              시술 작품을 추가하여 포트폴리오를 완성하세요
            </p>
          </div>
        )}

        {/* Work Caption Input (shown when upload button clicked, optional) */}
        <div className="mt-3">
          <input
            type="text"
            value={workCaption}
            onChange={(e) => setWorkCaption(e.target.value)}
            placeholder="다음 업로드할 작품의 설명 (선택)"
            className="w-full bg-transparent border border-gold/10 px-4 py-3 text-[13px] font-light text-white placeholder:text-white/15 focus:border-gold/30 focus:outline-none transition-colors"
          />
        </div>
      </motion.div>

      {/* ── Portfolio Share ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
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

      {/* ── Profile Edit Section ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[11px] tracking-[3px] text-gold uppercase">
            프로필 정보 수정
          </h2>
          {!editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="text-[11px] tracking-[1px] text-gold/60 hover:text-gold border border-gold/20 px-4 py-2 hover:border-gold/40 transition-all"
            >
              수정하기
            </button>
          )}
        </div>

        {editMode ? (
          <div className="space-y-6">
            <div>
              <label className="text-[11px] tracking-[3px] text-white/40 uppercase block mb-3">매장명</label>
              <input
                type="text"
                value={data?.shopName ?? ""}
                onChange={(e) => setData((prev) => prev ? { ...prev, shopName: e.target.value } : prev)}
                placeholder="예: 헤어플로우 강남점"
                className="w-full bg-transparent border border-gold/20 px-5 py-4 text-[15px] font-light text-white placeholder:text-white/20 focus:border-gold/50 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] tracking-[3px] text-white/40 uppercase block mb-3">디자이너명</label>
              <input
                type="text"
                value={data?.designerName ?? ""}
                onChange={(e) => setData((prev) => prev ? { ...prev, designerName: e.target.value } : prev)}
                placeholder="예: 김헤어"
                className="w-full bg-transparent border border-gold/20 px-5 py-4 text-[15px] font-light text-white placeholder:text-white/20 focus:border-gold/50 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] tracking-[3px] text-white/40 uppercase block mb-3">인스타그램 아이디</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 text-[15px]">@</span>
                <input
                  type="text"
                  value={data?.instagramId ?? ""}
                  onChange={(e) => setData((prev) => prev ? { ...prev, instagramId: e.target.value.replace(/^@/, "") } : prev)}
                  placeholder="instagram_id"
                  className="w-full bg-transparent border border-gold/20 pl-10 pr-5 py-4 text-[15px] font-light text-white placeholder:text-white/20 focus:border-gold/50 focus:outline-none transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] tracking-[3px] text-white/40 uppercase block mb-3">전문 분야</label>
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
            <div>
              <label className="text-[11px] tracking-[3px] text-white/40 uppercase block mb-3">한 줄 소개</label>
              <textarea
                value={data?.bio ?? ""}
                onChange={(e) => setData((prev) => prev ? { ...prev, bio: e.target.value } : prev)}
                placeholder="예: 10년 경력 컬러 전문 디자이너"
                rows={2}
                maxLength={100}
                className="w-full bg-transparent border border-gold/20 px-5 py-4 text-[15px] font-light text-white placeholder:text-white/20 focus:border-gold/50 focus:outline-none transition-colors resize-none"
              />
              <p className="text-[11px] text-white/20 mt-1 text-right font-light">
                {(data?.bio ?? "").length}/100
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setEditMode(false)}
                className="flex-1 px-8 py-4 border border-white/10 text-white/40 text-[12px] tracking-[3px] uppercase hover:border-white/20 transition-all duration-300"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-8 py-4 border border-gold text-gold text-[12px] tracking-[3px] uppercase hover:bg-gold hover:text-charcoal transition-all duration-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? "저장 중..." : saved ? "저장 완료" : "저장하기"}
              </button>
            </div>
          </div>
        ) : (
          <div className="border border-gold/10 divide-y divide-gold/10">
            <div className="px-5 py-4 flex items-center justify-between">
              <span className="text-[13px] text-white/40 font-light">매장명</span>
              <span className="text-[13px] text-white/70 font-light">
                {data?.shopName || <span className="text-white/20 italic">미설정</span>}
              </span>
            </div>
            <div className="px-5 py-4 flex items-center justify-between">
              <span className="text-[13px] text-white/40 font-light">디자이너명</span>
              <span className="text-[13px] text-white/70 font-light">
                {data?.designerName || <span className="text-white/20 italic">미설정</span>}
              </span>
            </div>
            <div className="px-5 py-4 flex items-center justify-between">
              <span className="text-[13px] text-white/40 font-light">인스타그램</span>
              <span className="text-[13px] text-white/70 font-light">
                {data?.instagramId ? `@${data.instagramId}` : <span className="text-white/20 italic">미연결</span>}
              </span>
            </div>
            <div className="px-5 py-4">
              <span className="text-[13px] text-white/40 font-light block mb-2">전문 분야</span>
              {data && data.specialties.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {data.specialties.map((s) => (
                    <span key={s} className="px-2.5 py-1 bg-gold/5 text-gold/60 text-[11px] tracking-[0.5px]">{s}</span>
                  ))}
                </div>
              ) : (
                <span className="text-[13px] text-white/20 italic">미설정</span>
              )}
            </div>
            <div className="px-5 py-4 flex items-start justify-between">
              <span className="text-[13px] text-white/40 font-light">한 줄 소개</span>
              <span className="text-[13px] text-white/70 font-light text-right max-w-[60%]">
                {data?.bio || <span className="text-white/20 italic">미설정</span>}
              </span>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Account Info ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-[11px] tracking-[3px] text-gold uppercase mb-4">계정 정보</h2>
        <div className="border border-gold/10 divide-y divide-gold/10">
          <div className="px-5 py-4 flex items-center justify-between">
            <span className="text-[13px] text-white/40 font-light">이메일</span>
            <span className="text-[13px] text-white/70 font-light">{data?.email}</span>
          </div>
          <div className="px-5 py-4 flex items-center justify-between">
            <span className="text-[13px] text-white/40 font-light">현재 플랜</span>
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-white/70 font-light">{planLabel}</span>
              {data?.plan === "free" && (
                <Link href="/pricing" className="text-[11px] tracking-[1px] text-gold hover:underline">업그레이드</Link>
              )}
            </div>
          </div>
          <div className="px-5 py-4 flex items-center justify-between">
            <span className="text-[13px] text-white/40 font-light">가입일</span>
            <span className="text-[13px] text-white/70 font-light">
              {data?.createdAt ? new Date(data.createdAt).toLocaleDateString("ko-KR") : "-"}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── Logout ── */}
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
