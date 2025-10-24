const { createRoom } = require("./_rooms.js");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return;
  }

  let body = {};
  try {
    body = JSON.parse(req.body || "{}");
  } catch (e) {}

  const playerId = body.playerId || ("p_" + Math.random().toString(36).slice(2, 8));
  const room = createRoom(playerId);

  res.status(200).json({
    ok: true,
    roomCode: room.code,
    you: playerId,
    players: room.players
  });
};
