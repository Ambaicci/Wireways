import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Toaster from "@/components/ui/Toaster";

// Load the fonts
const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

const ibmPlexMono = IBM_Plex_Mono({ 
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
});

export const metadata: Metadata = {
  title: "Wireways",
  description: "AI-Native Financial Operating System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${ibmPlexMono.variable}`}>
      <body className="font-sans antialiased bg-[#F5F6F8] text-[#0E1116]">
        {children}
        {/* Global toast notifications — renders on every page */}
        <Toaster />
      </body>
    </html>
  );
}