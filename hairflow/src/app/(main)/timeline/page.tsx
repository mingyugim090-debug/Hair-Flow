"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TimelinePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/customers");
  }, [router]);

  return (
    <div className="flex justify-center items-center py-32">
      <div className="text-center">
        <div className="w-8 h-8 mx-auto mb-4 border border-gold/30 border-t-gold rounded-full animate-spin" />
        <p className="text-[14px] text-white/50 font-light">
          고객 관리 페이지로 이동 중...
        </p>
      </div>
    </div>
  );
}
