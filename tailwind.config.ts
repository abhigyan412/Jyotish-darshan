import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        cinzel: ['"Cinzel Decorative"', "serif"],
        crimson: ['"Crimson Pro"', "serif"],
      },
      colors: {
        void: "#080614",
        surface: "#0F0D22",
        surface2: "#181530",
        gold: "#C9A84C",
        "gold-light": "#E8C96A",
        muted: "#9E96B8",
        dim: "#7B7499",
      },
    },
  },
  plugins: [],
} satisfies Config;
