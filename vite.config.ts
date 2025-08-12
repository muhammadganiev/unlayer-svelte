import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig(({ mode }) => {
  const isDemo = mode === "demo";
  return {
    plugins: [svelte()],
    build: isDemo
      ? {
          outDir: "dist-demo",
          rollupOptions: {
            input: "index.html",
          },
        }
      : {
          lib: {
            entry: "src/lib/UnlayerEditor.svelte",
            name: "UnlayerSvelte",
            fileName: (format) => `unlayer-svelte.${format}.js`,
            formats: ["es", "umd"],
          },
          sourcemap: true,
          emptyOutDir: true,
        },
  };
});
