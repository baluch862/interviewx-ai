import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InterviewX AI - Advanced Mock Evaluations",
  description: "Enterprise-grade automated sandbox platform for corporate AI technical & behavioral mock sessions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-background text-foreground min-h-screen">
        {children}
      </body>
    </html>
  );
}
