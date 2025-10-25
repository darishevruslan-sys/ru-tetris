import { setReady } from "./_rooms.js";

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
  const roomCode = (body.roomCode || "").toUpperCase();
  const playerId = body.playerId;
  const ready = !!body.ready;

  if (!roomCode || !playerId) {
    res.status(400).json({
      ok: false,
      error: "roomCode, playerId required",
    });
    return;
  }

  const room = await setReady(roomCode, playerId, ready);
  if (!room) {
    res.status(404).json({ ok: false, error: "room not found" });
    return;
  }

  res.status(200).json({
    ok: true,
    startAt: room.startAt || null,
    roundActive: !!room.roundActive,
    ready: room.ready || {},
  });
}
