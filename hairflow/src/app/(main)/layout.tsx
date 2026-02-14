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
      <svg className="absolute inset-0 w-full h-full opacity-[0.015]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#D4B37F" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
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
