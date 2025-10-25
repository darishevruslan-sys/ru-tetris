import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const PIECES = ["I", "J", "L", "O", "S", "T", "Z"];

export function generateSevenBagSequence(countBags = 30) {
  const totalBags = Math.max(1, Math.floor(countBags));
  const result = [];

  for (let i = 0; i < totalBags; i++) {
    const bag = PIECES.slice();
    for (let j = bag.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [bag[j], bag[k]] = [bag[k], bag[j]];
    }
    result.push(...bag);
  }

  return result;
}

async function loadRoom(code) {
  if (!code) return null;
  const room = await redis.get("room:" + code);
  return room || null;
}

async function saveRoom(room) {
  if (!room || !room.code) return;
  await redis.set("room:" + room.code, room);
}

export async function persistRoom(room) {
  await saveRoom(room);
  return room;
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
    bag: generateSevenBagSequence(),
    bagVersion: 1,
    snapshots: {
      [playerId]: {
        state: {},
        ts: Date.now(),
        attackPending: 0,
      },
    }, // { [pid]: { state, attackPending, ts } }
    ready: { [playerId]: false },
    startAt: null,
    roundActive: false,
    createdAt: Date.now(),
  };

  await saveRoom(room);
  return room;
}

export async function joinRoom(code, playerId) {
  const room = await loadRoom(code);
  if (!room) return null;

  if (typeof room.roundActive !== "boolean") {
    room.roundActive = false;
  }

  if (!room.players.includes(playerId)) {
    room.players.push(playerId);
  }

  if (!room.bag || !Array.isArray(room.bag) || room.bag.length === 0) {
    room.bag = generateSevenBagSequence();
    room.bagVersion = room.bagVersion ? room.bagVersion + 1 : 1;
  } else if (typeof room.bagVersion !== "number") {
    room.bagVersion = 1;
  }

  if (!room.snapshots) room.snapshots = {};
  if (!room.snapshots[playerId]) {
    room.snapshots[playerId] = {
      state: {},
      ts: Date.now(),
      attackPending: 0,
    };
  }

  if (!room.ready) room.ready = {};
  if (typeof room.ready[playerId] !== "boolean") {
    room.ready[playerId] = false;
  }

  await saveRoom(room);
  return room;
}

export async function updateState(code, playerId, state, attack = 0) {
  const room = await loadRoom(code);
  if (!room) return null;

  if (typeof room.roundActive !== "boolean") {
    room.roundActive = false;
  }

  if (!room.bag || !Array.isArray(room.bag) || room.bag.length === 0) {
    room.bag = generateSevenBagSequence();
    room.bagVersion = room.bagVersion ? room.bagVersion + 1 : 1;
  } else if (typeof room.bagVersion !== "number") {
    room.bagVersion = 1;
  }

  const atk = Math.max(0, Math.min(20, Math.floor(Number(attack) || 0)));

  if (!room.snapshots) room.snapshots = {};
  const existingSnapshot = room.snapshots[playerId] || {
    state: {},
    ts: Date.now(),
    attackPending: 0,
  };

  existingSnapshot.state = state;
  existingSnapshot.ts = Date.now();
  if (atk > 0) {
    existingSnapshot.attackPending =
      (existingSnapshot.attackPending || 0) + atk;
  } else if (typeof existingSnapshot.attackPending !== "number") {
    existingSnapshot.attackPending = 0;
  }

  room.snapshots[playerId] = existingSnapshot;

  await saveRoom(room);
  return room;
}

export async function setReady(code, playerId, readyBool) {
  const room = await loadRoom(code);
  if (!room) return null;

  if (!room.ready) room.ready = {};
  room.ready[playerId] = !!readyBool;

  const players = room.players || [];
  const allReady =
    players.length >= 2 &&
    players.every(pid => room.ready[pid]);

  if (allReady) {
    room.startAt = Date.now() + 1500;
    room.roundActive = true;
  } else {
    room.roundActive = false;
    if (!allReady) {
      room.startAt = null;
    }
  }

  await saveRoom(room);
  return room;
}

export async function getRoom(code) {
  return await loadRoom(code);
}
