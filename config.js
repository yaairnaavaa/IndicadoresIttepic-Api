import dotenv from "dotenv";
dotenv.config();

export default {
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 3000,
  dburi: process.env.DB_URI || "mongodb://localhost:27017/metrics-db",
  secret: process.env.SECRET || "secret",
};
