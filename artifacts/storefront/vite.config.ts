import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // This allows you to use @/components instead of ../../../components
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // This solves the "Can't resolve original location of error" you saw earlier
    sourcemap: false,
    // Ensures the build goes to the folder Vercel expects
    outDir: 'dist',
  },
  server: {
    // This satisfies the PORT requirement we saw in the logs
    port: Number(process.env.PORT) || 3000,
  }
})
