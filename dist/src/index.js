import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import motorcycleRoutes from "./routes/motorcycles.js";
import bookingRoutes from "./routes/bookings.js";
import reviewRoutes from "./routes/reviews.js";
// Load environment variables
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
// Enable CORS with default settings (allow all origins)
app.use(cors());
// Body parser
app.use(express.json());
// Main Welcome Endpoint
app.get("/", (req, res) => {
    res.json({
        message: "Welcome to the Motorcycle Rental Web App API 🏍️",
        status: "Healthy",
        timestamp: new Date().toISOString(),
        endpoints: {
            auth: "/api/auth",
            motorcycles: "/api/motorcycles",
            bookings: "/api/bookings",
            reviews: "/api/reviews",
        },
    });
});
// Register routers
app.use("/api/auth", authRoutes);
app.use("/api/motorcycles", motorcycleRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
// 404 Route handler
app.use((req, res) => {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.url}` });
});
// Global error handler
app.use((err, req, res, next) => {
    console.error("Unhandled API Error:", err);
    res.status(err.status || 500).json({
        error: err.message || "Internal server error",
    });
});
// Listen on configured port
app.listen(port, () => {
    console.log(`[Server] Motorcycle app backend is running on http://localhost:${port} 🚀`);
});
//# sourceMappingURL=index.js.map