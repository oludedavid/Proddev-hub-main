import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const { DB_CONNECTION_STRING, DB_USER, DB_PASSWORD } = process.env;

mongoose
  .connect(DB_CONNECTION_STRING, {
    auth: { username: DB_USER, password: DB_PASSWORD },
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to the database");
  })
  .catch((err) => {
    console.error("Error connecting to the database", err);
  });
