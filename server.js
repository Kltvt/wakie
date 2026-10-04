const express = require("express");
const http = require("http");
const crypto = require("crypto");
const { WebSocketServer } = require("ws");

const app = express();
app.use(express.static("public"));

const server = http.createServer(app);
// The server now only handles small JSON signaling messages; audio flows peer-to-peer via WebRTC.
const wss = new WebSocketServer({ server, maxPayload: 64 * 1024 });

// roomCode -> Map<peerId, { id, ws, name, room }>
const rooms = new Map();

const send = (ws, obj) => {
  if (ws.readyState === 1) ws.send(JSON.stringify(obj));
};

function broadcast(room, obj, exceptId) {
  const members = rooms.get(room);
  if (!members) return;
  for (const m of members.values()) if (m.id !== exceptId) send(m.ws, obj);
}

function roster(room) {
  const members = rooms.get(room);
  return members ? [...members.values()].map((m) => ({ id: m.id, name: m.name })) : [];
}

wss.on("connection", (ws) => {
  let me = null;

  ws.on("message", (data) => {
    let msg;
    try { msg = JSON.parse(data.toString()); } catch { return; }

    if (msg.type === "join" && !me) {
      const room = String(msg.room || "").trim().toLowerCase().slice(0, 32);
      const name = String(msg.name || "Anon").trim().slice(0, 20) || "Anon";
      if (!room) return;

      me = { id: crypto.randomUUID(), ws, name, room };
      if (!rooms.has(room)) rooms.set(room, new Map());
      const members = rooms.get(room);

      // Tell the newcomer who is already here; they will start the WebRTC connections.
      const existing = roster(room);
      members.set(me.id, me);
      send(ws, { type: "welcome", id: me.id, peers: existing });
      broadcast(room, { type: "peer-joined", id: me.id, name: me.name }, me.id);
      return;
    }

    if (!me) return;

    // Relay WebRTC signaling (offer / answer / ice) to one specific peer in the same room.
    if (msg.type === "signal") {
      const target = rooms.get(me.room)?.get(msg.to);
      if (target) send(target.ws, { type: "signal", from: me.id, data: msg.data });
      return;
    }

    if (msg.type === "talking") {
      broadcast(me.room, { type: "talking", id: me.id, name: me.name, on: !!msg.on }, me.id);
    }
  });

  ws.on("close", () => {
    if (!me) return;
    const members = rooms.get(me.room);
    if (!members) return;
    members.delete(me.id);
    if (members.size === 0) rooms.delete(me.room);
    else broadcast(me.room, { type: "peer-left", id: me.id });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Walkie-talkie running on http://localhost:${PORT}`));
