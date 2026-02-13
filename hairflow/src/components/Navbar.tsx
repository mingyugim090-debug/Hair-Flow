"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/recipe", label: "AI 레시피" },
  { href: "/timeline", label: "AI 타임라인" },
  { href: "/customers", label: "고객관리" },
  { href: "/pricing", label: "요금제" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-clay/10 hidden md:block">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image src="/logo.png" alt="HairFlow" width={36} height={36} className="object-contain" />
              <span className="font-heading text-[18px] font-light tracking-[4px] text-charcoal">HAIRFLOW</span>
            </Link>
            <div className="flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-[12px] tracking-[2px] uppercase transition-colors relative pb-1 ${
                    pathname === item.href || pathname?.startsWith(item.href + "/")
                      ? "text-rose"
                      : "text-warm-taupe hover:text-rose"
                  }`}
                >
                  {item.label}
                  {(pathname === item.href || pathname?.startsWith(item.href + "/")) && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-rose rounded-full" />
                  )}
                </Link>
              ))}
            </div>
          </div>
          <Link
            href="/settings"
            className={`text-[12px] tracking-[2px] uppercase transition-colors ${
              pathname === "/settings" ? "text-rose" : "text-warm-taupe hover:text-rose"
            }`}
          >
            프로필
          </Link>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-clay/10 md:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-14 px-1">
          {[...navItems, { href: "/settings", label: "프로필" }].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-2 min-w-0 flex-1 ${
                pathname === item.href || pathname?.startsWith(item.href + "/")
                  ? "text-rose"
                  : "text-warm-taupe"
              }`}
            >
              <span className="text-[10px] tracking-[0.5px] font-light truncate">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
