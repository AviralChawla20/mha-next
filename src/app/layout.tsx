import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MainLayout from "@/components/MainLayout"; // <--- 1. ADD THIS IMPORT

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "My Hero Timeline", // <--- (Optional) Update your title here
  description: "The Ultimate Guide",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        // Added 'bg-slate-900' to prevent white flashes while loading
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-900`}
      >
        {/* <--- 2. WRAP CHILDREN WITH YOUR LAYOUT ---> */}
        <MainLayout>
          {children}
        </MainLayout>

      </body>
    </html>
  );
}