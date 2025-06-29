import { defineConfig } from "vite"
import { resolve } from "path"

export default defineConfig({
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "./index.html"),
        vantage: resolve(__dirname, "./vantage.html"),
        canvas: resolve(__dirname, "./demo/canvas.html"),
        credits: resolve(__dirname, "./demo/credits.html"),
        expensive: resolve(__dirname, "./demo/expensive.html"),
        grid: resolve(__dirname, "./demo/grid.html"),
        old: resolve(__dirname, "./demo/old.html"),
      },
    },
  },
})
