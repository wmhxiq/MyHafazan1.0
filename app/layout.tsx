import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { Plus_Jakarta_Sans } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
});

const spacesUrl = process.env.DO_SPACES_CDN_URL;

export const metadata: Metadata = {
  title: "MyHafazan",
  description: "Sistem Pengurusan Hafazan SMK Agama Bangi'",
  icons: {
    icon: "/lencananobg.png",
  },
  openGraph: {
    title: "MyHafazan",
    description: "Sistem Pengurusan Hafazan SMK Agama Bangi",
    images: [
      {
        url: `${spacesUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "MyHafazan",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
