import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const loadedClientId = env.VITE_GOOGLE_CLIENT_ID || "";
  
  console.log(
    `[Receipto Debug] Google clientId loaded: ${loadedClientId ? "yes" : "no"}${
      loadedClientId ? ` (${loadedClientId})` : ""
    }`
  );

  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: 5173
    }
  };
});
