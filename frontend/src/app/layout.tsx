import { Header } from "@/components/custom/Header";
import { Footer } from "@/components/custom/Footer";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] });

import { getGlobalData, getGlobalMetadata } from "@/data/loaders";

export async function generateMetadata(): Promise<Metadata> {
  const metadata = await getGlobalMetadata()

  return {
    title: metadata?.title,
    description: metadata?.description
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode,
}>) {
  const globalData = await getGlobalData();
  return (
    <html lang="en">
      <body className={inter.className}>
        <Toaster position="bottom-center" />
        <Header data={globalData.header} />
        <div>{children}</div>
        <Footer data={globalData.footer} />
      </body>
    </html>
  );
}