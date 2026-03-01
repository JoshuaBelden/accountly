/**
 * Removes route-specific function destinations from the Vercel build output config
 * so all API routes fall through to the catchall function.
 *
 * adapter-vercel creates symlinks for named routes (e.g. /api/sync/[id].func),
 * but Vercel's deployment doesn't resolve these symlinks correctly at runtime.
 * Routing everything through the catchall avoids this issue entirely.
 */
import { readFileSync, writeFileSync } from "fs"

const CONFIG_PATH = ".vercel/output/config.json"

const config = JSON.parse(readFileSync(CONFIG_PATH, "utf-8"))

const before = config.routes.length

config.routes = config.routes.filter((route) => {
  const dest = route.dest ?? ""
  // Remove routes that point to named function symlinks (not the catchall)
  if (dest.startsWith("/api/")) return false
  return true
})

const after = config.routes.length
writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2))

console.log(`fix-vercel-routes: removed ${before - after} route(s), routing API requests through catchall`)
