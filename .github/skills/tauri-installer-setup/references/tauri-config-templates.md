# Tauri Configuration Templates

Code examples for Phase 3 — Tauri shell wrapping the frontend + proxy.

## `src-tauri/tauri.conf.json`

```json
{
  "build": {
    "beforeBuildCommand": "",
    "beforeDevCommand": "",
    "devPath": "http://localhost:5173",
    "distDir": "../dist"
  },
  "package": {
    "productName": "My App",
    "version": "0.1.0"
  },
  "tauri": {
    "allowlist": {
      "shell": { "open": true },
      "dialog": { "message": true }
    },
    "bundle": {
      "active": true,
      "targets": ["msi"],
      "identifier": "com.myapp.app",
      "icon": ["icons/icon.ico"],
      "resources": [
        "resources/proxy/proxy.exe",
        "resources/web"
      ],
      "windows": {
        "wix": {
          "language": "en-US"
        }
      }
    },
    "windows": [
      {
        "title": "My App Launcher",
        "width": 480,
        "height": 320,
        "resizable": false,
        "fullscreen": false,
        "visible": false
      }
    ]
  }
}
```

## `src-tauri/Cargo.toml`

```toml
[package]
name = "my-app-launcher"
version = "0.1.0"
edition = "2021"

[build-dependencies]
tauri-build = { version = "1.5", features = [] }

[dependencies]
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tauri = { version = "1.6", features = ["dialog-message", "shell-open"] }

[features]
custom-protocol = ["tauri/custom-protocol"]
```

## `src-tauri/build.rs`

```rust
fn main() {
  tauri_build::build()
}
```

## Launcher — `src-tauri/src/main.rs`

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::net::TcpListener;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use tauri::{Manager, RunEvent};

struct ProxyState {
  child: Mutex<Option<Child>>,
  port: u16,
}

fn pick_port(start: u16, tries: u16) -> u16 {
  for offset in 0..tries {
    let port = start + offset;
    if TcpListener::bind(("127.0.0.1", port)).is_ok() {
      return port;
    }
  }
  start
}

fn main() {
  tauri::Builder::default()
    .setup(|app| {
      let proxy_path = app.path_resolver()
        .resolve_resource("resources/proxy/proxy.exe")
        .ok_or("Missing proxy")?;
      let static_dir = app.path_resolver()
        .resolve_resource("resources/web")
        .ok_or("Missing web resources")?;

      let port = pick_port(5174, 50);

      let child = Command::new(proxy_path)
        .env("PROXY_PORT", port.to_string())
        .env("PROXY_HOST", "0.0.0.0")
        .env("SERVE_STATIC", "true")
        .env("STATIC_DIR", static_dir.to_string_lossy().to_string())
        .spawn()
        .map_err(|e| e.to_string())?;

      app.manage(ProxyState {
        child: Mutex::new(Some(child)),
        port,
      });

      // Wait for /health, then open browser
      // ... (health polling + shell::open)

      Ok(())
    })
    .build(tauri::generate_context!())
    .expect("error while building tauri app")
    .run(|app_handle, event| {
      if let RunEvent::ExitRequested { .. } = event {
        let state = app_handle.state::<ProxyState>();
        if let Ok(mut guard) = state.child.lock() {
          if let Some(mut child) = guard.take() {
            let _ = child.kill();
          }
        }
      }
    });
}
```

## Resource Preparation Script — `scripts/prepare-tauri-resources.cjs`

```javascript
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const webDir = path.join(projectRoot, 'src-tauri', 'resources', 'web');

if (!fs.existsSync(distDir)) {
  console.error('Missing dist/. Run `npm run build` first.');
  process.exit(1);
}

fs.rmSync(webDir, { recursive: true, force: true });
fs.mkdirSync(webDir, { recursive: true });
fs.cpSync(distDir, webDir, { recursive: true });

console.log(`Copied ${distDir} → ${webDir}`);
```
