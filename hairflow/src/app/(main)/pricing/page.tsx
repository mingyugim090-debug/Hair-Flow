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
    description: "HairFlow의 핵심 기능을 가볍게 체험해보세요.",
    features: [
      "하루 3회 이용 가능",
      "AI 종합분석",
      "AI 스타일 추천",
      "타임라인 예측",
    ],
    limitations: ["시술 히스토리 미제공"],
    highlight: false,
    badge: null,
    recommendation: null,
  },
  {
    id: "basic",
    name: "Basic",
    price: 19900,
    priceLabel: "19,900원",
    period: "/월",
    description: "제한 없는 기능 활용으로 시술의 완성도를 높이세요.",
    features: [
      "모든 기능 무제한",
      "고객 관리 무제한",
      "시술 히스토리 관리",
    ],
    limitations: [],
    highlight: false,
    badge: "추천",
    recommendation: "개인 디자이너 추천",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 199000,
    priceLabel: "199,000원",
    period: "/월",
    description: "매장 관리의 효율성을 극대화하고 팀 전체의 성장을 지원합니다.",
    features: [
      "매장 디자이너 무제한 연동 가능",
      "초대된 모든 디자이너에게 Basic 플랜 기능 제공",
      "매장 전체 디자이너별 고객 데이터 통합 관리 및 분석 시스템",
    ],
    limitations: [],
    highlight: true,
    badge: "인기",
    recommendation: "매장 단위 추천",
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
    if (planId === "free") return "Free 플랜";
    // Enterprise 사용자가 다른 플랜을 볼 때
    if (currentPlan === "enterprise" && planId !== "enterprise") {
      return `${plans.find((p) => p.id === planId)?.name} 플랜`;
    }
    return `${plans.find((p) => p.id === planId)?.name} 시작하기`;
  };

  const isButtonDisabled = (planId: string) => {
    // Enterprise 사용자는 다른 플랜 클릭 불가
    if (currentPlan === "enterprise" && planId !== "enterprise") return true;
    return planId === "free" || planId === currentPlan || loading !== null;
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span className="section-label">Pricing</span>
          <h1 className="font-heading text-[clamp(28px,4vw,42px)] font-light mt-4 mb-2">
            <em className="italic text-gold-light">요금제</em>
          </h1>
        </motion.div>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="text-[15px] text-white/50 font-light">
          성공하는 디자이너의 비밀, 당신의 비즈니스 규모에 맞는 플랜을 선택하세요
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
            className={`p-8 border text-center flex flex-col ${plan.highlight
              ? "border-gold bg-charcoal/80 backdrop-blur-sm"
              : "border-gold/15 bg-charcoal/60 backdrop-blur-sm"
              }`}
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <h3 className="font-heading text-[24px] font-normal text-white">{plan.name}</h3>
              {plan.badge && plan.id !== currentPlan && (
                <Badge className={`text-[10px] tracking-[1px] ${plan.highlight
                  ? "bg-gold/30 text-gold border-gold/40"
                  : "bg-gold/20 text-gold border-gold/30"
                  }`}>
                  {plan.badge}
                </Badge>
              )}
              {plan.id === currentPlan && plan.id !== "free" && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">사용 중</Badge>
              )}
            </div>
            <p className="text-[13px] text-white/50 font-light mb-4">{plan.description}</p>
            {plan.recommendation && (
              <div className="mb-6">
                <span className="inline-block px-3 py-1.5 bg-gold/10 border border-gold/30 text-gold text-[11px] tracking-[2px] uppercase">
                  {plan.recommendation}
                </span>
              </div>
            )}
            <div className="mb-8 pb-8 border-b border-gold/10">
              <span className="font-heading text-[36px] font-light text-white">{plan.priceLabel}</span>
              <span className="text-[14px] text-white/40 font-light">{plan.period}</span>
            </div>

            <div className="flex-1 space-y-3 text-left mb-8">
              {plan.features.map((feature, j) => (
                <div key={j} className="flex items-center gap-3 text-[13px] font-light">
                  <span className="text-gold text-[11px]">&#10003;</span>
                  <span className="text-white/70">{feature}</span>
                </div>
              ))}
              {plan.limitations.map((limitation, j) => (
                <div key={`lim-${j}`} className="flex items-center gap-3 text-[13px] font-light">
                  <span className="text-white/20 text-[11px]">&#10005;</span>
                  <span className="text-white/30 line-through">{limitation}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={isButtonDisabled(plan.id)}
              className={`w-full py-4 text-[12px] tracking-[3px] uppercase transition-all duration-500 shadow-luxury-sm hover:shadow-luxury ${plan.highlight
                ? "border border-gold text-gold hover:bg-gold hover:text-charcoal disabled:opacity-40 disabled:cursor-not-allowed"
                : "border border-gold/30 text-gold hover:bg-gold/10 disabled:opacity-40 disabled:cursor-not-allowed"
                }`}
            >
              {loading === plan.id ? "처리 중..." : getButtonText(plan.id)}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
