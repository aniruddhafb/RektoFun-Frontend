import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Landing Page",
  description: "Beautiful landing page",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.cdnfonts.com" />
        <link
          href="https://fonts.cdnfonts.com/css/craftwork-grotesk"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
