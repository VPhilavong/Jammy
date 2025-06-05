import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        spotify: ["Circular", "Helvetica Neue", "Arial", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Earthy palette with expanded variants
        cream: {
          DEFAULT: "#fefae0",
          50: "#fefdfb",
          100: "#fefae0",
          200: "#fef7c3",
          300: "#feef86",
          400: "#fde047",
          500: "#facc15",
          600: "#eab308",
          700: "#ca8a04",
          800: "#a16207",
          900: "#854d0e",
          dark: "#f7f3d0",
        },
        sage: {
          DEFAULT: "#606c38",
          50: "#f6f7f1",
          100: "#eaede1",
          200: "#d6ddc4",
          300: "#b8c59e",
          400: "#97a572",
          500: "#7a8a4a",
          600: "#606c38",
          700: "#4a532d",
          800: "#3d4327",
          900: "#353a24",
          light: "#7a8a4a",
          dark: "#4a5228",
        },
        "dark-green": {
          DEFAULT: "#283618",
          50: "#f4f6f1",
          100: "#e6eadd",
          200: "#ced6be",
          300: "#aebb95",
          400: "#8ba06c",
          500: "#6d824e",
          600: "#52633a",
          700: "#414d2e",
          800: "#373f27",
          900: "#283618",
        },
        gold: {
          DEFAULT: "#dda15e",
          50: "#fdf8f3",
          100: "#faeee1",
          200: "#f4dcc1",
          300: "#ecc596",
          400: "#e3a869",
          500: "#dda15e",
          600: "#ca7a3e",
          700: "#a85f34",
          800: "#884d31",
          900: "#6e402a",
          light: "#e8b878",
          dark: "#c4944a",
        },
        copper: {
          DEFAULT: "#bc6c25",
          50: "#fdf6f0",
          100: "#faebdb",
          200: "#f5d4b7",
          300: "#eeb489",
          400: "#e4915a",
          500: "#dc7238",
          600: "#ce582d",
          700: "#bc6c25",
          800: "#954726",
          900: "#773c22",
          light: "#d17a39",
          dark: "#a85511",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
