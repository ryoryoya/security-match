import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["800"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sytac | 警備会社 人員マッチング",
  description: "警備会社間で余剰人員と不足人数を共有する招待制マッチングアプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={manrope.variable}>
      <body>{children}</body>
    </html>
  );
}
