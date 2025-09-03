
const router = require("express").Router();
const { checkUser,requireMemberOrAdmin } = require("../controllers/authMiddleware");

const AppSettings = require("../models/appSettings");
const { createSubscriber } = require("../lib/realtime");

router.get("/guest/stream", checkUser, requireMemberOrAdmin, async (req, res) => {
  // SSE headers
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Resolve season
  const app = await AppSettings.findById("global").lean();
  const season = String(req.query.season || app?.workingSeason || new Date().getFullYear());

  // Heartbeat
  const heartbeat = setInterval(() => res.write("event: ping\ndata: {}\n\n"), 25000);

  // Create a dedicated subscriber for THIS SSE connection
  const sub = await createSubscriber();

  // Listener: only forward messages for this season
  const onMessage = (message /*, channel*/) => {
    try {
      const data = JSON.parse(message);
      if (!data || data.season !== season) return;
      res.write(`event: ${data.type}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (_e) {}
  };

  // Subscribe with per-connection callback
  await sub.subscribe("guest_updates", onMessage);

  // Cleanup on disconnect
  req.on("close", async () => {
    clearInterval(heartbeat);
    try {
      await sub.unsubscribe("guest_updates", onMessage);
      await sub.quit();
    } catch {}
    res.end();
  });
});

module.exports = router;
