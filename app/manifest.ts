import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RektoFun — Prediction & Challenge Markets",
    short_name: "RektoFun",
    description: "Permissionless challenge markets on Solana.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3e1d7",
    theme_color: "#f3e1d7",
    icons: [{ src: "/fav.png", sizes: "512x512", type: "image/png" }],
  };
}
