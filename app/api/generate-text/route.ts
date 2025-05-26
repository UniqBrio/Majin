import { NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import OpenAI from 'openai'; // Example: Using OpenAI
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai"; // For Gemini
import Anthropic from '@anthropic-ai/sdk'; // For Anthropic

// Ensure MONGODB_URI is set
const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("Please add your Mongo URI to .env.local");
}

// API keys are assumed to be stored with the model in MongoDB (modelDetails.apiKey)
// For Gemini, you might also need to set GOOGLE_API_KEY in your .env if not using the one from modelDetails

const client = new MongoClient(uri);

async function getDb() {
  await client.connect();
  return client.db("Majin"); // Replace with your database name
}

// --- Provider-specific generation functions ---

class NotImplementedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotImplementedError";
  }
}

async function generateWithOpenAI(modelDetails: any, prompt: string): Promise<string | undefined> {
  const openai = new OpenAI({
    apiKey: modelDetails.apiKey,
  });
  const chatCompletion = await openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: modelDetails.name, // e.g., "gpt-3.5-turbo", "gpt-4"
  });
  return chatCompletion.choices[0]?.message?.content ?? undefined;
}

async function generateWithGemini(modelDetails: any, prompt: string): Promise<string | undefined> {
  const genAI = new GoogleGenerativeAI(modelDetails.apiKey);
  const geminiModel = genAI.getGenerativeModel({ model: modelDetails.name }); // e.g., "gemini-pro"

  const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  ];

  const result = await geminiModel.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    safetySettings,
  });
  const response = result.response;
  return response.text();
}

async function generateWithDeepSeek(modelDetails: any, prompt: string): Promise<string | undefined> {
  // DeepSeek offers an OpenAI-compatible API.
  const deepseekApiUrl = "https://api.deepseek.com/chat/completions"; // Verify this endpoint
  const response = await fetch(deepseekApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${modelDetails.apiKey}`,
    },
    body: JSON.stringify({
      model: modelDetails.name, // e.g., "deepseek-chat", "deepseek-coder"
      messages: [{ role: "user", content: prompt }],
      // Add other parameters like temperature, max_tokens if needed
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})); // Graceful JSON parsing
    console.error("DeepSeek API Error:", response.status, response.statusText, errorData);
    throw new Error(`DeepSeek API request failed: ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
  }
  const data = await response.json();
  return data.choices[0]?.message?.content;
}

async function generateWithAnthropic(modelDetails: any, prompt: string): Promise<string | undefined> {
  const anthropic = new Anthropic({
    apiKey: modelDetails.apiKey,
  });

  try {
    const response = await anthropic.messages.create({
      model: modelDetails.name, // e.g., "claude-3-opus-20240229", "claude-2.1"
      max_tokens: 1024, // Adjust as needed, or make configurable
      messages: [{ role: 'user', content: prompt }],
    });

    // Assuming the response content is an array and the first item is a text block
    if (response.content && response.content.length > 0 && response.content[0].type === 'text') {
      return response.content[0].text;
    }
    return undefined; // Or handle other content types if necessary
  } catch (error) {
    console.error("Anthropic API Error:", error);
    throw new Error(`Anthropic API request failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function generateWithGrok(modelDetails: any, prompt: string): Promise<string | undefined> {
  // --- IMPORTANT: Grok API Integration Placeholder ---
  // As of the last update, a general public API for Grok might not be widely available
  // or may have specific access requirements.
  // The following is a TEMPLATE. You MUST replace the `grokApiUrl`,
  // and potentially adjust the headers, request body structure, and response parsing
  // according to the official Grok API documentation you have.

  const grokApiUrl = "https://api.x.ai/v1/chat/completions"; // <--- !!! REPLACE THIS WITH THE ACTUAL GROK API ENDPOINT !!!
  // const grokApiUrl = process.env.GROK_API_URL; // Consider using an environment variable

  console.log(`Attempting to generate with Grok using model: ${modelDetails.name}`);

  const response = await fetch(grokApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${modelDetails.apiKey}`, // Assuming Bearer token auth
      // Add any other specific headers Grok API might require
    },
    body: JSON.stringify({
      model: modelDetails.name, // Ensure this is the correct model identifier for Grok
      messages: [{ role: "user", content: prompt }],
      // Add other parameters Grok might support (e.g., temperature, max_tokens, stream)
      // "stream": false, // Explicitly set if needed, default is usually non-streaming
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: "Failed to parse error response from Grok API" } }));
    console.error("Grok API Error:", response.status, response.statusText, errorData);
    throw new Error(`Grok API request failed: ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();

  // --- Adjust response parsing based on actual Grok API ---
  // This assumes a similar structure to OpenAI's API.
  // You MIGHT need to change `data.choices[0]?.message?.content`
  const completion = data.choices?.[0]?.message?.content || data.completion; // Example fallback

  if (!completion) {
    console.error("Grok API Error: No content found in response", data);
    throw new Error("Grok API returned an unexpected response structure or no content.");
  }

  return completion;
}

export async function POST(request: Request) {
  try {
    const { modelName, prompt } = await request.json();

    if (!modelName || !prompt) {
      return NextResponse.json({ error: "Missing modelName or prompt" }, { status: 400 });
    }

    const db = await getDb();
    const modelsCollection = db.collection("models");

    // Fetch the model details from MongoDB
    // Assuming modelName is unique. If not, you'd pass modelId from the frontend.
    const modelDetails = await modelsCollection.findOne({ name: modelName, active: true });

    if (!modelDetails) {
      return NextResponse.json({ error: "Model not found or not active" }, { status: 404 });
    }

    if (!modelDetails.apiKey) {
      return NextResponse.json({ error: "API key for the selected model is missing" }, { status: 500 });
    }

    let completion: string | undefined;
    const provider = modelDetails.provider.toLowerCase();

    const providerHandlers: {
      [key: string]: (details: any, p: string) => Promise<string | undefined>;
    } = {
      "openai": generateWithOpenAI,
      "gemini": generateWithGemini,
      "deepseek": generateWithDeepSeek,
      "anthropic": generateWithAnthropic,
      "grok": generateWithGrok,
    };

    const handler = providerHandlers[provider];

    if (handler) {
      completion = await handler(modelDetails, prompt);
    } else {
      return NextResponse.json({ error: `Provider '${modelDetails.provider}' not supported.` }, { status: 501 });
    }

    if (!completion) {
        return NextResponse.json({ error: "Failed to generate content from LLM" }, { status: 500 });
    }

    return NextResponse.json({ completion });

  } catch (error: any) {
    console.error("Error in POST /api/generate-text:", error);
    if (error instanceof NotImplementedError) {
      return NextResponse.json({ error: error.message }, { status: 501 });
    }
    // Avoid sending detailed internal errors to the client in production
    return NextResponse.json({ error: "An internal error occurred during content generation." }, { status: 500 });
  } finally {
    // Consider connection pooling strategies for production to avoid opening/closing on every request
    await client.close();
  }
}