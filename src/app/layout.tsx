import type { Metadata } from "next";
import { Inter, Fredoka } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
});

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: '--font-fredoka',
  display: 'swap',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: "RivalsDB - Marvel Rivals Stats Tracker",
  description: "Track your Marvel Rivals stats, leaderboards, and player profiles. The ultimate companion for Marvel Rivals players.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${fredoka.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
