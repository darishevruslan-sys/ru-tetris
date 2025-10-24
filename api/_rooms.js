const rooms = {};

function genCode() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 4; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

function createRoom(playerId) {
  let code;
  do {
    code = genCode();
  } while (rooms[code]);

  rooms[code] = {
    code,
    players: [playerId],
    snapshots: {}, // { playerId: { state, ts } }
    ready: { [playerId]: false },
    startAt: null,
    createdAt: Date.now()
  };

  return rooms[code];
}

function joinRoom(code, playerId) {
  const room = rooms[code];
  if (!room) return null;
  if (!room.players.includes(playerId)) {
    room.players.push(playerId);
  }
  if (!Object.prototype.hasOwnProperty.call(room.ready, playerId)) {
    room.ready[playerId] = false;
  }
  return room;
}

function updateState(code, playerId, state, attack = 0) {
  const room = rooms[code];
  if (!room) return null;
  const attackValue = Math.max(0, Math.min(20, Math.floor(Number(attack) || 0)));
  if (!Object.prototype.hasOwnProperty.call(room.ready, playerId)) {
    room.ready[playerId] = false;
  }
  room.snapshots[playerId] = {
    state,
    attack: attackValue,
    ts: Date.now()
  };
  return room;
}

function getRoom(code) {
  return rooms[code] || null;
}

function setReady(code, playerId, isReady) {
  const room = rooms[code];
  if (!room) return null;

  room.ready[playerId] = !!isReady;

  const allReady = room.players.length >= 2 && room.players.every(pid => room.ready[pid]);

  if (allReady) {
    if (!room.startAt) {
      room.startAt = Date.now() + 1500;
    }
  } else {
    room.startAt = null;
  }

  return room;
}

function getStartInfo(code) {
  const room = rooms[code];
  if (!room) return null;
  return {
    startAt: room.startAt || null,
    ready: { ...room.ready }
  };
}

module.exports = {
  createRoom,
  joinRoom,
  updateState,
  getRoom,
  setReady,
  getStartInfo
};
