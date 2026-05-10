const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const projectRoot = path.resolve(__dirname, '..');

function run(command) {
  return spawnSync(command, {
    shell: true,
    cwd: projectRoot,
    encoding: 'utf8',
  });
}

function checkCommand(command, description, failures) {
  const result = run(command);
  if (result.status !== 0) {
    failures.push(`- ${description} failed: ${command}`);
  }
}

function main() {
  const failures = [];

  const requiredFiles = [
    'src-tauri/tauri.conf.json',
    'src-tauri/Cargo.toml',
    'src-tauri/build.rs',
    'src-tauri/src/main.rs',
    'src-tauri/icons/icon.ico',
    'server/proxy.cjs',
    'scripts/tauri-setup.test.js',
  ];

  for (const relativePath of requiredFiles) {
    if (!fs.existsSync(path.join(projectRoot, relativePath))) {
      failures.push(`- Missing required file: ${relativePath}`);
    }
  }

  const packageJsonPath = path.join(projectRoot, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    failures.push('- Missing package.json');
  } else {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const scripts = packageJson.scripts || {};

    const expectedScriptFragments = {
      server: 'server/proxy.cjs',
      'build:proxy': 'server/proxy.cjs',
      'prepare:tauri': 'scripts/prepare-tauri-resources.cjs',
      'preflight:tauri': 'scripts/preflight-tauri.cjs',
      'build:tauri': 'npm run preflight:tauri',
    };

    for (const [scriptName, expectedFragment] of Object.entries(expectedScriptFragments)) {
      const value = scripts[scriptName];
      if (typeof value !== 'string' || !value.includes(expectedFragment)) {
        failures.push(`- package.json scripts.${scriptName} must contain \"${expectedFragment}\"`);
      }
    }
  }

  const tauriConfigPath = path.join(projectRoot, 'src-tauri', 'tauri.conf.json');
  if (fs.existsSync(tauriConfigPath)) {
    const tauriConfig = JSON.parse(fs.readFileSync(tauriConfigPath, 'utf8'));
    const bundle = tauriConfig?.tauri?.bundle;
    const targets = Array.isArray(bundle?.targets) ? bundle.targets : [];
    const resources = Array.isArray(bundle?.resources) ? bundle.resources : [];
    const icons = Array.isArray(bundle?.icon) ? bundle.icon : [];

    if (!targets.includes('msi')) {
      failures.push('- src-tauri/tauri.conf.json must set tauri.bundle.targets to include "msi"');
    }
    if (!resources.includes('resources/proxy/proxy.exe')) {
      failures.push('- src-tauri/tauri.conf.json must include resources/proxy/proxy.exe in tauri.bundle.resources');
    }
    if (!resources.includes('resources/web')) {
      failures.push('- src-tauri/tauri.conf.json must include resources/web in tauri.bundle.resources');
    }
    if (!icons.includes('icons/icon.ico')) {
      failures.push('- src-tauri/tauri.conf.json must include icons/icon.ico in tauri.bundle.icon');
    }
  }

  checkCommand('node -v', 'Node.js availability', failures);
  checkCommand('npm -v', 'npm availability', failures);
  checkCommand('rustc --version', 'Rust compiler availability', failures);
  checkCommand('cargo --version', 'Cargo availability', failures);
  checkCommand('npx tauri --version', 'Tauri CLI availability', failures);

  if (process.platform === 'win32') {
    checkCommand('candle -?', 'WiX candle availability', failures);
    checkCommand('light -?', 'WiX light availability', failures);
  }

  if (failures.length > 0) {
    console.error('Tauri preflight failed. Fix the following issues before building MSI:');
    for (const failure of failures) {
      console.error(failure);
    }
    process.exit(1);
  }

  console.log('Tauri preflight passed.');
}

main();
