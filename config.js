import dotenv from "dotenv";
dotenv.config();

export default {
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 3000,
  dburi: process.env.DB_URI || "mongodb+srv://iryanavahe_db_user:vUztvQLKk3k56SCn@indicadoresittepic.3aqav9x.mongodb.net/metrics-db?retryWrites=true&w=majority",
  secret: process.env.SECRET || "secret",

};
