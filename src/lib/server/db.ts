import { MONGODB_URI } from "$env/static/private"
import { MongoClient, type Collection } from "mongodb"

/** Shape of a sync document stored in MongoDB. */
interface SyncDocument {
  _id: string
  blob: string
  updatedAt: string
}

let client: MongoClient | null = null

async function getClient(): Promise<MongoClient> {
  if (!client) {
    client = new MongoClient(MONGODB_URI)
    await client.connect()
  }
  return client
}

/** Returns the syncs collection, connecting to MongoDB if needed. */
export async function getSyncsCollection(): Promise<Collection<SyncDocument>> {
  const mongoClient = await getClient()
  return mongoClient.db("accountly").collection<SyncDocument>("syncs")
}
