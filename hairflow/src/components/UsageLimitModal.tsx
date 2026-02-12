"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface UsageLimitModalProps {
  open: boolean;
  onClose: () => void;
  message?: string;
}

export function UsageLimitModal({ open, onClose, message }: UsageLimitModalProps) {
  const router = useRouter();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="relative bg-charcoal border border-gold/20 p-8 sm:p-10 max-w-md w-full text-center"
          >
            {/* Icon */}
            <div className="w-16 h-16 mx-auto mb-6 border border-gold/30 rounded-full flex items-center justify-center">
              <span className="text-gold text-[24px]">&#9889;</span>
            </div>

            <h3 className="font-heading text-[24px] font-light text-white mb-3">
              오늘의 무료 분석을<br />모두 사용했어요
            </h3>

            <p className="text-[14px] text-white/50 font-light leading-relaxed mb-2">
              {message ?? "Free 플랜은 하루 3건까지 AI 분석이 가능합니다."}
            </p>
            <p className="text-[13px] text-white/30 font-light mb-8">
              업그레이드하면 무제한으로 이용할 수 있어요
            </p>

            {/* CTA */}
            <button
              onClick={() => router.push("/pricing")}
              className="w-full px-8 py-4 border border-gold text-gold text-[12px] tracking-[3px] uppercase hover:bg-gold hover:text-charcoal transition-all duration-500 mb-3"
            >
              플랜 업그레이드
            </button>

            <button
              onClick={onClose}
              className="w-full px-8 py-3 text-white/30 text-[12px] tracking-[2px] uppercase hover:text-white/50 transition-colors"
            >
              닫기
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
