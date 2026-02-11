"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";

const plans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    priceLabel: "0원",
    period: "",
    description: "HairFlow를 체험해보세요",
    features: ["하루 3건 AI 분석", "AI 시술 레시피", "AI 미래 타임라인", "기본 레시피 카드"],
    limitations: ["분석 히스토리 미제공", "약제 브랜드 DB 미제공"],
    highlight: false,
  },
  {
    id: "basic",
    name: "Basic",
    price: 19900,
    priceLabel: "19,900원",
    period: "/월",
    description: "개인 디자이너에게 추천",
    features: ["무제한 AI 분석", "AI 시술 레시피", "AI 미래 타임라인", "분석 히스토리 저장", "우선 처리"],
    limitations: [],
    highlight: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: 39900,
    priceLabel: "39,900원",
    period: "/월",
    description: "매장 전체가 사용할 때",
    features: ["매장 직원 전체 사용", "무제한 AI 분석", "매출 분석 리포트", "약제 브랜드별 DB", "전용 고객 지원"],
    limitations: [],
    highlight: false,
  },
];

export default function PricingPage() {
  const [currentPlan, setCurrentPlan] = useState<string>("free");
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlan = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
        if (profile?.plan) setCurrentPlan(profile.plan);
      }
    };
    fetchPlan();
  }, []);

  const handleSubscribe = async (planId: string) => {
    if (planId === "free" || planId === currentPlan) return;
    setLoading(planId);
    try {
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
      if (!clientKey) {
        alert("결제 시스템 설정이 필요합니다. 관리자에게 문의하세요.");
        setLoading(null);
        return;
      }
      const { loadTossPayments } = await import("@tosspayments/tosspayments-sdk");
      const tossPayments = await loadTossPayments(clientKey);
      const orderId = `hairflow_${planId}_${Date.now()}`;
      const plan = plans.find((p) => p.id === planId);
      const payment = tossPayments.payment({ customerKey: `customer_${Date.now()}` });
      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: plan?.price ?? 0 },
        orderId,
        orderName: `HairFlow ${plan?.name} 월간 구독`,
        successUrl: `${window.location.origin}/pricing/success`,
        failUrl: `${window.location.origin}/pricing?error=payment_failed`,
      });
    } catch (error) {
      if (error instanceof Error && error.message?.includes("취소")) {
        // user cancelled
      } else {
        console.error("Payment error:", error);
        alert("결제 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
    } finally {
      setLoading(null);
    }
  };

  const getButtonText = (planId: string) => {
    if (planId === currentPlan) return "현재 플랜";
    if (planId === "free") return "현재 플랜";
    return `${plans.find((p) => p.id === planId)?.name} 시작하기`;
  };

  const isButtonDisabled = (planId: string) => {
    return planId === "free" || planId === currentPlan || loading !== null;
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span className="section-label">Pricing</span>
          <h1 className="font-heading text-[clamp(28px,4vw,42px)] font-light mt-4 mb-2">
            심플한 <em className="italic text-gold-light">요금제</em>
          </h1>
        </motion.div>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="text-[15px] text-white/50 font-light">
          무료로 시작하고, 비즈니스가 성장하면 업그레이드하세요
        </motion.p>
      </div>

      {/* Plans */}
      <div className="grid sm:grid-cols-3 gap-px max-w-4xl mx-auto">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`p-8 border text-center ${
              plan.highlight
                ? "border-gold bg-gold/5"
                : "border-gold/10"
            }`}
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <h3 className="font-heading text-[24px] font-normal">{plan.name}</h3>
              {plan.highlight && (
                <Badge className="bg-gold/20 text-gold border-gold/30 text-[10px] tracking-[1px]">추천</Badge>
              )}
              {plan.id === currentPlan && plan.id !== "free" && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">사용 중</Badge>
              )}
            </div>
            <p className="text-[13px] text-white/40 font-light mb-4">{plan.description}</p>
            <div className="mb-6">
              <span className="font-heading text-[32px] font-light">{plan.priceLabel}</span>
              <span className="text-[13px] text-white/30 font-light">{plan.period}</span>
            </div>

            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={isButtonDisabled(plan.id)}
              className={`w-full py-3 text-[11px] tracking-[2px] uppercase transition-all duration-500 mb-6 ${
                plan.highlight && plan.id !== currentPlan
                  ? "border border-gold text-gold hover:bg-gold hover:text-charcoal"
                  : isButtonDisabled(plan.id)
                  ? "border border-white/10 text-white/20 cursor-not-allowed"
                  : "border border-gold/30 text-gold/60 hover:bg-gold hover:text-charcoal"
              }`}
            >
              {loading === plan.id ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3 h-3 border border-gold/30 border-t-gold rounded-full animate-spin" />
                  결제 진행 중...
                </span>
              ) : (
                getButtonText(plan.id)
              )}
            </button>

            <div className="space-y-3 text-left">
              {plan.features.map((feature, j) => (
                <div key={j} className="flex items-center gap-3 text-[13px] font-light">
                  <span className="text-gold text-[11px]">&#10003;</span>
                  <span className="text-white/60">{feature}</span>
                </div>
              ))}
              {plan.limitations.map((limitation, j) => (
                <div key={j} className="flex items-center gap-3 text-[13px] font-light">
                  <span className="text-white/15 text-[11px]">&#10005;</span>
                  <span className="text-white/25">{limitation}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Enterprise */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="text-center py-8">
        <div className="border border-gold/10 p-10 max-w-2xl mx-auto">
          <h3 className="font-heading text-[24px] font-light mb-2">Enterprise</h3>
          <p className="text-[13px] text-white/40 font-light mb-6">대형 체인 미용실 전용 서비스</p>
          <button className="px-8 py-3 border border-gold/20 text-gold/60 text-[11px] tracking-[2px] uppercase hover:border-gold hover:text-gold transition-all duration-500">
            문의하기
          </button>
        </div>
      </motion.div>
    </div>
  );
}
