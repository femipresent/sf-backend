const mongoose = require("mongoose");
const path = require("path");

// load .env from project root (mgsmicroservices folder)
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

async function connectDB() {
  try {
    const uri = process.env.DBSTRING || process.env.MONGODB_URI;
    if (!uri) {
      console.warn("No DB connection string found in environment; skipping mongoose.connect().");
      return;
    }

    await mongoose.connect(uri);
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed", error);
    // rethrow so callers can decide what to do
    throw error;
  }
}

module.exports = connectDB;
