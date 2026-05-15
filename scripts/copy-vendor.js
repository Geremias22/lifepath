const fs = require("fs");
const path = require("path");

const vendorDir = path.join(__dirname, "..", "public", "vendor");
const buildDir = path.join(__dirname, "..", "node_modules", "three", "build");
const vendorFiles = ["three.module.js", "three.core.js"];

if (!fs.existsSync(path.join(buildDir, vendorFiles[0]))) {
  console.warn("Three.js no esta instalado todavia; ejecuta npm install.");
  process.exit(0);
}

fs.mkdirSync(vendorDir, { recursive: true });
for (const file of vendorFiles) {
  fs.copyFileSync(path.join(buildDir, file), path.join(vendorDir, file));
}
console.log(`Vendor listo: ${vendorFiles.map((file) => `public/vendor/${file}`).join(", ")}`);
