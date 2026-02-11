import { Navbar } from "@/components/Navbar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-charcoal text-white">
      <Navbar />
      <main className="pt-20 pb-20 md:pb-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
