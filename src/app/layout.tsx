import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const space = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GEN Auto Care Kasir",
  description: "Aplikasi kasir (POS) GEN Auto Care",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,300..700,0..1,0&display=block"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${jakarta.variable} ${space.variable} font-sans antialiased bg-[#F4F5F8] text-[#14161B]`}
      >
        {children}
      </body>
    </html>
  );
}
