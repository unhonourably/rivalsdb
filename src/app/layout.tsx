import type { Metadata } from "next";
import { Inter, Fredoka } from "next/font/google";
import "./globals.css";
import rivalsLogo from '@/components/rivalslogo.png';
import MobileNav from '@/components/MobileNav';

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
  icons: {
    icon: rivalsLogo.src,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${fredoka.variable} font-sans antialiased`}>
        {children}
        <MobileNav />
      </body>
    </html>
  );
}
