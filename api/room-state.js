import { updateState, getRoom } from "./_rooms.js";

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
  const state = body.state;
  const attack = body.attack || 0;

  if (!roomCode || !playerId || !state) {
    res.status(400).json({
      ok: false,
      error: "roomCode, playerId, state required",
    });
    return;
  }

  const updated = await updateState(roomCode, playerId, state, attack);
  if (!updated) {
    res.status(404).json({ ok: false, error: "room not found" });
    return;
  }

  // reload full room after update
  const room = await getRoom(roomCode);

  // gather opponent snapshots and reset their attack
  const opponents = {};
  for (const pid of room.players) {
    const snap = room.snapshots[pid];
    if (!snap) continue;

    if (pid !== playerId) {
      opponents[pid] = {
        state: snap.state,
        attack: snap.attack || 0,
      };
      // consume opponent's outgoing attack
      snap.attack = 0;
    }
  }

  // save room after zeroing opponents' attack
  // we don't have a direct saveRoom exported, so the simplest
  // way to persist mutated attack=0 is to call updateState again
  // for the current player with attack=0 and same state,
  // which triggers saveRoom().
  await updateState(roomCode, playerId, state, 0);

  res.status(200).json({
    ok: true,
    players: room.players,
    you: playerId,
    opponents,
    startAt: room.startAt || null,
    ready: room.ready || {},
  });
}
