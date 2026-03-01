import { sveltekit } from "@sveltejs/kit/vite"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [sveltekit()],
  build: {
    rollupOptions: {
      external: [
        "kerberos",
        "mongodb-client-encryption",
        "snappy",
        "@aws-sdk/credential-providers",
        "@mongodb-js/zstd",
        "gcp-metadata",
        "socks",
      ],
    },
  },
})
