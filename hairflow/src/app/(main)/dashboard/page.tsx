"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";

const quickActions = [
  {
    href: "/recipe",
    title: "AI 시술 레시피",
    desc: "사진 2장으로 맞춤 레시피 생성",
    sub: "GPT-4o Vision",
  },
  {
    href: "/timeline",
    title: "AI 미래 타임라인",
    desc: "시술 후 변화 예측 이미지 생성",
    sub: "DALL-E 3",
  },
];

interface UserData {
  name: string | null;
  plan: string;
  dailyUsage: number;
  lastUsageDate: string | null;
}

interface HistoryItem {
  id: string;
  type: "recipe" | "timeline";
  createdAt: string;
}

export default function DashboardPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, plan, daily_usage, last_usage_date")
        .eq("id", user.id)
        .single();

      if (profile) {
        const today = new Date().toISOString().split("T")[0];
        const isToday = profile.last_usage_date === today;
        setUserData({
          name: profile.name ?? user.user_metadata?.full_name ?? null,
          plan: profile.plan ?? "free",
          dailyUsage: isToday ? (profile.daily_usage ?? 0) : 0,
          lastUsageDate: profile.last_usage_date,
        });
      }

      const [recipesRes, timelinesRes] = await Promise.all([
        supabase.from("recipes").select("id, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("timelines").select("id, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      ]);

      const items: HistoryItem[] = [
        ...(recipesRes.data ?? []).map((r) => ({ id: r.id, type: "recipe" as const, createdAt: r.created_at })),
        ...(timelinesRes.data ?? []).map((t) => ({ id: t.id, type: "timeline" as const, createdAt: t.created_at })),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

      setHistory(items);
    };
    fetchData();
  }, []);

  const planLabel = userData?.plan === "pro" ? "Pro" : userData?.plan === "basic" ? "Basic" : "Free";
  const dailyLimit = userData?.plan === "free" ? 3 : null;
  const usage = userData?.dailyUsage ?? 0;
  const progressPercent = dailyLimit ? Math.min(100, (usage / dailyLimit) * 100) : 0;

  return (
    <div className="space-y-10">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <span className="section-label">Dashboard</span>
        <h1 className="font-heading text-[clamp(28px,4vw,42px)] font-light mt-4 mb-2">
          {userData?.name ? (
            <>{userData.name}님, <em className="italic text-gold-light">안녕하세요</em></>
          ) : (
            <>안녕하세요</>
          )}
        </h1>
        <p className="text-[15px] text-white/50 font-light">AI 헤어 어시스턴트로 오늘도 완벽한 시술을 시작하세요.</p>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        {quickActions.map((action, i) => (
          <motion.div key={action.href} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Link href={action.href}>
              <div className="border border-gold/15 p-8 hover:border-gold/40 hover:bg-gold/5 transition-all duration-500 cursor-pointer group">
                <div className="font-heading text-[14px] text-gold tracking-[2px] mb-4">0{i + 1}</div>
                <h3 className="font-heading text-[24px] font-normal mb-2">{action.title}</h3>
                <p className="text-[14px] text-white/40 font-light mb-4">{action.desc}</p>
                <span className="text-[12px] tracking-[3px] text-gold/60 uppercase group-hover:text-gold transition-colors">
                  {action.sub} →
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Usage Stats */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="text-[12px] tracking-[4px] uppercase text-gold mb-6">오늘의 사용량</h2>
        <div className="border border-gold/15 p-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[13px] text-white/50 font-light">{planLabel} 플랜</span>
                {userData?.plan !== "free" && (
                  <Badge className="bg-gold/20 text-gold border-gold/30 text-[10px] tracking-[1px]">PRO</Badge>
                )}
              </div>
              {dailyLimit ? (
                <span className="font-heading text-[36px] font-light text-white">{usage} / {dailyLimit}<span className="text-[16px] text-white/40 ml-1">건</span></span>
              ) : (
                <span className="font-heading text-[36px] font-light text-gold-light">Unlimited</span>
              )}
            </div>
            {userData?.plan === "free" && (
              <Link href="/pricing"
                className="px-6 py-3 border border-gold/30 text-gold text-[11px] tracking-[2px] uppercase hover:bg-gold hover:text-charcoal transition-all duration-500">
                업그레이드
              </Link>
            )}
          </div>
          {dailyLimit && (
            <div className="mt-6 h-px bg-white/10 relative overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-gold to-gold-light transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </div>
      </motion.div>

      {/* Recent History */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h2 className="text-[12px] tracking-[4px] uppercase text-gold mb-6">최근 분석 히스토리</h2>
        {history.length > 0 ? (
          <div className="space-y-px">
            {history.map((item) => (
              <div key={item.id} className="border border-gold/10 p-5 flex items-center justify-between hover:bg-gold/5 transition-colors">
                <div className="flex items-center gap-4">
                  <span className="font-heading text-[14px] text-gold tracking-[2px]">
                    {item.type === "recipe" ? "01" : "02"}
                  </span>
                  <div>
                    <p className="text-[14px] font-light">
                      {item.type === "recipe" ? "AI 시술 레시피" : "AI 미래 타임라인"}
                    </p>
                    <p className="text-[12px] text-white/30 font-light mt-1">
                      {new Date(item.createdAt).toLocaleDateString("ko-KR", {
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <Badge className={`text-[10px] tracking-[1px] border ${
                  item.type === "recipe"
                    ? "bg-gold/10 text-gold border-gold/20"
                    : "bg-warm-brown/10 text-warm-brown border-warm-brown/20"
                }`}>
                  {item.type === "recipe" ? "Recipe" : "Timeline"}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-gold/10 p-16 text-center">
            <p className="font-heading text-[24px] font-light text-white/40 mb-2">No History</p>
            <p className="text-[13px] text-white/30 font-light mb-8">아직 분석 기록이 없습니다</p>
            <Link href="/recipe"
              className="inline-block px-8 py-3 border border-gold/30 text-gold text-[11px] tracking-[2px] uppercase hover:bg-gold hover:text-charcoal transition-all duration-500">
              첫 레시피 만들기
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
