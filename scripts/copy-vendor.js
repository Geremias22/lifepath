const fs = require("fs");
const path = require("path");

const vendorDir = path.join(__dirname, "..", "public", "vendor");
const buildDir = path.join(__dirname, "..", "node_modules", "three", "build");
const examplesDir = path.join(__dirname, "..", "node_modules", "three", "examples", "jsm");
const vendorFiles = ["three.module.js", "three.core.js"];
const exampleFiles = [
  ["loaders", "GLTFLoader.js"],
  ["utils", "BufferGeometryUtils.js"],
  ["utils", "SkeletonUtils.js"],
];

if (!fs.existsSync(path.join(buildDir, vendorFiles[0]))) {
  console.warn("Three.js no esta instalado todavia; ejecuta npm install.");
  process.exit(0);
}

fs.mkdirSync(vendorDir, { recursive: true });
for (const file of vendorFiles) {
  fs.copyFileSync(path.join(buildDir, file), path.join(vendorDir, file));
}

for (const [folder, file] of exampleFiles) {
  const source = path.join(examplesDir, folder, file);
  const targetDir = path.join(vendorDir, "examples", "jsm", folder);
  const target = path.join(targetDir, file);
  fs.mkdirSync(targetDir, { recursive: true });
  const patched = fs.readFileSync(source, "utf8").replace(/from 'three';/g, "from '/vendor/three.module.js';");
  fs.writeFileSync(target, patched);
}

console.log(
  `Vendor listo: ${[
    ...vendorFiles.map((file) => `public/vendor/${file}`),
    ...exampleFiles.map(([folder, file]) => `public/vendor/examples/jsm/${folder}/${file}`),
  ].join(", ")}`,
);
