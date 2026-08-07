//! YolaCode Desktop — Tauri v2 wrapper que orquesta YolaCode + yola-daemon.
//!
//! Dos modos de operación:
//!   1. YOLA OS corriendo (daemon en :7779 responde) → YolaCode es una
//!      ventana más del OS, se conecta al daemon existente.
//!   2. Standalone (sin daemon) → lanza yola-daemon sidecar en :7779,
//!      con system tray, y YolaCode es el entorno completo.
//!
//! Flujo de arranque:
//!   1. Chequea health del daemon en :7779 (timeout 2s)
//!   2. Si no responde: busca yola-daemon sidecar junto al ejecutable
//!   3. Si no existe sidecar: error nativo y cierre
//!   4. Si existe: lanza proceso con --port 7779 --foreground
//!   5. Espera en loop (máx 90s, 500ms) hasta health OK
//!   6. Muestra ventana principal con YolaCode
//!   7. Al cerrar: mata el daemon hijo (si fue lanzado por nosotros)

use std::path::PathBuf;
use std::process::{Child, Command};
use std::sync::Mutex;
use std::time::{Duration, Instant};

use tauri::menu::{MenuBuilder, MenuItemBuilder};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::Manager;

/// Estado compartido: guarda el proceso hijo del daemon (si fue lanzado por nosotros).
struct DaemonState {
    child: Mutex<Option<Child>>,
}

const DAEMON_PORT: u16 = 7779;
const DAEMON_TIMEOUT_SECS: u64 = 90;
const DAEMON_POLL_MS: u64 = 500;

// ── Health Check ────────────────────────────────────────────────────────────

fn check_daemon_health(port: u16) -> bool {
    let url = format!("http://localhost:{}/global/health", port);
    let client = match reqwest::blocking::Client::builder()
        .timeout(Duration::from_secs(2))
        .build()
    {
        Ok(c) => c,
        Err(_) => return false,
    };

    match client.get(&url).send() {
        Ok(resp) => resp.status().is_success(),
        Err(_) => false,
    }
}

// ── Sidecar Discovery ───────────────────────────────────────────────────────

fn find_daemon() -> Option<PathBuf> {
    let exe_path = std::env::current_exe().ok()?;
    let exe_dir = exe_path.parent()?;

    let daemon_name = format!("yola-daemon{}", std::env::consts::EXE_SUFFIX);

    let candidates = vec![
        exe_dir.join(&daemon_name),
        exe_dir.join("resources").join(&daemon_name),
    ];

    for path in candidates {
        if path.exists() {
            return Some(path);
        }
    }
    None
}

// ── Daemon Launch ───────────────────────────────────────────────────────────

fn launch_daemon(sidecar_path: &std::path::Path, port: u16) -> Result<Child, String> {
    let mut cmd = Command::new(sidecar_path);
    cmd.args(["start", "--port", &port.to_string(), "--foreground"])
       .env("YOLA_BIND", "0.0.0.0");

    cmd.spawn()
        .map_err(|e| format!("No se pudo iniciar el daemon: {}", e))
}

fn wait_for_daemon(port: u16, max_wait: Duration, poll_interval: Duration) -> bool {
    let start = Instant::now();
    loop {
        if check_daemon_health(port) {
            return true;
        }
        if start.elapsed() >= max_wait {
            return false;
        }
        std::thread::sleep(poll_interval);
    }
}

// ── Daemon Lifecycle ────────────────────────────────────────────────────────

fn kill_daemon(state: &DaemonState) {
    if let Ok(mut guard) = state.child.lock() {
        if let Some(ref mut child) = *guard {
            eprintln!("[YolaCode] Deteniendo daemon (PID {})...", child.id());
            let _ = child.kill();
            let _ = child.wait();
            *guard = None;
            eprintln!("[YolaCode] Daemon detenido.");
        }
    }
}

// ── Tauri App Entry Point ───────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            println!("[YolaCode] Iniciando YolaCode Desktop...");

            // ── System Tray ─────────────────────────────────────────────
            let show_item = MenuItemBuilder::with_id("show", "Mostrar YolaCode").build(app)?;
            let quit_item = MenuItemBuilder::with_id("quit", "Salir").build(app)?;
            let tray_menu = MenuBuilder::new(app)
                .item(&show_item)
                .item(&quit_item)
                .build()?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&tray_menu)
                .tooltip("YolaCode")
                .on_menu_event(|app_handle, event| {
                    match event.id().as_ref() {
                        "show" => {
                            if let Some(window) = app_handle.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "quit" => {
                            app_handle.exit(0);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            // ── Daemon ──────────────────────────────────────────────────
            if check_daemon_health(DAEMON_PORT) {
                println!(
                    "[YolaCode] Daemon detectado en :{} — conectando como app del OS.",
                    DAEMON_PORT
                );
            } else {
                println!("[YolaCode] Sin daemon en :{} — iniciando en modo standalone.", DAEMON_PORT);

                let daemon_path = find_daemon().ok_or_else(|| {
                    eprintln!("[YolaCode] ERROR: yola-daemon no encontrado junto al ejecutable.");
                    "yola-daemon no encontrado. Reinstala la aplicación."
                })?;

                println!("[YolaCode] Lanzando daemon: {:?}", daemon_path);

                let child = launch_daemon(&daemon_path, DAEMON_PORT).map_err(|e| {
                    eprintln!("[YolaCode] ERROR: {}", e);
                    e
                })?;

                // Guardar referencia para matarlo al salir
                app.manage(DaemonState {
                    child: Mutex::new(Some(child)),
                });

                // Esperar a que el daemon esté listo
                let max_wait = Duration::from_secs(DAEMON_TIMEOUT_SECS);
                let poll = Duration::from_millis(DAEMON_POLL_MS);

                if !wait_for_daemon(DAEMON_PORT, max_wait, poll) {
                    eprintln!("[YolaCode] ERROR: El daemon no arrancó en {}s.", DAEMON_TIMEOUT_SECS);
                    let state = app.state::<DaemonState>();
                    kill_daemon(&state);
                    return Err("El daemon no respondió a tiempo. Revisa los logs.".into());
                }

                println!("[YolaCode] Daemon listo en :{} — YolaCode standalone activo.", DAEMON_PORT);
            }

            // ── Mostrar ventana ─────────────────────────────────────────
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                // Ocultar en vez de cerrar (el tray permite salir de verdad)
                let app = window.app_handle();
                if let Some(state) = app.try_state::<DaemonState>() {
                    // Standalone: el daemon es nuestro, lo matamos al salir
                    // Pero solo ocultamos la ventana, el tray decide cuándo salir
                    let _ = window.hide();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error al iniciar YolaCode Desktop");
}
