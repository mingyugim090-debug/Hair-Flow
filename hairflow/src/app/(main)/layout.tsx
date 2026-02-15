import { Navbar } from "@/components/Navbar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-charcoal text-white relative overflow-hidden">
      {/* Luxury background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_100%_at_50%_0%,rgba(212,179,127,0.06)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(139,111,94,0.04)_0%,transparent_40%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(139,111,94,0.04)_0%,transparent_40%)]" />

      {/* Abstract geometric wireframe - SVG overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.015] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#D4B37F" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Luxury gold curves - abstract flowing lines */}
      <svg className="fixed inset-0 w-full h-full opacity-[0.02] pointer-events-none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <path
          d="M-100,200 Q400,100 800,300 T1600,200"
          stroke="url(#goldGradient1)"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M-100,500 Q500,400 1000,600 T2000,500"
          stroke="url(#goldGradient2)"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M200,0 Q600,200 1000,100 T1800,300"
          stroke="url(#goldGradient3)"
          strokeWidth="1"
          fill="none"
        />
        <defs>
          <linearGradient id="goldGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D4B37F" stopOpacity="0" />
            <stop offset="50%" stopColor="#D4B37F" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#D4B37F" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="goldGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C9A96E" stopOpacity="0" />
            <stop offset="50%" stopColor="#C9A96E" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#C9A96E" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="goldGradient3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B6F5E" stopOpacity="0" />
            <stop offset="50%" stopColor="#8B6F5E" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8B6F5E" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      <div className="relative z-10">
        <Navbar />
        <main className="pt-20 pb-20 md:pb-8 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
