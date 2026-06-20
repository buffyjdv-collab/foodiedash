import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FoodieDash — Food Delivery, Reimagined",
  description: "Order food online from your favourite restaurants. Fast delivery, AI-powered discovery, live order tracking.",
  keywords: ["food delivery", "online food order", "Swiggy clone", "restaurant delivery", "Bangalore food"],
  authors: [{ name: "FoodieDash" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "FoodieDash — Food Delivery, Reimagined",
    description: "Order food online with AI-powered discovery and live tracking.",
    siteName: "FoodieDash",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <SonnerToaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
