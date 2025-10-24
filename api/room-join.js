const { joinRoom } = require("./_rooms.js");

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

  const { roomCode } = body;
  let { playerId } = body;

  if (!roomCode) {
    res.status(400).json({ ok: false, error: "roomCode required" });
    return;
  }

  if (!playerId) {
    playerId = "p_" + Math.random().toString(36).slice(2, 8);
  }

  const room = joinRoom(roomCode.toUpperCase(), playerId);
  if (!room) {
    res.status(404).json({ ok: false, error: "room not found" });
    return;
  }

  res.status(200).json({
    ok: true,
    roomCode: room.code,
    you: playerId,
    players: room.players
  });
};
