/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b1118",
        panel: "rgba(255,255,255,.06)",
        line: "rgba(255,255,255,.10)",
        text: "#e6f0ff",
        muted: "#9fb1d1",
        accent: "#69b3ff",
        accent2: "#22d3ee"
      },
      borderRadius: { xl: "18px", lg: "16px", md: "12px" },
      boxShadow: { glass: "0 10px 30px rgba(0,0,0,.35)" },
      // Fluid typography and spacing
      fontSize: {
        'fluid-xs': 'clamp(0.75rem, 1.2vw, 0.875rem)',
        'fluid-sm': 'clamp(0.875rem, 1.4vw, 1rem)',
        'fluid-base': 'clamp(1rem, 1.6vw, 1.125rem)',
        'fluid-lg': 'clamp(1.125rem, 2vw, 1.25rem)',
        'fluid-xl': 'clamp(1.25rem, 2.5vw, 1.5rem)',
        'fluid-2xl': 'clamp(1.5rem, 3vw, 1.875rem)',
        'fluid-3xl': 'clamp(1.875rem, 4vw, 2.25rem)',
        'fluid-4xl': 'clamp(2.25rem, 5vw, 3rem)',
        'fluid-5xl': 'clamp(3rem, 6vw, 3.75rem)',
        'fluid-6xl': 'clamp(3.75rem, 8vw, 4.5rem)',
        // Responsive typography
        'responsive-xs': 'clamp(0.75rem, 1.2vw, 0.875rem)',
        'responsive-sm': 'clamp(0.875rem, 1.4vw, 1rem)',
        'responsive-base': 'clamp(1rem, 1.6vw, 1.125rem)',
        'responsive-lg': 'clamp(1.125rem, 2vw, 1.25rem)',
        'responsive-xl': 'clamp(1.25rem, 2.5vw, 1.5rem)',
        'responsive-2xl': 'clamp(1.5rem, 3vw, 1.875rem)',
        'responsive-3xl': 'clamp(1.875rem, 4vw, 2.25rem)',
        'responsive-4xl': 'clamp(2.25rem, 5vw, 3rem)',
        'responsive-5xl': 'clamp(3rem, 6vw, 3.75rem)',
        'responsive-6xl': 'clamp(3.75rem, 8vw, 4.5rem)',
      },
      spacing: {
        'fluid-xs': 'clamp(0.5rem, 1vw, 0.75rem)',
        'fluid-sm': 'clamp(0.75rem, 1.5vw, 1rem)',
        'fluid-md': 'clamp(1rem, 2vw, 1.5rem)',
        'fluid-lg': 'clamp(1.5rem, 3vw, 2rem)',
        'fluid-xl': 'clamp(2rem, 4vw, 3rem)',
        'fluid-2xl': 'clamp(3rem, 6vw, 4rem)',
      },
      screens: {
        'xs': '375px',
        '3xl': '1920px',
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '1.5rem',
          lg: '2rem',
          xl: '3rem',
          '2xl': '4rem',
        },
      },
    }
  },
  plugins: []
}