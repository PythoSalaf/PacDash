import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), tailwindcss()],

    server: {
      proxy: {
        "/elfa-api": {
          target: "https://api.elfa.ai",
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/elfa-api/, "/v2"),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              proxyReq.setHeader("x-elfa-api-key", env.VITE_ELFA_API_KEY ?? "");
            });
          },
        },
      },
    },
  };
});
