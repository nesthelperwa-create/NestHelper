import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        nest: {
          teal: "#005d56",
          teal2: "#127e74",
          mint: "#c4e2d6",
          cream: "#fff8ee",
          cream2: "#f4efe6",
          gold: "#c18f37",
          gold2: "#e6be5a",
          ink: "#1f2d2b"
        }
      },
      boxShadow: {
        soft: "0 20px 60px rgba(0, 93, 86, 0.14)",
        glow: "0 0 0 1px rgba(193, 143, 55, 0.18), 0 24px 80px rgba(0, 93, 86, 0.2)"
      },
      borderRadius: {
        xxl: "2rem"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-700px 0" },
          "100%": { backgroundPosition: "700px 0" }
        }
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite"
      }
    }
  },
  plugins: []
};
export default config;
