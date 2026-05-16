// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// import path from "path";

// export default defineConfig(({ mode }) => ({
//   plugins: [react()],
//   resolve: {
//     alias: {
//       "@": path.resolve(import.meta.dirname, "client", "src"),
//       "@shared": path.resolve(import.meta.dirname, "shared"),
//       "@assets": path.resolve(import.meta.dirname, "attached_assets"),
//     },
//   },
//   root: path.resolve(import.meta.dirname, "client"),
//   build: {
//     outDir: path.resolve(import.meta.dirname, "dist/public"),
//     emptyOutDir: true,
//     target: "es2020",
//     chunkSizeWarningLimit: 1000,
//     rollupOptions: {
//       output: {
//         manualChunks: {
//           "vendor-react": ["react", "react-dom"],
//           "vendor-query": ["@tanstack/react-query"],
//           "vendor-ui": ["@radix-ui/react-dialog", "@radix-ui/react-select", "@radix-ui/react-tooltip", "lucide-react"],
//           "vendor-forms": ["react-hook-form", "@hookform/resolvers", "zod"],
//         },
//       },
//     },
//   },
//   server: {
//     proxy: {
//       "/api": {
//         target: "https://api.localgoakayaking.com",
//         changeOrigin: true,
//         secure: true,
//       },
//       "/uploads": {
//         target: "https://api.localgoakayaking.com",
//         changeOrigin: true,
//         secure: true,
//       },
//     },
//     fs: {
//       strict: false,
//     },
//   },
// }));


import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: {
    // In production the frontend (cPanel) and backend (VPS) are on different origins.
    // Hardcode the API base so every fetch goes to the right server.
    // In dev the Vite proxy below handles /api/* so this is only used for production builds.
    "import.meta.env.VITE_API_BASE": mode === "production"
      ? JSON.stringify("https://api.localgoakayaking.com")
      : JSON.stringify(""),
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    target: "es2020",
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-ui": ["@radix-ui/react-dialog", "@radix-ui/react-select", "@radix-ui/react-tooltip", "lucide-react"],
          "vendor-forms": ["react-hook-form", "@hookform/resolvers", "zod"],
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "https://api.localgoakayaking.com",
        changeOrigin: true,
        secure: true,
      },
      "/uploads": {
        target: "https://api.localgoakayaking.com",
        changeOrigin: true,
        secure: true,
      },
    },
    fs: {
      strict: false,
    },
  },
}));
