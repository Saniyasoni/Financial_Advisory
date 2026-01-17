import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import budgetRoutes from "./routes/budgetRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import goalRoutes from "./routes/goalRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";
import insightsRoutes from "./routes/insightsRoutes.js";
import ingestionRoutes from "./routes/ingestionRoutes.js";
import devInboxRoutes from "./routes/devInboxRoutes.js";
import merchantRoutes from "./routes/merchantRoutes.js";




// Load env & connect DB
dotenv.config();
connectDB();

// Load Cron jobs
import "./cron/scheduler.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/insights", insightsRoutes);
app.use("/api/ingest", ingestionRoutes);
app.use("/api/dev", devInboxRoutes);
app.use("/api/merchant", merchantRoutes);




// Base route
app.get("/", (req, res) => {
  res.send("Smart Financial Advisor API running");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
