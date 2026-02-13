/**
 * Minimal WebSocket signaling server for local WebRTC testing.
 * Relays offer, answer, and ICE between two connected clients.
 * Run: pnpm start (from this package) or pnpm signaling (from repo root).
 */
const { WebSocketServer } = require("ws");

const PORT = Number(process.env.SIGNALING_PORT) || 8765;
const wss = new WebSocketServer({ port: PORT });

const clients = new Set();

wss.on("connection", (ws) => {
  clients.add(ws);
  console.log(`[signaling] client connected (total: ${clients.size})`);

  ws.on("message", (data) => {
    const raw = data.toString();
    if (!raw) return;
    try {
      const msg = JSON.parse(raw);
      if (!msg.type || msg.payload === undefined) return;
      // Relay to every other client
      for (const other of clients) {
        if (other !== ws && other.readyState === 1) {
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
});

console.log(`[signaling] server listening on ws://localhost:${PORT}`);
