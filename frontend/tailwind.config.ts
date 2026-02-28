export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,jsx,js,jsx,js}"],
  theme: {
    extend: {
      screens: {
        tablet: "768px",
        laptop: "1024px",
      },
      colors: {
        // text and surfaces
        primary: "rgb(var(--primary) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        muted_2: "rgb(var(--muted_2) / <alpha-value>)",     
        border: "rgb(var(--border) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        surface_2: "rgb(var(--surface_2) / <alpha-value>)",
        background: "rgb(var(--background) / <alpha-value>)",

        // states / accents
        accent: "rgb(var(--accent) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
        danger_surface: "rgb(var(--danger_surface) / <alpha-value>)",
        success: "rgb(var(--success) / <alpha-value>)",
        success_surface: "rgb(var(--success_surface) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",

        low: "rgb(var(--low) / <alpha-value>)",
        low_surface: "rgb(var(--low_surface) / <alpha-value>)",

        high: "rgb(var(--high) / <alpha-value>)",
        high_surface: "rgb(var(--high_surface) / <alpha-value>)",

        // form
        submit: "rgb(var(--submit) / <alpha-value>)",
        required: "rgb(var(--required) / <alpha-value>)",
        cancel: "rgb(var(--cancel) / <alpha-value>)",

        // notes
        note: "rgb(var(--note) / <alpha-value>)",
        note_surface: "rgb(var(--note_surface) / <alpha-value>)",

        // alerts
        alert_outline: "rgb(var(--alert_outline) / <alpha-value>)",
        alert_text: "rgb(var(--alert_text) / <alpha-value>)",
        alert_muted: "rgb(var(--alert_muted) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui"],
        helvetica: ["Helvetica Neue", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
}
