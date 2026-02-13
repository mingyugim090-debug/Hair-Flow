"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import type { Customer } from "@/types";

interface UserData {
  name: string | null;
  designerName: string | null;
  plan: string;
  dailyUsage: number;
  lastUsageDate: string | null;
}

interface RecentCustomer extends Customer {
  lastAnalysis: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [recentCustomers, setRecentCustomers] = useState<RecentCustomer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: "", phone: "", memo: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, designer_name, plan, daily_usage, last_usage_date")
        .eq("id", user.id)
        .single();

      if (profile) {
        const today = new Date().toISOString().split("T")[0];
        const isToday = profile.last_usage_date === today;
        setUserData({
          name: profile.name ?? user.user_metadata?.full_name ?? null,
          designerName: profile.designer_name ?? null,
          plan: profile.plan ?? "free",
          dailyUsage: isToday ? (profile.daily_usage ?? 0) : 0,
          lastUsageDate: profile.last_usage_date,
        });
      }

      // 최근 분석한 고객 목록 가져오기
      const { data: customers } = await supabase
        .from("customers")
        .select("*")
        .eq("designer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(6);

      if (customers) {
        // 각 고객의 최근 분석 날짜 가져오기
        const customersWithAnalysis = await Promise.all(
          customers.map(async (c) => {
            const { data: timeline } = await supabase
              .from("timelines")
              .select("created_at")
              .eq("customer_id", c.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .single();

            return {
              id: c.id,
              designerId: c.designer_id,
              name: c.name,
              phone: c.phone ?? null,
              memo: c.memo ?? null,
              createdAt: c.created_at,
              lastAnalysis: timeline?.created_at ?? null,
            };
          })
        );

        setRecentCustomers(customersWithAnalysis);
      }
    };
    fetchData();
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/customers?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleNewCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerForm.name.trim()) return;

