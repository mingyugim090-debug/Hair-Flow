"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/recipe", label: "AI 레시피" },
  { href: "/timeline", label: "AI 타임라인" },
  { href: "/pricing", label: "요금제" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-charcoal/95 backdrop-blur-md border-b border-gold/10 hidden md:block">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link href="/dashboard" className="font-heading text-[22px] font-light tracking-[6px] text-white">
              HAIRFLOW
            </Link>
            <div className="flex items-center gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-[12px] tracking-[2px] uppercase transition-colors relative pb-1 ${
                    pathname === item.href
                      ? "text-gold"
                      : "text-white/60 hover:text-gold"
                  }`}
                >
                  {item.label}
                  {pathname === item.href && (
                    <span className="absolute bottom-0 left-0 w-full h-px bg-gold" />
                  )}
                </Link>
              ))}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-[12px] tracking-[2px] text-white/40 hover:text-gold transition-colors uppercase"
          >
            로그아웃
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-charcoal/95 backdrop-blur-md border-t border-gold/10 md:hidden">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[60px] ${
                pathname === item.href
                  ? "text-gold"
                  : "text-white/40"
              }`}
            >
              <span className="text-[10px] tracking-[1px] font-light">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
