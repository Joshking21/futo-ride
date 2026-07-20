/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{html,js,jsx,ts,tsx,mdx}",
    "./components/**/*.{html,js,jsx,ts,tsx,mdx}",
    "./utils/**/*.{html,js,jsx,ts,tsx,mdx}",
    "./*.{html,js,jsx,ts,tsx,mdx}",
    "./src/**/*.{html,js,jsx,ts,tsx,mdx}",
  ],
  presets: [require("nativewind/preset")],
  safelist: [
    {
      pattern:
        /(bg|border|text|stroke|fill)-(primary|secondary|tertiary|error|success|warning|info|typography|outline|background|indicator)-(0|50|100|200|300|400|500|600|700|800|900|950|white|gray|black|error|warning|muted|success|info|light|dark|primary)/,
    },
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#059669", // True Emerald Green (Main brand color for buttons, active states)
          50: "#ecfdf5", // Softest mint tint for subtle alerts/background accents
          100: "#d1fae5", // Light selection states
          200: "#a7f3d0", // Inactive badges
          300: "#6ee7b7",
          400: "#34d399",
          500: "#059669", // Emerald Main
          600: "#047857", // Darker emerald for pressed states
          700: "#065f46",
          800: "#064e3b",
          900: "#022c22", // Very deep forest green
          950: "#011c15",
        },
        secondary: {
          DEFAULT: "#4b5563", // Slate neutral-gray for subtle secondary elements
          500: "#4b5563",
        },
        tertiary: {
          DEFAULT: "#0f766e", // Deep Teal/Mint accent for highlights or special statuses (e.g., driver nearby)
          500: "#0f766e",
        },
        error: {
          DEFAULT: "#dc2626", // Vibrant, high-visibility red for cancellation/errors
          500: "#dc2626",
        },
        "primary-container": "#065f46", // Deep emerald backing card
        "on-primary": "#ffffff", // Text riding on top of your primary green buttons
        "on-primary-container": "#a7f3d0", // Light mint text resting on deep emerald cards
        "inverse-primary": "#a7f3d0",
        "secondary-container": "#e5e7eb",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#374151",
        "tertiary-container": "#115e59",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#99f6e4",
        "error-container": "#fee2e2",
        "on-error": "#ffffff",
        "on-error-container": "#991b1b",

        // 🏢 Fixed System Neutrals: Shifted from deep blue slates to modern warm greens/grays
        background: "#fcfdfc", // Clean, bright off-white screen background
        "on-background": "#0f172a", // High contrast text for supreme legibility
        surface: "#fcfdfc",
        "surface-dim": "#e2e8f0", // Card borders and dividing rules
        "surface-bright": "#f8fafc",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f8fafc",
        "surface-container": "#f1f5f9", // Standard neutral structural layout background
        "surface-container-high": "#e2e8f0", // Layered popups/drawers
        "surface-container-highest": "#cbd5e1",
        "on-surface": "#0f172a",
        "on-surface-variant": "#475569",
        "inverse-surface": "#1e293b",
        "inverse-on-surface": "#f8fafc",

        outline: "#64748b",
        "outline-variant": "#cbd5e1",
        "surface-tint": "#059669",
        "primary-fixed": "#d1fae5",
        "primary-fixed-dim": "#a7f3d0",
        "on-primary-fixed": "#064e3b",
        "on-primary-fixed-variant": "#047857",
        "secondary-fixed": "#e5e7eb",
        "secondary-fixed-dim": "#d1d5db",
        "on-secondary-fixed": "#111827",
        "on-secondary-fixed-variant": "#374151",
        "tertiary-fixed": "#ccfbf1",
        "tertiary-fixed-dim": "#99f6e4",
        "on-tertiary-fixed": "#115e59",
        "on-tertiary-fixed-variant": "#0f766e",
        "surface-variant": "#e2e8f0",
        success: "#10b981",
        warning: "#f59e0b",
      },
      fontFamily: {
        heading: undefined,
        body: undefined,
        mono: undefined,
        jakarta: ["var(--font-plus-jakarta-sans)"],
        roboto: ["var(--font-roboto)"],
        code: ["var(--font-source-code-pro)"],
        inter: ["var(--font-inter)"],
        "space-mono": ["var(--font-space-mono)"],
      },
      fontWeight: {
        extrablack: "950",
      },
      fontSize: {
        "2xs": "10px",
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "headline-md": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "label-sm": ["12px", { lineHeight: "16px", fontWeight: "500" }],
        "headline-lg-mobile": [
          "28px",
          { lineHeight: "36px", fontWeight: "700" },
        ],
        "headline-lg": [
          "32px",
          { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "700" },
        ],
        "label-md": ["14px", { lineHeight: "20px", fontWeight: "600" }],
        "headline-xl": [
          "40px",
          { lineHeight: "48px", letterSpacing: "-0.02em", fontWeight: "700" },
        ],
        "headline-sm": ["20px", { lineHeight: "26px", fontWeight: "600" }],
        "action-lg": ["16px", { lineHeight: "24px", fontWeight: "600" }],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px",
        sm: "0.25rem",
        md: "0.75rem",
        "xl-2xl": "1.5rem",
      },
      spacing: {
        xl: "32px",
        lg: "24px",
        unit: "4px",
        gutter: "16px",
        "margin-mobile": "20px",
        "margin-desktop": "40px",
        xs: "4px",
        sm: "8px",
        md: "16px",
        "stack-lg": "24px",
        "stack-sm": "8px",
        "stack-md": "16px",
        "container-margin": "20px",
        "touch-target": "48px",
      },
      boxShadow: {
        "hard-1": "-2px 2px 8px 0px rgba(38, 38, 38, 0.20)",
        "hard-2": "0px 3px 10px 0px rgba(38, 38, 38, 0.20)",
        "hard-3": "2px 2px 8px 0px rgba(38, 38, 38, 0.20)",
        "hard-4": "0px -3px 10px 0px rgba(38, 38, 38, 0.20)",
        "hard-5": "0px 2px 10px 0px rgba(38, 38, 38, 0.10)",
        "soft-1": "0px 0px 10px rgba(38, 38, 38, 0.1)",
        "soft-2": "0px 0px 20px rgba(38, 38, 38, 0.2)",
        "soft-3": "0px 0px 30px rgba(38, 38, 38, 0.1)",
        "soft-4": "0px 0px 40px rgba(38, 38, 38, 0.1)",
      },
    },
  },
};
