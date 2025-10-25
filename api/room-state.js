import {
  updateState,
  getRoom,
  persistRoom,
  generateSevenBagSequence,
} from "./_rooms.js";

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
  const dead = body.dead === true;

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
  if (!room) {
    res.status(404).json({ ok: false, error: "room not found" });
    return;
  }

  if (typeof room.roundActive !== "boolean") {
    room.roundActive = false;
  }
  if (!room.ready) room.ready = {};

  if (!room.bag || !Array.isArray(room.bag) || room.bag.length === 0) {
    room.bag = generateSevenBagSequence();
    room.bagVersion = room.bagVersion ? room.bagVersion + 1 : 1;
  } else if (typeof room.bagVersion !== "number") {
    room.bagVersion = 1;
  }

  if (dead) {
    room.roundActive = false;
    room.startAt = null;
    for (const pid of room.players || []) {
      room.ready[pid] = false;
    }
  }

  // gather opponent snapshots and consume pending garbage
  if (!room.snapshots) room.snapshots = {};

  const players = Array.isArray(room.players) ? room.players : [];
  const opponents = {};
  let incomingGarbage = 0;

  for (const pid of players) {
    const snap = room.snapshots[pid];
    if (!snap) continue;

    if (pid === playerId) {
      continue;
    }

    opponents[pid] = {
      state: snap.state,
    };

    const pending = Math.max(0, Math.floor(Number(snap.attackPending) || 0));
    incomingGarbage += pending;
    snap.attackPending = 0;
  }

  await persistRoom(room);

  res.status(200).json({
    ok: true,
    players: room.players,
    you: playerId,
    opponents,
    bag: room.bag || [],
    bagVersion: room.bagVersion || 1,
    incomingGarbage,
    startAt: room.startAt || null,
    roundActive: !!room.roundActive,
    ready: room.ready || {},
  });
}
