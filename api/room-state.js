const { updateState, saveRoom } = require("./_rooms.js");

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

  if (!roomCode || !playerId || typeof state === "undefined") {
    res.status(400).json({ ok: false, error: "roomCode, playerId, state required" });
    return;
  }

  const room = await updateState(roomCode.toUpperCase(), playerId, state, attack);
  if (!room) {
    res.status(404).json({ ok: false, error: "room not found" });
    return;
  }

  const opponents = {};
  let attacksUpdated = false;
  if (room.players && room.snapshots) {
    for (const pid of room.players) {
      if (pid === playerId) continue;
      const snap = room.snapshots[pid];
      if (snap) {
        const currentAttack = Number(snap.attack) || 0;
        opponents[pid] = {
          state: snap.state,
          attack: currentAttack
        };
        if (snap.attack !== 0) {
          snap.attack = 0;
          attacksUpdated = true;
        }
      }
    }
  }

  if (attacksUpdated) {
    await saveRoom(room);
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
