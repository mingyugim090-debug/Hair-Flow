"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.8, ease: "easeOut" as const },
  }),
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-charcoal text-white overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-[60px] py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="HairFlow" width={40} height={40} className="object-contain" />
          <span className="font-heading text-[24px] font-light tracking-[4px] text-white">HAIRFLOW</span>
        </Link>
        <div className="hidden md:flex items-center gap-10">
          <a href="#about" className="text-[13px] font-light tracking-[2px] uppercase text-white/80 hover:text-gold transition-colors">소개</a>
          <a href="#features" className="text-[13px] font-light tracking-[2px] uppercase text-white/80 hover:text-gold transition-colors">기능</a>
          <a href="#pricing" className="text-[13px] font-light tracking-[2px] uppercase text-white/80 hover:text-gold transition-colors">요금제</a>
          <Link href="/login" className="text-[13px] font-light tracking-[2px] uppercase text-white/80 hover:text-gold transition-colors">로그인</Link>
        </div>
        <Link href="/login" className="md:hidden text-[13px] font-light tracking-[2px] uppercase text-gold">
          시작하기
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative h-screen flex items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_40%,rgba(201,169,110,0.12)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_20%_80%,rgba(139,111,94,0.08)_0%,transparent_50%)]" />

        <div className="text-center relative z-10 px-6 max-w-[900px] mx-auto">
          <motion.p custom={0} initial="hidden" animate="visible" variants={fadeUp}
            className="text-[12px] tracking-[8px] uppercase text-gold mb-8">
            Designer's Smart Assistant
          </motion.p>
          <motion.h1 custom={1} initial="hidden" animate="visible" variants={fadeUp}
            className="font-heading text-[clamp(36px,7vw,68px)] font-light leading-[1.25] tracking-tight mb-8">
            감각을 데이터로 완성하다,<br />디자이너를 위한 <em className="italic text-gold-light">HairFlow</em>
          </motion.h1>
          <motion.p custom={2} initial="hidden" animate="visible" variants={fadeUp}
            className="text-[clamp(14px,1.8vw,17px)] font-light text-white/70 leading-[1.8] max-w-[700px] mx-auto">
            5면 정밀 분석부터 8주 후 스타일 예측까지,<br className="hidden sm:block" />
            고객에게 확신을 주는 스마트한 상담 경험을 시작하세요.
          </motion.p>
          <motion.div custom={3} initial="hidden" animate="visible" variants={fadeUp} className="mt-12">
            <Link href="/login"
              className="inline-block px-[52px] py-[18px] border border-gold text-gold text-[12px] tracking-[4px] uppercase hover:bg-gold hover:text-charcoal transition-all duration-300">
              지금 시작하기
            </Link>
          </motion.div>
        </div>

        <motion.div custom={4} initial="hidden" animate="visible" variants={fadeUp}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
          <span className="text-[10px] tracking-[3px] text-white/40 uppercase">Scroll</span>
          <div className="w-px h-10 bg-gradient-to-b from-gold to-transparent" />
        </motion.div>
      </section>

      {/* About */}
      <section id="about" className="bg-cream text-charcoal">
        <div className="max-w-[1300px] mx-auto px-6 md:px-[60px] py-[140px] grid md:grid-cols-2 gap-20 items-center">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
            className="relative aspect-[3/4] overflow-hidden">
            <div className="w-full h-full bg-gradient-to-br from-soft-beige to-warm-brown flex items-center justify-center">
              <span className="text-[80px] opacity-30">✂</span>
            </div>
            <div className="absolute -top-5 -left-5 right-5 bottom-5 border border-gold -z-10" />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }}>
            <span className="section-label">About</span>
            <h2 className="font-heading text-[clamp(32px,4vw,52px)] font-light leading-[1.2] mt-6 mb-8 text-deep-brown">
              헤어 디자이너의<br /><em className="italic text-warm-brown">고민</em>을 해결합니다
            </h2>
            <p className="text-[15px] leading-[2] text-charcoal/70 font-light mb-4">
              레퍼런스 사진과 실제 고객 모발의 차이, 감에 의존하는 약제 배합,
              모호한 소통으로 인한 재시술의 공포.
            </p>
            <p className="text-[15px] leading-[2] text-charcoal/70 font-light">
              HairFlow는 첨단 시각 분석 기술로 모발 상태를 정밀 진단하고,
              경력 20년차 수준의 시술 레시피를 자동 생성합니다.
            </p>
            <div className="flex gap-8 sm:gap-12 mt-12 pt-12 border-t border-warm-brown/20">
              {[
                { num: "5면", label: "정밀 분석" },
                { num: "8주", label: "미래 예측" },
                { num: "24/7", label: "시술 지원" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="font-heading text-[clamp(36px,5vw,48px)] font-light text-gold leading-none">{stat.num}</div>
                  <div className="text-[11px] sm:text-[12px] tracking-[2px] text-charcoal/50 mt-2 uppercase">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-charcoal relative py-[140px] px-6 md:px-[60px]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(201,169,110,0.05)_0%,transparent_60%)]" />
        <div className="text-center mb-20 relative z-10">
          <span className="section-label">Features</span>
          <h2 className="font-heading text-[clamp(32px,4vw,52px)] font-light text-white mt-6">
            <em className="italic text-gold-light">4대 핵심</em> 기능
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-px max-w-[1200px] mx-auto relative z-10">
          {[
            {
              num: "01",
              name: "정밀 진단",
              nameEn: "Precision Analysis",
              desc: "5개 각도(전/후/좌/우/상) 사진을 통해 두상 형태, 모발 밀도 분포, 손상도를 체계적으로 분석합니다.",
              sub: "디지털 모발 진단"
            },
            {
              num: "02",
              name: "스타일 시뮬레이션",
              nameEn: "Style Simulation",
              desc: "고객의 얼굴형과 분위기에 최적화된 헤어 스타일을 제안하고, 맞춤형 시술 레시피(커트/펌 가이드)를 생성합니다.",
              sub: "맞춤 레시피 생성"
            },
            {
              num: "03",
              name: "미래 타임라인",
              nameEn: "Future Timeline",
              desc: "시술 직후 사진을 바탕으로 1주부터 8주까지의 스타일 변화를 시각적으로 예측하여 재방문 시점을 제안합니다.",
              sub: "성장 데이터 분석"
            },
            {
              num: "04",
              name: "히스토리 관리",
              nameEn: "History Management",
              desc: "회차별 사진 데이터와 시술 기록을 한눈에 관리하여 지속 가능한 고객 케어를 실현합니다.",
              sub: "체계적 데이터 관리"
            },
          ].map((item) => (
            <motion.div key={item.num} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="p-10 sm:p-12 md:p-14 border border-gold/10 hover:bg-gold/5 hover:border-gold/30 transition-all duration-300">
              <div className="font-heading text-[13px] text-gold tracking-[2px] mb-6">{item.num}</div>
              <div className="font-heading text-[clamp(22px,3vw,28px)] font-normal text-white mb-2">{item.name}</div>
              <div className="text-[13px] text-white/40 font-light mb-6 tracking-[1px]">{item.nameEn}</div>
              <div className="text-[14px] leading-[1.8] text-white/60 font-light mb-8">{item.desc}</div>
              <div className="text-[16px] text-gold-light font-light">{item.sub}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-cream text-charcoal py-[140px] px-6 md:px-[60px]">
        <div className="text-center mb-20">
          <span className="section-label">Pricing</span>
          <h2 className="font-heading text-[clamp(32px,4vw,52px)] font-light text-deep-brown mt-6">
            심플한 <em className="italic text-warm-brown">요금제</em>
          </h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-px max-w-[1000px] mx-auto">
          {[
            { name: "Free", price: "0원", period: "", desc: "HairFlow를 체험해보세요", features: ["하루 3건 분석", "AI 시술 레시피", "AI 미래 타임라인"], hl: false },
            { name: "Basic", price: "19,900원", period: "/월", desc: "개인 디자이너에게 추천", features: ["무제한 분석", "분석 히스토리 저장", "우선 처리"], hl: true },
            { name: "Pro", price: "39,900원", period: "/월", desc: "매장 전체가 사용할 때", features: ["매장 전체 사용", "매출 분석 리포트", "약제 브랜드 DB"], hl: false },
          ].map((plan, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className={`p-12 border text-center ${plan.hl ? "border-gold bg-charcoal text-white" : "border-warm-brown/20 bg-white"}`}>
              {plan.hl && <span className="section-label mb-4 inline-block">추천</span>}
              <h3 className="font-heading text-[28px] font-normal mb-2">{plan.name}</h3>
              <p className={`text-[13px] font-light mb-6 ${plan.hl ? "text-white/50" : "text-charcoal/50"}`}>{plan.desc}</p>
              <div className="font-heading text-[36px] font-light mb-1">
                {plan.price}<small className={`text-[14px] ${plan.hl ? "text-white/30" : "text-charcoal/30"} font-sans`}>{plan.period}</small>
              </div>
              <div className={`space-y-3 mt-8 mb-8 text-left ${plan.hl ? "text-white/60" : "text-charcoal/60"}`}>
                {plan.features.map((f, j) => (
                  <div key={j} className="flex items-center gap-3 text-[14px] font-light">
                    <span className="text-gold">&#10003;</span>{f}
                  </div>
                ))}
              </div>
              <Link href="/login"
                className={`inline-block w-full py-4 text-[12px] tracking-[3px] uppercase transition-all duration-500 ${
                  plan.hl ? "border border-gold text-gold hover:bg-gold hover:text-charcoal" : "border border-deep-brown/30 text-deep-brown hover:bg-deep-brown hover:text-white"
                }`}>
                시작하기
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-soft-beige py-[140px] px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-[600px] mx-auto">
          <span className="section-label">Get Started</span>
          <h2 className="font-heading text-[clamp(36px,5vw,56px)] font-light text-deep-brown leading-[1.3] mt-6 mb-6">
            고객과의 상담,<br /><em className="italic text-warm-brown">HairFlow</em>와 함께
          </h2>
          <p className="text-[15px] leading-[1.9] text-charcoal/60 font-light max-w-[480px] mx-auto mb-12">
            5면 정밀 분석부터 미래 예측까지,<br />
            데이터 기반의 확신 있는 시술을 지금 경험하세요.
          </p>
          <Link href="/login"
            className="inline-block px-[52px] py-[18px] border border-deep-brown text-deep-brown text-[12px] tracking-[4px] uppercase hover:bg-deep-brown hover:text-white transition-all duration-300">
            무료로 시작하기
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-charcoal py-20 px-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-8">
          <Image src="/logo.png" alt="HairFlow" width={48} height={48} className="object-contain" />
          <span className="font-heading text-[32px] font-light tracking-[8px] text-white">HAIRFLOW</span>
        </div>
        <div className="flex justify-center gap-8 mb-12">
          <Link href="/pricing" className="text-[12px] tracking-[3px] text-white/50 uppercase hover:text-gold transition-colors">Pricing</Link>
          <span className="text-[12px] tracking-[3px] text-white/50 uppercase hover:text-gold transition-colors cursor-pointer">Terms</span>
          <span className="text-[12px] tracking-[3px] text-white/50 uppercase hover:text-gold transition-colors cursor-pointer">Privacy</span>
        </div>
        <p className="text-[11px] text-white/25 tracking-[2px]">&copy; 2026 HairFlow. All rights reserved.</p>
      </footer>
    </div>
  );
}
