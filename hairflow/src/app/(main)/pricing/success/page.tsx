"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

    const planId = orderId.split("_")[1] as "basic" | "pro";

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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-slate-800/50 border-slate-700/50 text-white max-w-md">
          <CardContent className="p-8 text-center">
            {status === "loading" && (
              <>
                <div className="w-16 h-16 mx-auto mb-4 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                <h2 className="text-xl font-bold mb-2">결제 확인 중...</h2>
                <p className="text-slate-400">잠시만 기다려주세요.</p>
              </>
            )}
            {status === "success" && (
              <>
                <div className="text-5xl mb-4">🎉</div>
                <h2 className="text-xl font-bold mb-2">구독 완료!</h2>
                <p className="text-slate-400 mb-6">
                  플랜이 성공적으로 업그레이드되었습니다.
                  <br />
                  지금부터 무제한으로 AI 분석을 이용하세요!
                </p>
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-full px-8"
                >
                  대시보드로 이동
                </Button>
              </>
            )}
            {status === "error" && (
              <>
                <div className="text-5xl mb-4">😥</div>
                <h2 className="text-xl font-bold mb-2">결제 실패</h2>
                <p className="text-slate-400 mb-6">{errorMessage}</p>
                <Button
                  onClick={() => router.push("/pricing")}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 rounded-full"
                >
                  다시 시도하기
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-16 h-16 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
