import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001",
  ),
  title: {
    default: "Eatofine Admin",
    template: "%s · Eatofine Admin",
  },
  description:
    "Admin panel for the Eatofine multi-vendor food delivery platform — manage vendors, orders, payouts, and the rider fleet.",
  applicationName: "Eatofine Admin",
  keywords: [
    "Eatofine",
    "food delivery",
    "admin panel",
    "multi-vendor",
    "restaurant management",
  ],
  authors: [{ name: "Eatofine" }],
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
  openGraph: {
    title: "Eatofine Admin",
    description: "Multi-vendor food delivery platform · admin panel",
    type: "website",
    siteName: "Eatofine Admin",
  },
  twitter: {
    card: "summary_large_image",
    title: "Eatofine Admin",
    description: "Multi-vendor food delivery platform · admin panel",
  },
};

export const viewport: Viewport = {
  themeColor: "#047857",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
