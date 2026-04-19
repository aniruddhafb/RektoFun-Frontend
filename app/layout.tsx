import type { Metadata } from "next";
import "./globals.css";
import { Navbar, Footer } from "./components";

import Providers from "./providers/PrivyProvider";

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
      <body className="min-h-full flex flex-col">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
