import { type Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0F172A",       // dark navy background / main brand
        accent: "#A50A02",        // dark red
        success: "#059669",       // green
        warning: "#D97706",       // orange
        error: "#E61304",         // red
        light_blue: "#DBEAFE",    // light blue accent
        background_gray: "#F8FAFC",
        gray: {
          100: "#F8FAFC",   // very light gray background
          200: "#E5E7EB",   // light gray background / borders
          300: "#D1D5DB",   // medium light gray
          400: "#9CA3AF",   // medium gray
          500: "#6B7280",   // default gray for text
          600: "#4B5563",   // dark gray for text / borders
          700: "#374151",   // darker gray for headings
        },
      },
      fontFamily: {
        sans: ["Helvetica Neue", "ui-sans-serif", "system-ui"],
        heading: ["Helvetica Neue", "ui-sans-serif", "system-ui"],
      },
      fontSize: {
        h1: ["2.25rem", { lineHeight: "2.5rem", fontWeight: "700" }], // 36px
        h2: ["1.875rem", { lineHeight: "2.25rem", fontWeight: "700" }], // 30px
        body: ["1rem", { lineHeight: "1.5rem", fontWeight: "400" }], // 16px
        caption: ["0.875rem", { lineHeight: "1.25rem", fontWeight: "400" }], // 14px
      },
      spacing: {
        xs: "0.25rem",   // 4px
        sm: "0.5rem",    // 8px
        md: "1rem",      // 16px
        lg: "1.5rem",    // 24px
        xl: "2rem",      // 32px
        "2xl": "4rem",   // 64px
      },
    },
  },
  plugins: [],
} satisfies Config;