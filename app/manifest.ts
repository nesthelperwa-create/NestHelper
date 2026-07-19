import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NestHelper | Bothell, Eastside & Snohomish County Help",
    short_name: "NestHelper",
    description: "NestHelper helps busy Bothell, Eastside, and select Snohomish County families with home resets, laundry help, errands, and household support.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f7f2e7",
    theme_color: "#0f4f4a",
    icons: [
      {
        src: "/favicon-48x48.png",
        sizes: "48x48",
        type: "image/png",
      },
      {
        src: "/favicon-96x96.png",
        sizes: "96x96",
        type: "image/png",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/assets/brand/nesthelper-icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
