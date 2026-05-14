import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { cn } from "@/lib/utils";
import Providers from "./providers";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "PayFlow",
  description: "Digital wallet platform",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Reading headers here causes Next.js to propagate the x-nonce from
  // middleware to all inline scripts it generates (RSC streaming, hydration).
  await headers();

  return (
    <html lang="en" className={cn("h-full antialiased", manrope.variable)}>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
