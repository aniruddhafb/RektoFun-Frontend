import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Analytics } from "@vercel/analytics/next";
import Providers from "./providers/PrivyProvider";
import { WelcomeTutorialModal } from "./components/homepage-components";

export const metadata: Metadata = {
  title: {
    default: "RektoFun | The First PvP Battleground For Predictions",
    template: " | RektoFun",
  },
  description: "The first PvP battleground for predictions. Create permissionless prediciton challenges around crypto & sports. Compete other traders, and win rewards. Prediction Markets 2.0",
  keywords: ["prediction markets", " PvP trading", " crypto predictions", " price prediction", "permissionless prediction markets", " solana meme projects", " pump fun alternative", " prediction markets on solana", "pvp battleground for predictions", " Solana", " Bitcoin", " Ethereum"],
  authors: [{ name: "RektoFun" }],
  creator: "RektoFun",
  publisher: "RektoFun",
  metadataBase: new URL("https://rekto.fun"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://rekto.fun",
    siteName: "RektoFun",
    title: "RektoFun | The First PvP Battleground For Predictions",
    description: "The first PvP battleground for predictions. Compete, battle, and win rewards.",
    images: [
      {
        url: "/logos/BG.png",
        width: 1200,
        height: 630,
        alt: "RektoFun - PvP Prediction Markets",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RektoFun | The First PvP Battleground For Predictions",
    description: "The first PvP battleground for predictions. Compete, battle, and win rewards.",
    images: ["/logos/BG.png"],
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
    icon: "/fav.png",
    shortcut: "/fav.png",
    apple: "/fav.png",
  },
  manifest: "/manifest.json",
  verification: {
    google: "your-google-verification-code",
  },
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
        <link rel="icon" type="image/png" href="/fav.png" />
        <link rel="shortcut icon" type="image/png" href="/fav.png" />
        <link rel="apple-touch-icon" href="/fav.png" />
        <meta name="theme-color" content="#f3e1d7" />
        <meta name="msapplication-TileColor" content="#f3e1d7" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>
          <div className="pixel-shell min-h-full flex flex-col">
            <WelcomeTutorialModal />
            <Navbar />
            <main className="flex-1 mt-12 md:mt-8">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
