import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#6366F1",
          hover: "#5048E5",
          light: "#EEF0FE",
        },
        page: {
          bg: "#F6F7FB",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          dark: "#1C1B22",
          "dark-alt": "#14141A",
        },
        border: {
          DEFAULT: "#ECECF3",
        },
        text: {
          primary: "#16131F",
          secondary: "#8A8A9B",
        },
        success: {
          DEFAULT: "#22C55E",
        },
        badge: {
          new: { bg: "#EEF0FE", text: "#6366F1" },
          contacted: { bg: "#DCFCE7", text: "#16A34A" },
          qualified: { bg: "#DBEAFE", text: "#2563EB" },
        },
      },
      borderRadius: {
        card: "16px",
        inner: "8px",
        pill: "10px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,19,31,.04), 0 4px 16px rgba(16,19,31,.04)",
      },
    },
  },
  plugins: [],
};

export default config;
