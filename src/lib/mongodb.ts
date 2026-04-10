import mongoose from "mongoose";

const rawUri = process.env.MONGODB_URI;
const MONGODB_URI = typeof rawUri === "string" ? rawUri.trim() : undefined;

const URI_PLACEHOLDERS = ["<db_password>", "<password>", "<your_password>"];

function uriContainsPlaceholder(uri: string): boolean {
  return URI_PLACEHOLDERS.some((p) => uri.includes(p));
}

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached = global.mongooseCache ?? { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase() {
  if (!MONGODB_URI) {
    throw new Error(
      "MongoDB connection not configured: set MONGODB_URI in .env.local."
    );
  }

  if (uriContainsPlaceholder(MONGODB_URI)) {
    throw new Error(
      "MongoDB connection failed: MONGODB_URI still contains a template placeholder such as <db_password>. Replace it with your Atlas database user password (URL-encode special characters)."
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI);
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    cached.conn = null;
    throw err;
  }
}
