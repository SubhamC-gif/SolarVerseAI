import { defineConfig } from "nitro";

export default defineConfig({
  routeRules: {
    "/**": {
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "credentialless",
        "Cross-Origin-Resource-Policy": "same-origin",
      },
    },
    "/assets/**": { headers: { "Cache-Control": "public, max-age=31536000, immutable" } },
    "/ort/**": { headers: { "Cache-Control": "public, max-age=86400" } },
    "/models/**": { headers: { "Cache-Control": "public, max-age=86400" } },
  },
});
