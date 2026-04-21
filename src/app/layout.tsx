import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bentropy | Fighting Entropy, One Project at a Time",
  description:
    "The personal portfolio of Ben - entrepreneur, developer, and entropy fighter. Showcasing web projects that bring order to chaos.",
  keywords: [
    "web development",
    "portfolio",
    "projects",
    "entrepreneur",
    "developer",
  ],
  authors: [{ name: "Ben" }],
  openGraph: {
    title: "Bentropy",
    description: "Fighting entropy, one project at a time",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${jetbrains.variable} antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
