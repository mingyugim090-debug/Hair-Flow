import type { Metadata } from "next";
import { Noto_Sans_KR, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "HairFlow - AI 헤어 시술 레시피 & 미래 예측",
  description: "고객 사진 한 장으로 시술 레시피부터 8주 후 변화까지 예측하는 헤어 디자이너 전용 AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${notoSansKR.variable} ${cormorant.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
