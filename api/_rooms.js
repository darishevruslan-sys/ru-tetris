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
  return room;
}

function updateState(code, playerId, state) {
  const room = rooms[code];
  if (!room) return null;
  room.snapshots[playerId] = {
    state,
    ts: Date.now()
  };
  return room;
}

function getRoom(code) {
  return rooms[code] || null;
}

module.exports = {
  createRoom,
  joinRoom,
  updateState,
  getRoom
};
