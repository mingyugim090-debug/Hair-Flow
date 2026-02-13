"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const paymentKey = searchParams.get("paymentKey");
    const orderId = searchParams.get("orderId");
    const amount = searchParams.get("amount");

    if (!paymentKey || !orderId || !amount) {
      setStatus("error");
      setErrorMessage("결제 정보가 올바르지 않습니다.");
      return;
    }

    const planId = orderId.split("_")[1] as "basic" | "enterprise";

    const confirmPayment = async () => {
      try {
        const res = await fetch("/api/payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: Number(amount),
            planId,
          }),
        });

        const result = await res.json();

        if (result.error) {
          setStatus("error");
          setErrorMessage(result.error.message);
        } else {
          setStatus("success");
        }
      } catch {
        setStatus("error");
        setErrorMessage("결제 확인 중 오류가 발생했습니다.");
      }
    };

    confirmPayment();
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="border border-gold/15 p-12 text-center">
          {status === "loading" && (
            <>
              <div className="w-12 h-12 mx-auto mb-6 border border-gold/30 border-t-gold rounded-full animate-spin" />
              <h2 className="font-heading text-[24px] font-light mb-2">결제 확인 중</h2>
              <p className="text-[13px] text-white/40 font-light">잠시만 기다려주세요.</p>
            </>
          )}
          {status === "success" && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 border border-gold/30 flex items-center justify-center">
                <span className="text-gold text-[28px]">&#10003;</span>
              </div>
              <h2 className="font-heading text-[28px] font-light mb-2">
                구독 <em className="italic text-gold-light">완료</em>
              </h2>
              <p className="text-[13px] text-white/40 font-light mb-8 leading-relaxed">
                플랜이 성공적으로 업그레이드되었습니다.
                <br />
                지금부터 무제한으로 AI 분석을 이용하세요.
              </p>
              <button
                onClick={() => router.push("/dashboard")}
                className="px-10 py-3 border border-gold text-gold text-[11px] tracking-[2px] uppercase hover:bg-gold hover:text-charcoal transition-all duration-500"
              >
                대시보드로 이동
              </button>
            </>
          )}
          {status === "error" && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 border border-white/10 flex items-center justify-center">
                <span className="text-white/30 text-[28px]">&#10005;</span>
              </div>
              <h2 className="font-heading text-[28px] font-light mb-2">결제 실패</h2>
              <p className="text-[13px] text-white/40 font-light mb-8">{errorMessage}</p>
              <button
                onClick={() => router.push("/pricing")}
                className="px-10 py-3 border border-gold/30 text-gold/60 text-[11px] tracking-[2px] uppercase hover:border-gold hover:text-gold transition-all duration-500"
              >
                다시 시도하기
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border border-gold/30 border-t-gold rounded-full animate-spin" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
