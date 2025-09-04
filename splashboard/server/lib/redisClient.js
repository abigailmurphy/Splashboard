const { createClient, createCluster } = require("redis");
const fs = require("fs");
const LUA = fs.readFileSync(require.resolve("./redisGuest.lua"), "utf8");

let client; // singleton

function tag(season, dayStr)               { return `{guest:${season}:${dayStr}}`; }
function usedKey(season, dayStr)           { return `guest:used:${tag(season, dayStr)}`; }
function userKey(season, dayStr, userId)   { return `guest:user:${tag(season, dayStr)}:${userId}`; }
function verKey(season, dayStr)            { return `guest:ver:${tag(season, dayStr)}`; }

async function initRedis() {
  if (client) return client;
  const clusterNodes = process.env.REDIS_CLUSTER_NODES;
  if (clusterNodes && clusterNodes.trim()) {
    const rootNodes = clusterNodes.split(",").map(s => {
      const [host, port] = s.trim().split(":");
      return { url: `redis://${host}:${port}` };
    });
    client = createCluster({ rootNodes });
    client.on("connect", () => console.log("[redis] cluster connected"));
  } else {
    const url = process.env.REDIS_URL || "redis://127.0.0.1:6379";
    client = createClient({ url });
    client.on("connect", () => console.log("[redis] connected"));
  }
  client.on("error", e => console.error("[redis] error", e));
  await client.connect();
  return client;
}

// Atomic set desired guests; returns [ok(1/0), used, user, ver] or [0, 'reason']
async function setDesiredCount({ season, dayStr, userId, newCount, perUserMax, capValue }) {
  const r = await initRedis();
  return r.eval(LUA, {
    keys: [usedKey(season, dayStr), userKey(season, dayStr, userId), verKey(season, dayStr)],
    arguments: [String(newCount), String(perUserMax), String(capValue)],
  });
}

// Fast read of "used" for many days
async function mgetUsedForDays(season, dayStrs) {
  const r = await initRedis();
  const keys = dayStrs.map(d => usedKey(season, d));
  if (!keys.length) return [];
  const vals = await r.mGet(keys);
  return vals.map(v => Number(v || 0));
}

module.exports = { initRedis, setDesiredCount, mgetUsedForDays };
