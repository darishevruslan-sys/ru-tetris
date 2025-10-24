const { updateState } = require("./_rooms.js");

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
  const { roomCode, playerId, state, attack } = body;

  if (!roomCode || !playerId || !state) {
    res.status(400).json({ ok: false, error: "roomCode, playerId, state required" });
    return;
  }

  // write/update my snapshot (with my latest board + outgoing attack)
  const room = updateState(roomCode.toUpperCase(), playerId, state, attack);
  if (!room) {
    res.status(404).json({ ok: false, error: "room not found" });
    return;
  }

  // collect opponent data + consume their attack
  const opponents = {};
  for (const pid of room.players) {
    if (pid === playerId) continue;
    const snap = room.snapshots[pid];
    if (snap) {
      opponents[pid] = {
        state: snap.state,
        attack: snap.attack || 0
      };
      // consume garbage after giving it
      snap.attack = 0;
    }
  }

  res.status(200).json({
    ok: true,
    players: room.players,
    you: playerId,
    opponents,
    startAt: room.startAt || null,
    ready: room.ready || {}
  });
};
