"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  };

  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(201,169,110,0.08)_0%,transparent_60%)]" />
      <div className="absolute w-[200px] h-[200px] rounded-full border border-gold/10 top-[15%] right-[10%] animate-[floatSlow_8s_ease-in-out_infinite]" />
      <div className="absolute w-[150px] h-[150px] rounded-full border border-gold/10 bottom-[20%] left-[5%] animate-[floatSlow_6s_ease-in-out_infinite_reverse]" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-16">
          <Link href="/">
            <h1 className="font-heading text-[32px] font-light tracking-[8px] text-white">
              HAIRFLOW
            </h1>
          </Link>
          <p className="text-[13px] text-white/40 mt-3 tracking-[2px] font-light">AI Hair Design Assistant</p>
        </div>

        {/* Login Card */}
        <div className="border border-gold/20 p-10">
          <h2 className="font-heading text-[24px] font-light text-white text-center mb-2">로그인</h2>
          <p className="text-[13px] text-white/40 text-center mb-10 font-light">
            Google 계정으로 간편하게 시작하세요
          </p>

          <button
            onClick={handleGoogleLogin}
            className="w-full h-14 bg-white hover:bg-gray-50 text-charcoal font-normal flex items-center justify-center gap-3 transition-colors text-[14px]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google로 계속하기
          </button>

          <div className="mt-8 text-center">
            <p className="text-[11px] text-white/30 font-light leading-relaxed">
              로그인 시{" "}
              <span className="text-gold/60 cursor-pointer hover:text-gold transition-colors">이용약관</span>과{" "}
              <span className="text-gold/60 cursor-pointer hover:text-gold transition-colors">개인정보처리방침</span>에 동의합니다.
            </p>
          </div>
        </div>

        {/* Back */}
        <div className="text-center mt-10">
          <Link href="/" className="text-[12px] tracking-[2px] text-white/40 hover:text-gold transition-colors uppercase font-light">
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
