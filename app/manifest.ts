import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NestHelper | Household Help in Bothell, Woodinville & Eastside WA",
    short_name: "NestHelper",
    description: "Household help, home resets, laundry catch-up, errands, and organizing for busy Eastside/Northshore families.",
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
