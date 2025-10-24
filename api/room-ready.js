const { setReady } = require("./_rooms.js");

function readBody(req) {
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch (e) {
      return {};
    }
  } else if (req.body && typeof req.body === "object") {
    return req.body;
  }
  return {};
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return;
  }

  const body = readBody(req);
  const { roomCode, playerId, ready } = body;

  if (!roomCode || !playerId) {
    res.status(400).json({ ok: false, error: "roomCode, playerId required" });
    return;
  }

  const room = setReady(roomCode.toUpperCase(), playerId, !!ready);
  if (!room) {
    res.status(404).json({ ok: false, error: "room not found" });
    return;
  }

  res.status(200).json({
    ok: true,
    startAt: room.startAt || null,
    ready: room.ready
  });
};
