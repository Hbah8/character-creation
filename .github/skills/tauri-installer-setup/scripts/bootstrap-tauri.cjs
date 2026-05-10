const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const projectRoot = path.resolve(__dirname, '..');
const templateRoot = path.join(projectRoot, 'templates', 'tauri-msi-template');
const force = process.argv.includes('--force');

const filesToScaffold = [
  ['src-tauri/tauri.conf.json', 'src-tauri/tauri.conf.json'],
  ['src-tauri/Cargo.toml', 'src-tauri/Cargo.toml'],
  ['src-tauri/build.rs', 'src-tauri/build.rs'],
  ['src-tauri/src/main.rs', 'src-tauri/src/main.rs'],
  ['server/proxy.cjs', 'server/proxy.cjs'],
  ['scripts/tauri-setup.test.js', 'scripts/tauri-setup.test.js'],
];

function copyTemplateFile(fromRelative, toRelative, created, skipped) {
  const fromPath = path.join(templateRoot, fromRelative);
  const toPath = path.join(projectRoot, toRelative);

  if (!fs.existsSync(fromPath)) {
    throw new Error(`Template file not found: ${fromRelative}`);
  }

  if (!force && fs.existsSync(toPath)) {
    skipped.push(toRelative);
    return;
  }

  fs.mkdirSync(path.dirname(toPath), { recursive: true });
  fs.copyFileSync(fromPath, toPath);
  created.push(toRelative);
}

function ensurePackageScripts() {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  packageJson.scripts = packageJson.scripts || {};
  packageJson.scripts.server = 'node server/proxy.cjs';
  packageJson.scripts['bootstrap:tauri'] = 'node scripts/bootstrap-tauri.cjs';
  packageJson.scripts['preflight:tauri'] = 'node scripts/preflight-tauri.cjs && npm run test -- scripts/tauri-setup.test.js';
  packageJson.scripts['build:proxy'] = 'pkg server/proxy.cjs --targets node18-win-x64 --output src-tauri/resources/proxy/proxy.exe';
  packageJson.scripts['prepare:tauri'] = 'node scripts/prepare-tauri-resources.cjs';
  packageJson.scripts['build:tauri'] = 'npm run preflight:tauri && npm run build && npm run build:proxy && npm run prepare:tauri && tauri build --bundles msi';

  fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');
}

function ensureIcons() {
  const iconPath = path.join(projectRoot, 'src-tauri', 'icons', 'icon.ico');
  if (fs.existsSync(iconPath)) {
    return;
  }

  const sourcePath = path.join(projectRoot, 'src-tauri', 'icons', 'source.png');
  if (!fs.existsSync(sourcePath)) {
    throw new Error('Missing src-tauri/icons/icon.ico and src-tauri/icons/source.png. Add a PNG source and run `npm exec tauri -- icon src-tauri/icons/source.png`.');
  }

  const result = spawnSync('npm exec tauri -- icon src-tauri/icons/source.png', {
    shell: true,
    cwd: projectRoot,
    encoding: 'utf8',
  });

  if (result.status !== 0 || !fs.existsSync(iconPath)) {
    throw new Error('Failed to generate src-tauri/icons/icon.ico from source.png during bootstrap.');
  }
}

function main() {
  if (!fs.existsSync(templateRoot)) {
    throw new Error('Template directory missing: templates/tauri-msi-template');
  }

  const created = [];
  const skipped = [];

  for (const [fromRelative, toRelative] of filesToScaffold) {
    copyTemplateFile(fromRelative, toRelative, created, skipped);
  }

  ensurePackageScripts();
  ensureIcons();

  console.log('Bootstrap complete.');
  if (created.length > 0) {
    console.log('Created/updated files:');
    for (const file of created) {
      console.log(`- ${file}`);
    }
  }

  if (skipped.length > 0) {
    console.log('Skipped existing files (use --force to overwrite):');
    for (const file of skipped) {
      console.log(`- ${file}`);
    }
  }
}

main();
