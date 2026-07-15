import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Analytics } from "@vercel/analytics/next";
import ReownProvider from "./providers/reown-provider";
import { ReferralAttributionCapture } from "./components/ReferralAttributionCapture";

import { WelcomeTutorialModal } from "./components/homepage-components";

export const metadata: Metadata = {
  title: {
    default: "The PvP Battleground For Predictions On Solana | RektoFun",
    template: "%s | RektoFun",
  },
  description: "Explore RektoFun, a Solana challenge market where users create permissionless crypto and sports challenges, compete, and win rewards.",
  applicationName: "RektoFun",
  keywords: ["RektoFun", "prediction markets", "challenge markets", "Solana dapps", "prediction markets on Solana", "trending prediction markets", "crypto predictions", "sports predictions", "PvP predictions"],
  authors: [{ name: "RektoFun" }],
  creator: "RektoFun",
  publisher: "RektoFun",
  metadataBase: new URL("https://rekto.fun"),
  category: "finance",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://rekto.fun",
    siteName: "RektoFun",
    title: "The PvP Battleground For Predictions On Solana | RektoFun",
    description: "Create and join permissionless crypto and sports challenge markets on Solana.",
    images: [
      {
        url: "/logos/social_share.png",
        width: 1731,
        height: 909,
        alt: "RektoFun prediction and challenge markets on Solana",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The PvP Battleground For Predictions On Solana | RektoFun",
    description: "Create and join permissionless crypto and sports challenge markets on Solana.",
    images: ["/logos/social_share.png"],
    creator: "@rekto_fun",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/fav_old.png",
    shortcut: "/fav_old.png",
    apple: "/fav_old.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <Analytics />
      <head>
        <link rel="preconnect" href="https://fonts.cdnfonts.com" />
        <link
          href="https://fonts.cdnfonts.com/css/craftwork-grotesk"
          rel="stylesheet"
        />
        <link rel="icon" type="image/png" href="/fav_old.png" />
        <link rel="shortcut icon" type="image/png" href="/fav_old.png" />
        <link rel="apple-touch-icon" href="/fav_old.png" />
        <meta name="theme-color" content="#f3e1d7" />
        <meta name="msapplication-TileColor" content="#f3e1d7" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className="min-h-full flex flex-col">
        <ReownProvider>
          <div className="pixel-shell min-h-screen flex flex-col">
            <Suspense fallback={null}>
              <ReferralAttributionCapture />
            </Suspense>
            <WelcomeTutorialModal />
            <Navbar />
            <main className="flex-1 mt-12 md:mt-8">{children}</main>
            <Footer />
          </div>
        </ReownProvider>
      </body>
    </html>
  );
}
