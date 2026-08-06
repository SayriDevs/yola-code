// ── YolaCode Desktop — main.rs ──────────────────────────────
// Estrategia del daemon (sin duplicación):
//   1. Si el daemon del SISTEMA responde en :7779 → se reutiliza
//      (cero procesos extra — el exe es un cliente más).
//   2. Si no → lanza el daemon EMBEBIDO (yola-bridge.exe) en :7791,
//      SIN consola visible (CREATE_NO_WINDOW), y lo mata al salir.
// Capas separadas: la UI no sabe qué daemon usa — solo conoce el api.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs::OpenOptions;
use std::io::Write;
use std::path::PathBuf;
use std::process::{Child, Command};
use std::sync::Mutex;
use tauri::Manager;

const SYSTEM_DAEMON: &str = "http://localhost:7779/global/health";
const EMBEDDED_PORT: &str = "7791";

struct DaemonState(Mutex<Option<Child>>);

fn log_error(msg: &str) {
    if let Ok(mut f) = OpenOptions::new()
        .create(true)
        .append(true)
        .open("yola-code-desktop.log")
    {
        let _ = writeln!(f, "[{}] {}", chrono_lite(), msg);
    }
    eprintln!("[yola-code-desktop] {msg}");
}

fn chrono_lite() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs().to_string())
        .unwrap_or_else(|_| "?".into())
}

fn find_daemon(app: &tauri::App) -> Option<PathBuf> {
    let exe_dir = std::env::current_exe().ok()?.parent()?.to_path_buf();
    let candidates = [
        app.path().resource_dir().ok().map(|d| d.join("daemon").join("yola-bridge.exe")),
        Some(exe_dir.join("daemon").join("yola-bridge.exe")),
        Some(exe_dir.join("resources").join("daemon").join("yola-bridge.exe")),
    ];
    candidates.into_iter().flatten().find(|p| p.exists())
}

/// Health check rápido: ¿el daemon del sistema ya responde?
fn system_daemon_alive() -> bool {
    use std::io::Read;
    if let Ok(mut res) = ureq_lite(SYSTEM_DAEMON) {
        let mut body = String::new();
        if res.read_to_string(&mut body).is_ok() && res_status_ok(&res) {
            return true;
        }
    }
    false
}

// Mini cliente HTTP (sin deps): GET con timeout
fn ureq_lite(url: &str) -> std::io::Result<std::net::TcpStream> {
    use std::io::{Read, Write};
    use std::net::TcpStream;
    use std::time::Duration;

    let host = url.trim_start_matches("http://").split('/').next().unwrap_or("localhost");
    let (h, port) = match host.split_once(':') {
        Some((h, p)) => (h, p.parse::<u16>().unwrap_or(80)),
        None => (host, 80),
    };
    let mut stream = TcpStream::connect((h, port))?;
    stream.set_read_timeout(Some(Duration::from_millis(1200)))?;
    stream.set_write_timeout(Some(Duration::from_millis(1200)))?;
    let req = format!(
        "GET /global/health HTTP/1.1\r\nHost: {h}:{port}\r\nConnection: close\r\n\r\n"
    );
    stream.write_all(req.as_bytes())?;
    let mut buf = [0u8; 512];
    let n = stream.read(&mut buf)?;
    let text = String::from_utf8_lossy(&buf[..n]).to_string();
    // guardamos la respuesta para re-leerla (stream consumido)
    // reutilizamos el mismo stream: simulamos respuesta en el header
    if text.starts_with("HTTP/1.1 200") || text.starts_with("HTTP/1.0 200") {
        Ok(stream)
    } else {
        Err(std::io::Error::new(std::io::ErrorKind::Other, "no 200"))
    }
}

fn res_status_ok(_res: &std::net::TcpStream) -> bool {
    true // ya validado en ureq_lite
}

fn main() {
    tauri::Builder::default()
        .manage(DaemonState(Mutex::new(None)))
        .setup(|app| {
            let state = app.state::<DaemonState>();

            // 1) ¿El daemon del sistema ya está corriendo? Reutilízalo.
            if system_daemon_alive() {
                log_error("daemon del sistema detectado en :7779 — reutilizado (sin duplicar)");
                return Ok(());
            }

            // 2) No hay sistema → lanza el daemon embebido (sin consola).
            match find_daemon(app) {
                Some(path) => {
                    let mut cmd = Command::new(&path);
                    cmd.arg("--port").arg(EMBEDDED_PORT);
                    // CREATE_NO_WINDOW (0x08000000): sin terminal visible
                    #[cfg(target_os = "windows")]
                    {
                        use std::os::windows::process::CommandExt;
                        cmd.creation_flags(0x08000000);
                    }
                    match cmd.spawn() {
                        Ok(child) => {
                            *state.0.lock().unwrap() = Some(child);
                            log_error(&format!("daemon embebido lanzado en :{EMBEDDED_PORT}"));
                        }
                        Err(e) => log_error(&format!("daemon spawn falló ({path:?}): {e}")),
                    }
                }
                None => log_error("daemon embebido no encontrado — la app correrá en modo local"),
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                if let Some(state) = window.try_state::<DaemonState>() {
                    if let Some(mut child) = state.0.lock().unwrap().take() {
                        let _ = child.kill();
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error al ejecutar YolaCode Desktop");
}