    setSubmitting(true);
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCustomerForm),
    });
    const result = await res.json();

    if (result.data) {
      router.push(`/customers/${result.data.id}`);
    }
    setSubmitting(false);
  };

  const planLabel = userData?.plan === "enterprise" ? "Enterprise" : userData?.plan === "basic" ? "Basic" : "Free";
  const dailyLimit = userData?.plan === "free" ? 3 : null;
  const usage = userData?.dailyUsage ?? 0;
  const progressPercent = dailyLimit ? Math.min(100, (usage / dailyLimit) * 100) : 0;

  return (
    <div className="space-y-10">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <span className="section-label">Dashboard</span>
        <h1 className="font-heading text-[clamp(28px,4vw,42px)] font-light mt-4 mb-2">
          어떤 고객을 <em className="italic text-gold-light">도와드릴까요?</em>
        </h1>
        <p className="text-[15px] text-white/50 font-light">
          {userData?.designerName ?? userData?.name ?? "디자이너"}님, AI 헤어 어시스턴트로 완벽한 상담을 시작하세요.
        </p>
      </motion.div>

      {/* Quick Actions: Search & Add */}
      <div className="grid sm:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="border border-gold/15 p-8 hover:border-gold/40 hover:bg-gold/5 transition-all duration-500">
            <div className="font-heading text-[14px] text-gold tracking-[2px] mb-4">01</div>
            <h3 className="font-heading text-[24px] font-normal mb-4">고객 검색</h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="고객 이름으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 bg-transparent border border-gold/15 px-4 py-2 text-[13px] font-light text-white placeholder:text-white/30 focus:border-gold/40 focus:outline-none transition-colors"
              />
              <button
                onClick={handleSearch}
                className="px-6 py-2 border border-gold/30 text-gold text-[11px] tracking-[2px] uppercase hover:bg-gold hover:text-charcoal transition-all duration-500"
              >
                검색
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="border border-gold/15 p-8 hover:border-gold/40 hover:bg-gold/5 transition-all duration-500">
            <div className="font-heading text-[14px] text-gold tracking-[2px] mb-4">02</div>
            <h3 className="font-heading text-[24px] font-normal mb-4">신규 고객 등록</h3>
            <button
              onClick={() => setShowNewCustomerForm(!showNewCustomerForm)}
              className="w-full px-6 py-2 border border-gold text-gold text-[11px] tracking-[2px] uppercase hover:bg-gold hover:text-charcoal transition-all duration-500"
            >
              {showNewCustomerForm ? "취소" : "등록하기"}
            </button>
          </div>
        </motion.div>
      </div>

      {/* New Customer Form */}
      {showNewCustomerForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          onSubmit={handleNewCustomerSubmit}
          className="border border-gold/15 p-8 space-y-4"
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] tracking-[2px] text-white/40 uppercase block mb-2">
                이름 *
              </label>
              <input
                type="text"
                required
                value={newCustomerForm.name}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                className="w-full bg-transparent border border-gold/15 px-4 py-3 text-[14px] font-light text-white focus:border-gold/40 focus:outline-none transition-colors"
                placeholder="고객 이름"
              />
            </div>
            <div>
              <label className="text-[11px] tracking-[2px] text-white/40 uppercase block mb-2">
                연락처
              </label>
              <input
                type="tel"
                value={newCustomerForm.phone}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                className="w-full bg-transparent border border-gold/15 px-4 py-3 text-[14px] font-light text-white focus:border-gold/40 focus:outline-none transition-colors"
                placeholder="010-0000-0000"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] tracking-[2px] text-white/40 uppercase block mb-2">
              메모
            </label>
            <textarea
              value={newCustomerForm.memo}
              onChange={(e) => setNewCustomerForm({ ...newCustomerForm, memo: e.target.value })}
              rows={2}
              className="w-full bg-transparent border border-gold/15 px-4 py-3 text-[14px] font-light text-white focus:border-gold/40 focus:outline-none transition-colors resize-none"
              placeholder="두피 민감함, 지난번 탈색 이력 등"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3 border border-gold text-gold text-[11px] tracking-[2px] uppercase hover:bg-gold hover:text-charcoal transition-all duration-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "등록 중..." : "등록하고 분석 시작하기"}
          </button>
        </motion.form>
      )}

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

      {/* Recent Customers */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[12px] tracking-[4px] uppercase text-gold">최근 상담 고객</h2>
          <Link
            href="/customers"
            className="text-[11px] tracking-[2px] text-white/40 hover:text-gold uppercase transition-colors"
          >
            전체 보기 →
          </Link>
        </div>

        {recentCustomers.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentCustomers.map((customer, i) => (
              <motion.div
                key={customer.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                onClick={() => router.push(`/customers/${customer.id}`)}
                className="border border-gold/10 p-6 hover:border-gold/40 hover:bg-gold/5 transition-all duration-500 cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-heading text-[20px] font-normal group-hover:text-gold transition-colors">
                    {customer.name}
                  </h3>
                  <span className="text-[11px] text-gold/40 group-hover:text-gold transition-colors">
                    →
                  </span>
                </div>
                {customer.phone && (
                  <p className="text-[12px] text-white/30 font-light mb-2">
                    {customer.phone}
                  </p>
                )}
                {customer.memo && (
                  <p className="text-[13px] text-white/40 font-light mb-3 truncate">
                    {customer.memo}
                  </p>
                )}
                <div className="pt-3 border-t border-gold/5">
                  {customer.lastAnalysis ? (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-gold/10 text-gold border-gold/20 text-[10px] tracking-[1px]">
                        최근 분석
                      </Badge>
                      <span className="text-[11px] text-white/20 font-light">
                        {new Date(customer.lastAnalysis).toLocaleDateString("ko-KR", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-white/20 font-light">분석 기록 없음</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="border border-gold/10 p-16 text-center">
            <p className="font-heading text-[24px] font-light text-white/40 mb-2">No Customers</p>
            <p className="text-[13px] text-white/30 font-light mb-8">아직 등록된 고객이 없습니다</p>
            <button
              onClick={() => setShowNewCustomerForm(true)}
              className="inline-block px-8 py-3 border border-gold/30 text-gold text-[11px] tracking-[2px] uppercase hover:bg-gold hover:text-charcoal transition-all duration-500"
            >
              첫 고객 등록하기
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
