import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import PortfolioClient from "./PortfolioClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("designer_name, shop_name, bio, specialties")
    .eq("id", id)
    .single();

  if (!profile) {
    return { title: "HairFlow Portfolio" };
  }

  const name = profile.designer_name ?? "디자이너";
  const shop = profile.shop_name ?? "";
  const description = profile.bio ?? `${name} 디자이너의 포트폴리오`;
  const specialties = (profile.specialties as string[])?.join(", ") ?? "";

  return {
    title: `${name} | ${shop} - HairFlow`,
    description: `${description}${specialties ? ` | ${specialties}` : ""}`,
    openGraph: {
      title: `${name} | ${shop}`,
      description: `${description}${specialties ? ` | 전문: ${specialties}` : ""}`,
      images: [{ url: "/icon-512.png", width: 512, height: 512 }],
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} | ${shop} - HairFlow`,
      description,
    },
  };
}

export default async function PortfolioPage({ params }: PageProps) {
  const { id } = await params;
  return <PortfolioClient designerId={id} />;
}
