# Build Pipeline & Commands

Commands and scripts for Phase 5 — producing the MSI installer.

## Build Scripts (`package.json`)

```json
{
  "scripts": {
      "bootstrap:tauri": "node scripts/bootstrap-tauri.cjs",
      "preflight:tauri": "node scripts/preflight-tauri.cjs && npm run test -- scripts/tauri-setup.test.js",
    "build": "tsc -b && vite build",
    "build:proxy": "pkg server/proxy.cjs --targets node18-win-x64 --output src-tauri/resources/proxy/proxy.exe",
    "prepare:tauri": "node scripts/prepare-tauri-resources.cjs",
      "build:tauri": "npm run preflight:tauri && npm run build && npm run build:proxy && npm run prepare:tauri && tauri build --bundles msi"
  }
}
```

```bash
npm install -D pkg
```

## Full Build Sequence

```
npm run build:tauri
```

Executes four steps in order:

```
Step 1: npm run build
   └── tsc -b && vite build
   └── Output: dist/  (static HTML/CSS/JS)

Step 2: npm run build:proxy
   └── pkg server/proxy.cjs → src-tauri/resources/proxy/proxy.exe
   └── Output: standalone Node proxy EXE

Step 3: npm run prepare:tauri
   └── Copy dist/ → src-tauri/resources/web/
   └── Output: web assets placed for Tauri bundling

Step 4: tauri build --bundles msi
   └── Compile Rust launcher (cargo build --release)
   └── Bundle launcher + resources into MSI via WiX
   └── Output: src-tauri/target/release/bundle/msi/*.msi
```

## Output Locations

| Artifact | Path |
|----------|------|
| Frontend build | `dist/` |
| Proxy EXE | `src-tauri/resources/proxy/proxy.exe` |
| Web resources | `src-tauri/resources/web/` |
| Launcher EXE | `src-tauri/target/release/*.exe` |
| **MSI Installer** | `src-tauri/target/release/bundle/msi/*.msi` |

## Prerequisite Verification Commands

```bash
# Node & npm
node -v        # expect v18+ / v20+
npm -v

# Rust
rustup --version
rustc --version
cargo --version

# WiX (must be on PATH)
candle -?      # WiX compiler
light -?       # WiX linker

# Tauri CLI (after npm install)
npx tauri --version
```

## Verification Checklist Commands

| Check | Command / Action |
|-------|------------------|
| Frontend builds cleanly | `npm run build` |
| Tests pass | `npm run test` |
| Linting clean | `npm run lint` |
| Proxy EXE compiles | `npm run build:proxy` |
| Resources copied | `npm run prepare:tauri` |
| MSI builds | `npm run build:tauri` |
| Fresh install works | Run MSI on clean machine/VM |
| App opens in browser | Desktop shortcut → browser tab |
| Health check responds | `curl http://127.0.0.1:5174/health` |
| Proxy routes work | Test API calls through the app |
| Uninstall is clean | No leftover files in Program Files |

## Troubleshooting (Error → Cause → Fix)

| Error text (example) | Likely root cause | Fix command / action |
|---|---|---|
| `Couldn't recognize the current folder as a Tauri project` | Missing `src-tauri/tauri.conf.json` and/or Cargo scaffold | Run repository preflight test, then restore scaffold files |
| `Error Can't read and decode source image` | Invalid icon source format when generating Tauri icons | Use a valid PNG source, regenerate icons, ensure `src-tauri/icons/icon.ico` exists |
| `` `icons/icon.ico` not found `` | Icon not generated or not bundled | Regenerate icons and verify `bundle.icon` paths in `tauri.conf.json` |
| `Missing parameter name at index 1: *` | Express 5 route parsing with brittle wildcard pattern | Replace `app.get('*')` fallback with middleware fallback `app.use(...)` |
| `Warning Babel parse has failed: import.meta` during `pkg` | ESM entrypoint can trigger `pkg` bytecode warnings | Prefer CJS-friendly proxy entry in packaging examples or accept warning if binary is produced |

