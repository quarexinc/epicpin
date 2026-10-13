import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#0A090C",
        coal: "#121016",
        ash: "#1A1720",
        smoke: "#241F2B",
        line: "#2E2836",
        bone: "#F5EFE8",
        mute: "#A096A8",
        ember: { DEFAULT: "#FF6A13", 50: "#FFF1E6", 300: "#FF9A57", 400: "#FF7E2E", 500: "#FF6A13", 600: "#E5540A", 700: "#B83F05" },
        blaze: "#FFB224",
        plasma: "#FF3D6E",
        mint: "#3DDC97",
      },
      fontFamily: {
        display: ['"Unbounded Variable"', "system-ui", "sans-serif"],
        sans: ['"Plus Jakarta Sans Variable"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,106,19,.35), 0 10px 40px -10px rgba(255,106,19,.55)",
        ember: "0 18px 50px -18px rgba(255,106,19,.7)",
      },
      keyframes: {
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        floaty: { "0%,100%": { transform: "translateY(0) rotate(var(--r,0deg))" }, "50%": { transform: "translateY(-14px) rotate(var(--r,0deg))" } },
        shine: { from: { backgroundPosition: "200% 0" }, to: { backgroundPosition: "-200% 0" } },
        progress: { from: { transform: "scaleX(0)" }, to: { transform: "scaleX(1)" } },
      },
      animation: {
        marquee: "marquee 40s linear infinite",
        floaty: "floaty 6s ease-in-out infinite",
        shine: "shine 3s linear infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
