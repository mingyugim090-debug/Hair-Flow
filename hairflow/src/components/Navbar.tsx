"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/customers", label: "고객관리" },
  { href: "/pricing", label: "요금제" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Navbar - Enhanced Glassmorphism */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-luxury-dark shadow-luxury-sm hidden md:block">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="relative">
                <Image src="/logo.png" alt="HairFlow" width={36} height={36} className="object-contain transition-transform group-hover:scale-110" />
                <div className="absolute inset-0 bg-gold/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              <span className="font-heading text-[18px] font-light tracking-[5px] text-white">HAIRFLOW</span>
            </Link>
            <div className="flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-[12px] tracking-[2px] uppercase transition-all duration-300 relative pb-1 group ${
                    pathname === item.href || pathname?.startsWith(item.href + "/")
                      ? "text-gold"
                      : "text-white/60 hover:text-gold"
                  }`}
                >
                  {item.label}
                  {(pathname === item.href || pathname?.startsWith(item.href + "/")) && (
                    <span className="absolute bottom-0 left-0 w-full h-px bg-gold shadow-[0_0_8px_rgba(212,179,127,0.6)]" />
                  )}
                  <span className={`absolute bottom-0 left-0 w-0 h-px bg-gold/50 transition-all duration-300 group-hover:w-full ${
                    (pathname === item.href || pathname?.startsWith(item.href + "/")) && "opacity-0"
                  }`} />
                </Link>
              ))}
            </div>
          </div>
          <Link
            href="/settings"
            className={`text-[12px] tracking-[2px] uppercase transition-all duration-300 hover:text-gold ${
              pathname === "/settings" ? "text-gold" : "text-white/40"
            }`}
          >
            프로필
          </Link>
        </div>
      </nav>

      {/* Mobile Bottom Nav - Enhanced Glassmorphism */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass-luxury-dark shadow-[0_-5px_20px_rgba(0,0,0,0.15)] md:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-1">
          {[...navItems, { href: "/settings", label: "프로필" }].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-2 min-w-0 flex-1 transition-all duration-300 relative ${
                pathname === item.href || pathname?.startsWith(item.href + "/")
                  ? "text-gold"
                  : "text-white/40 active:text-gold/80"
              }`}
            >
              <span className="text-[11px] tracking-[1px] font-light truncate">{item.label}</span>
              {(pathname === item.href || pathname?.startsWith(item.href + "/")) && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gold shadow-[0_0_8px_rgba(212,179,127,0.6)]" />
              )}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
