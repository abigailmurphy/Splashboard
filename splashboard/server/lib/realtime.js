
const { createClient } = require("redis");

let pub; // singleton publisher
const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

async function initRealtime() {
  if (pub?.isOpen) return pub;
  pub = createClient({ url: REDIS_URL });
  pub.on("error", (e) => console.error("[redis:pub] error", e));
  await pub.connect();
  return pub;
}

// Make a dedicated subscriber for each SSE connection
async function createSubscriber() {
  const sub = createClient({ url: REDIS_URL });
  sub.on("error", (e) => console.error("[redis:sub] error", e));
  await sub.connect();
  return sub;
}

async function publishGuestUpdate(payload) {
  if (!pub?.isOpen) return;
  await pub.publish("guest_updates", JSON.stringify(payload));
}

async function publishSeasonCap(payload) {
  if (!pub?.isOpen) return;
  await pub.publish("guest_updates", JSON.stringify(payload));
}

module.exports = { initRealtime, createSubscriber, publishGuestUpdate, publishSeasonCap };
