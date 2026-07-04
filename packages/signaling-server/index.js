/**
 * Minimal WebSocket signaling server for local WebRTC testing.
 * Relays offer, answer, and ICE between exactly two connected clients.
 * Run: pnpm start (from this package) or pnpm signaling (from repo root).
 */
const { WebSocketServer, WebSocket } = require("ws");

const PORT = Number(process.env.SIGNALING_PORT) || 8765;
const MAX_CLIENTS = 2;
const HEARTBEAT_INTERVAL_MS = 30_000;
/** Message types the relay will forward; anything else is dropped. */
const RELAYED_TYPES = new Set(["offer", "answer", "ice"]);

const wss = new WebSocketServer({ port: PORT });

const clients = new Set();

wss.on("connection", (ws) => {
  // The client auto-answers every offer, so a 3rd peer would produce duelling
  // answers and nondeterministic sessions — enforce the two-peer contract.
  if (clients.size >= MAX_CLIENTS) {
    console.log("[signaling] rejecting extra client (room full)");
    ws.close(1013, "room full");
    return;
  }

  clients.add(ws);
  ws.isAlive = true;
  console.log(`[signaling] client connected (total: ${clients.size})`);

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("message", (data) => {
    const raw = data.toString();
    if (!raw) return;
    try {
      const msg = JSON.parse(raw);
      if (!RELAYED_TYPES.has(msg.type) || typeof msg.payload !== "string") return;
      // Relay to every other client
      for (const other of clients) {
        if (other !== ws && other.readyState === WebSocket.OPEN) {
          other.send(raw);
        }
      }
    } catch {
      // ignore non-JSON
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log(`[signaling] client disconnected (total: ${clients.size})`);
  });

  // Without this, an abrupt client drop (ECONNRESET) is an unhandled 'error'
  // event and kills the whole relay for the surviving peer.
  ws.on("error", (err) => {
    console.error("[signaling] client error:", err.message);
  });
});

// Half-open sockets (peer power-loss, network partition) stay OPEN forever and
// hold the second peer slot — ping them and terminate the unresponsive ones.
const heartbeat = setInterval(() => {
  for (const ws of clients) {
    if (!ws.isAlive) {
      console.log("[signaling] terminating unresponsive client");
      ws.terminate();
      continue;
    }
    ws.isAlive = false;
    ws.ping();
  }
}, HEARTBEAT_INTERVAL_MS);

wss.on("close", () => clearInterval(heartbeat));
wss.on("error", (err) => {
  console.error("[signaling] server error:", err.message);
});

console.log(`[signaling] server listening on ws://localhost:${PORT}`);
