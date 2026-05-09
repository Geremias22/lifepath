const fs = require("fs");
const path = require("path");

const socketUrl = process.env.LIFEPATH_SOCKET_URL || "";
const target = path.join(__dirname, "..", "public", "js", "config.js");
const content = `window.LIFEPATH_SOCKET_URL = ${JSON.stringify(socketUrl)};\n`;

fs.writeFileSync(target, content, "utf8");
console.log(`Config frontend escrita con LIFEPATH_SOCKET_URL=${socketUrl || "(mismo origen)"}`);
