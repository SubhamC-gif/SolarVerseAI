import { definePlugin } from "nitro";

export default definePlugin((app) => {
  app.hooks.hook("response", (response, event) => {
    response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
    response.headers.set("Cross-Origin-Embedder-Policy", "credentialless");
    response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
    if (event.url.pathname === "/models/panel-fault.onnx") {
      response.headers.set("Content-Type", "application/octet-stream");
    }
  });
});
