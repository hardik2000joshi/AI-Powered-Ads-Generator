const express = require("express");
const cors = require("cors");
const {clerkMiddleware} = require("@clerk/express")
const app = express();
app.use(cors({
    origin: process.env.FRONTEND_URL,
      allowedHeaders: [
            "Content-Type",
            "Authorization",
            "Accept",
        ],
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
}));
app.use(clerkMiddleware());
app.use(express.json());
const authRoutes = require("./routes/authRoutes");
const createRoutes = require("./routes/createRoutes");
const generationRoutes = require("./routes/generationRoutes");
const videoRoutes = require("./routes/videoRoutes");
const creditRoutes = require("./routes/creditRoutes");
const adminRoutes = require("./routes/adminRoutes");
app.use("/api/auth", authRoutes);
app.use("/api/create", createRoutes);
app.use("/api/generate", generationRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/credits", creditRoutes);
app.use("/api/admin", adminRoutes);
app.get("/", (req, res) => {
    return res.send("Welcome to AI short video ADS generator application");
})
module.exports = app;
