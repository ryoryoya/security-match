import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "sytac | 警備会社 人員マッチング",
  description: "警備会社間で余剰人員と不足人数を共有する招待制マッチングアプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
