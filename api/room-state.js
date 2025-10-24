const { updateState, getRoom } = require("./_rooms.js");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return;
  }

  let body = {};
  try {
    body = JSON.parse(req.body || "{}");
  } catch (e) {}

  const { roomCode, playerId, state, attack = 0 } = body;
  if (!roomCode || !playerId || !state) {
    res.status(400).json({ ok: false, error: "roomCode, playerId, state required" });
    return;
  }

  const room = updateState(roomCode.toUpperCase(), playerId, state, attack);
  if (!room) {
    res.status(404).json({ ok: false, error: "room not found" });
    return;
  }

  const opponents = {};
  for (const pid of room.players) {
    if (pid === playerId) continue;
    const snapshot = room.snapshots[pid];
    if (snapshot) {
      opponents[pid] = {
        state: snapshot.state,
        attack: snapshot.attack || 0
      };
    }
  }

  res.status(200).json({
    ok: true,
    players: room.players,
    you: playerId,
    opponents
  });
};
