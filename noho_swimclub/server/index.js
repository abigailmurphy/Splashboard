require("dotenv").config({ path: "./config/.env" });
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const membershipRoutes = require("./routes/membershipRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const guestRoutes = require("./routes/guestRoutes");
const guestStreamRoutes = require("./routes/guestStreamRoutes");

const ensureSeasonSettingsOnBoot = require("./boot/ensureSeasonSettings");
const { initRealtime } = require("./lib/realtime");

const app = express();

// Middleware (before routes)
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

// Routes (mounted once; safe to do before DB connect)
app.use("/guest", guestRoutes);
// IMPORTANT: mount at "/" so route file's "/guest/stream" becomes exactly "/guest/stream"
app.use("/", guestStreamRoutes);

app.use("/", authRoutes);
app.use("/user", userRoutes);
app.use("/admin", adminRoutes);
app.use("/membership", membershipRoutes);
app.use("/settings", settingsRoutes);

(async function start() {
  try {
    // Connect DB
    await mongoose.connect("mongodb://localhost:27017/swimclub2");
    console.log("DB Connection Successful");

    // Ensure season settings (idempotent)
    try {
      await ensureSeasonSettingsOnBoot();
      console.log("Season settings ensured (boot).");
    } catch (e) {
      console.error("Boot seeding failed:", e);
      // Optional: process.exit(1);
    }

    // Init Redis Pub/Sub for realtime BEFORE starting the server
    await initRealtime();
    console.log("Realtime (Redis Pub/Sub) initialized.");

    // Start HTTP server
    app.listen(4000, (err) => {
      if (err) console.error(err);
      else console.log("Server Started Successfully on :4000");
    });
  } catch (err) {
    console.error("Fatal boot error:", err);
    process.exit(1);
  }
})();
