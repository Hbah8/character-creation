const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const webDir = path.join(projectRoot, 'src-tauri', 'resources', 'web');

if (!fs.existsSync(distDir)) {
  console.error('Missing dist/. Run `npm run build` first.');
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, 'src-tauri'))) {
  console.error('Missing src-tauri/. Run `npx tauri init` first to enable MSI packaging.');
  process.exit(1);
}

fs.rmSync(webDir, { recursive: true, force: true });
fs.mkdirSync(webDir, { recursive: true });
fs.cpSync(distDir, webDir, { recursive: true });

console.log(`Copied ${distDir} -> ${webDir}`);
