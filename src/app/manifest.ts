import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Eatofine Admin",
    short_name: "Eatofine",
    description: "Admin panel for the Eatofine multi-vendor food delivery platform",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#064e3b",
    theme_color: "#047857",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
