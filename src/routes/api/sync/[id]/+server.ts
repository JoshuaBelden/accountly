import { getSyncsCollection } from "$lib/server/db"
import { error, json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"

export const GET: RequestHandler = async ({ params }) => {
  try {
    const collection = await getSyncsCollection()
    const doc = await collection.findOne({ _id: params.id })
    if (!doc) {
      return json({ blob: null, updatedAt: null })
    }
    return json({ blob: doc.blob, updatedAt: doc.updatedAt })
  } catch (err) {
    console.error("[sync] GET failed:", err)
    throw error(500, "Failed to fetch sync data")
  }
}

export const POST: RequestHandler = async ({ params, request }) => {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    throw error(400, "Invalid request body")
  }

  if (!body || typeof body !== "object" || typeof (body as Record<string, unknown>).blob !== "string") {
    throw error(400, "Invalid request body")
  }

  const blob = (body as Record<string, string>).blob

  try {
    const collection = await getSyncsCollection()
    await collection.updateOne(
      { _id: params.id },
      { $set: { blob, updatedAt: new Date().toISOString() } },
      { upsert: true },
    )
    return json({ ok: true })
  } catch (err) {
    console.error("[sync] POST failed:", err)
    throw error(500, "Failed to save sync data")
  }
}
