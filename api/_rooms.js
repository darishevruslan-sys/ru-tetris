const { Redis } = require("@upstash/redis");

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
});

function genCode() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 4; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

async function loadRoom(code) {
  if (!code) return null;
  const data = await redis.get("room:" + code);
  return data || null;
}

async function saveRoom(room) {
  if (!room || !room.code) return;
  await redis.set("room:" + room.code, room);
}

async function createRoom(playerId) {
  let code;
  let existing;
  do {
    code = genCode();
    existing = await loadRoom(code);
  } while (existing);

  const room = {
    code,
    players: [playerId],
    snapshots: {},
    ready: { [playerId]: false },
    startAt: null,
    createdAt: Date.now()
  };

  await saveRoom(room);
  return room;
}

async function joinRoom(code, playerId) {
  if (!code) return null;
  const room = await loadRoom(code);
  if (!room) return null;

  if (!room.players.includes(playerId)) {
    room.players.push(playerId);
  }

  if (!room.ready) {
    room.ready = {};
  }

  if (!Object.prototype.hasOwnProperty.call(room.ready, playerId)) {
    room.ready[playerId] = false;
  }

  await saveRoom(room);
  return room;
}

async function updateState(code, playerId, state, attack = 0) {
  if (!code) return null;
  const room = await loadRoom(code);
  if (!room) return null;

  if (!room.ready) {
    room.ready = {};
  }

  if (!Object.prototype.hasOwnProperty.call(room.ready, playerId)) {
    room.ready[playerId] = false;
  }

  const attackValue = Math.max(0, Math.min(20, Math.floor(Number(attack) || 0)));

  if (!room.snapshots) {
    room.snapshots = {};
  }

  room.snapshots[playerId] = {
    state,
    attack: attackValue,
    ts: Date.now()
  };

  await saveRoom(room);
  return room;
}

async function getRoom(code) {
  if (!code) return null;
  return await loadRoom(code);
}

async function setReady(code, playerId, readyBool) {
  if (!code) return null;
  const room = await loadRoom(code);
  if (!room) return null;

  if (!room.ready) {
    room.ready = {};
  }

  room.ready[playerId] = !!readyBool;

  const allReady =
    room.players.length >= 2 &&
    room.players.every(pid => room.ready[pid]);

  if (allReady) {
    if (!room.startAt) {
      room.startAt = Date.now() + 1500;
    }
  } else {
    room.startAt = null;
  }

  await saveRoom(room);
  return room;
}

module.exports = {
  createRoom,
  joinRoom,
  updateState,
  getRoom,
  setReady,
  loadRoom,
  saveRoom
};
