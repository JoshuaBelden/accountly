import { MONGODB_URI } from "$env/static/private"
import { MongoClient, type Collection } from "mongodb"

/** Shape of a sync document stored in MongoDB. */
interface SyncDocument {
  _id: string
  blob: string
  updatedAt: string
}

let client: MongoClient | null = null

function getClient(): MongoClient {
  if (!client) {
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
    })
  }
  return client
}

/** Returns the syncs collection. The driver connects lazily on first operation. */
export function getSyncsCollection(): Collection<SyncDocument> {
  return getClient().db("accountly").collection<SyncDocument>("syncs")
}
