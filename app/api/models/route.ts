import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

// Replace with your actual MongoDB connection string (from environment variables)
const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Please add your Mongo URI to .env.local");
}

const client = new MongoClient(uri);

async function connectToDatabase() {
  try {
    await client.connect();
    return client.db("Majin"); // Replace with your database name
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const { name, provider, apiKey, type, description, active } = await request.json();

    if (!name || !provider || !apiKey || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = await connectToDatabase();
    const modelsCollection = db.collection("models"); // Assuming your collection is named "models"

    const result = await modelsCollection.insertOne({
      name,
      provider,
      apiKey, // Consider encrypting this in a production environment
      type,
      description,
      active: active ?? true, // Default to active if not provided
    });

    return NextResponse.json({ message: "Model added successfully", id: result.insertedId }, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/models:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  } finally {
    await client.close();
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...updateData } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Missing model ID" }, { status: 400 });
    }

    const db = await connectToDatabase();
    const modelsCollection = db.collection("models");

    // Prevent updating the ID itself
    delete updateData._id;

    const result = await modelsCollection.updateOne(
      { _id: new ObjectId(id) }, // Assuming your IDs are stored as ObjectIds
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Model updated successfully" });
  } catch (error: any) {
    console.error("Error in PUT /api/models:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  } finally {
    await client.close();
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Missing model ID" }, { status: 400 });
    }

    const db = await connectToDatabase();
    const modelsCollection = db.collection("models");

    const result = await modelsCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Model deleted successfully" });
  } catch (error: any) {
    console.error("Error in DELETE /api/models:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  } finally {
    await client.close();
  }
}

export async function GET() {
    try {
        const db = await connectToDatabase();
        const modelsCollection = db.collection("models");

        const models = await modelsCollection.find().toArray();

        // Convert _id to string for client-side compatibility
    const formattedModels = models.map(model => ({
      ...model,
      id: model._id.toString(),
      _id: undefined,
    }));

    return NextResponse.json(formattedModels);
  } catch (error: any) {
        console.error("Error in GET /api/models:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

import { ObjectId } from 'mongodb';

// Add this at the end of the file or in a separate utility file if you prefer
if (typeof (global as any)._mongoClientPromise === 'undefined') {
  (global as any)._mongoClientPromise = client.connect();
}

export const mongoClientPromise = (global as any)._mongoClientPromise;