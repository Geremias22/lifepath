const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateRoomCode(existingCodes = new Set()) {
  let code = "";

  do {
    code = Array.from({ length: 5 }, () => {
      const index = Math.floor(Math.random() * ALPHABET.length);
      return ALPHABET[index];
    }).join("");
  } while (existingCodes.has(code));

  return code;
}

module.exports = { generateRoomCode };
