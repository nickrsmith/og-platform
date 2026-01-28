import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./shared"),
      "buffer": "buffer",
      "crypto": "crypto-browserify",
      "stream": "stream-browserify",
    },
    dedupe: ["@web3auth/modal", "buffer"],
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
  },
  ssr: {
    noExternal: ['@web3auth/modal', 'buffer', 'process'],
  },
  optimizeDeps: {
    exclude: [],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      },
      target: 'esnext',
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
      // CRITICAL: Don't externalize buffer - bundle it
      external: (id) => {
        // Never externalize buffer, process, or any node polyfills
        const nodePolyfills = ['buffer', 'process', 'util', 'stream', 'crypto', 'events'];
        if (nodePolyfills.some(polyfill => id === polyfill || id.startsWith(polyfill + '/'))) {
          return false; // Bundle these, don't externalize
        }
        // Allow other externals if needed, but default to bundling
        return false;
      },
    },
  },
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  server: {
    port: 5000,
    host: true,
    proxy: {
      "/api": {
        target: process.env.VITE_API_BASE_URL || "http://localhost:3002",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, "/api/v1"),
      },
    },
  },
});
