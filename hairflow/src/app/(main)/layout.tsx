import { Navbar } from "@/components/Navbar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream text-charcoal relative">
      {/* Decorative organic background shapes */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-rose/[0.04] organic-blob animate-[morphBlob_20s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 -left-32 w-72 h-72 bg-gold/[0.04] organic-blob-2 animate-[morphBlob_15s_ease-in-out_infinite_reverse]" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-soft-beige/60 organic-blob-3 animate-[floatSlow_18s_ease-in-out_infinite]" />
      </div>

      <Navbar />
      <main className="pt-20 pb-20 md:pb-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
