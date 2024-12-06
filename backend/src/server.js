import "../db/mongoose.js";
import express from "express";
import rateLimit from "express-rate-limit";
import authRoutes from "../routers/auth.js";
import filterRoutes from "../routers/filter.js";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const router = express.Router();
const app = express();
const PORT = process.env.PORT || 5007;

const globalRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: false }));

router.get("/", (req, res) => {
  res.send("Hello ProdDev, it's been a while!");
});

app.use("/api", authRoutes);
app.use("/api", filterRoutes);

app.use(globalRateLimiter);

app.use("/", router);

app.listen(PORT, () => {
  console.log(`Server started on ${PORT}`);
});
