const fs = require("fs");
const path = require("path");

const defaultSocketUrl = "https://lifepath-backend-4lbj.onrender.com";
const socketUrl = process.env.LIFEPATH_SOCKET_URL || defaultSocketUrl;
const target = path.join(__dirname, "..", "public", "js", "config.js");
const content = `window.LIFEPATH_SOCKET_URL = ${JSON.stringify(socketUrl)};\n`;

fs.writeFileSync(target, content, "utf8");
console.log(`Config frontend escrita con LIFEPATH_SOCKET_URL=${socketUrl || "(mismo origen)"}`);
