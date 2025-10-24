import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function loadRoom(code) {
  if (!code) return null;
  const room = await redis.get("room:" + code);
  return room || null;
}

async function saveRoom(room) {
  if (!room || !room.code) return;
  await redis.set("room:" + room.code, room);
}

function genCode() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 4; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export async function createRoom(playerId) {
  let code;
  while (true) {
    code = genCode();
    const exists = await loadRoom(code);
    if (!exists) break;
  }

  const room = {
    code,
    players: [playerId],
    snapshots: {}, // { [pid]: { state, attack, ts } }
    ready: {},
    startAt: null,
    createdAt: Date.now(),
  };

  await saveRoom(room);
  return room;
}

export async function joinRoom(code, playerId) {
  const room = await loadRoom(code);
  if (!room) return null;

  if (!room.players.includes(playerId)) {
    room.players.push(playerId);
  }

  await saveRoom(room);
  return room;
}

export async function updateState(code, playerId, state, attack = 0) {
  const room = await loadRoom(code);
  if (!room) return null;

  const atk = Math.max(0, Math.min(20, Math.floor(Number(attack) || 0)));

  room.snapshots[playerId] = {
    state,
    attack: atk,
    ts: Date.now(),
  };

  await saveRoom(room);
  return room;
}

export async function setReady(code, playerId, readyBool) {
  const room = await loadRoom(code);
  if (!room) return null;

  if (!room.ready) room.ready = {};
  room.ready[playerId] = !!readyBool;

  // if 2 players are ready and there's no startAt yet -> set synchronized start
  if (
    room.players.length >= 2 &&
    room.ready[room.players[0]] &&
    room.ready[room.players[1]] &&
    !room.startAt
  ) {
    room.startAt = Date.now() + 1500;
  }

  await saveRoom(room);
  return room;
}

export async function getRoom(code) {
  return await loadRoom(code);
}
