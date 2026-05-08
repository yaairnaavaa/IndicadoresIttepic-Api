import mongoose from "mongoose";
import config from "./config.js";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.dburi);
    console.log(`Connected to MongoDB: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};