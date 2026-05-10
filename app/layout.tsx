import "./globals.css";
import Header from "@/components/Header";
import GalaxyBackground from "@/components/GalaxyBackground";
import CustomCursor from "@/components/CustomCursor";
import LoadingScreen from "@/components/LoadingScreen";
import { getSession } from "@/lib/auth";

export const metadata = {
  title: "Gia Phả — Kết Nối Thế Hệ",
  description: "Hệ thống phả hệ gia đình cinematic",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=Be+Vietnam+Pro:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500&display=swap"
        />
      </head>
      <body>
        <GalaxyBackground />
        <CustomCursor />
        <LoadingScreen />
        <Header session={session} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 relative z-10">
          {children}
        </main>
        <footer className="text-center pb-8 pt-4 font-mono text-[10px] tracking-[0.25em] text-violet-glow/40 relative z-10">
          ✧ KẾT NỐI THẾ HỆ — LƯU GIỮ CỘI NGUỒN ✧
        </footer>
      </body>
    </html>
  );
}
