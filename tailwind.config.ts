import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          primary: "#1535D4",
          dark: "#0f2bb0",
          lime: "#C8F400",
          limeText: "#7FA000",
          limeTextDark: "#5f7a00",
          muted: "#373A4A",
          mutedDark: "#171a22",
          card: "#FFFFFF",
          border: "#E6E8EC",
          ink: "#14161B",
          ink2: "#8A8F99",
          star: "#E8A400",
          wa: "#25D366",
        },
      },
      fontFamily: {
        sans: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
        display: ['var(--font-space)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;