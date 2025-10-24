import { createRoom } from "./_rooms.js";

function readBody(req) {
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  if (req.body && typeof req.body === "object") return req.body;
  return {};
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return;
  }

  const body = readBody(req);
  const playerId =
    body.playerId || ("p_" + Math.random().toString(36).slice(2, 8));

  const room = await createRoom(playerId);

  res.status(200).json({
    ok: true,
    roomCode: room.code,
    you: playerId,
    players: room.players,
  });
}
