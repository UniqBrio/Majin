import { NextResponse } from "next/server"
import { MongoClient, ServerApiVersion } from "mongodb"

require('dotenv').config({ path: '.env.local' })
// This would be replaced with the actual MongoDB connection string from environment variables
const uri = process.env.MONGODB_URI || ""

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
})

export async function POST(request: Request) {
  try {
    // Connect the client to the server
    await client.connect()

    // Parse the request body
    const body = await request.json()

    // Get the database and collection
    const database = client.db("majin")
    const collection = database.collection("results")

    // Insert the document
    const result = await collection.insertOne(body)

    return NextResponse.json({
      success: true,
      insertedId: result.insertedId,
    })
  } catch (error) {
    console.error("MongoDB error:", error)
    return NextResponse.json({ success: false, error: "Failed to save to database" }, { status: 500 })
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close()
  }
}

export async function GET() {
  try {
    // Connect the client to the server
    await client.connect()

    // Get the database and collection
    const database = client.db("majin")
    const collection = database.collection("results")

    // Find all documents
    const results = await collection.find({}).toArray()

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error("MongoDB error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch from database" }, { status: 500 })
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close()
  }
}
