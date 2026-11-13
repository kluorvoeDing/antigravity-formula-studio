#!/usr/bin/env node
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HTML_PATH = path.join(__dirname, "showreel.html");
const AUDIO_PATH = path.join(__dirname, "output", "soundtrack.wav");
const OUT_MP4 = path.join(__dirname, "output", "ANTIGRAVITY_SHOWREEL_2026.mp4");
const TOTAL_FRAMES = 1800;
const EXPECTED_BYTES = 1920 * 1080 * 4;

if (!fs.existsSync(AUDIO_PATH)) {
  console.error("Missing soundtrack.wav — run generate_audio.py first.");
  process.exit(1);
}

const htmlBytes = fs.readFileSync(HTML_PATH);
const tmpProfile = `/tmp/ag_showreel_chrome_${Date.now()}`;
fs.mkdirSync(tmpProfile, { recursive: true });

const ffmpeg = spawn("ffmpeg", [
  "-y",
  "-f", "rawvideo",
  "-pixel_format", "rgba",
  "-video_size", "1920x1080",
  "-framerate", "60",
  "-i", "pipe:0",
  "-i", AUDIO_PATH,
  "-vf", "vflip",
  "-c:v", "libx264",
  "-profile:v", "high",
  "-level:v", "4.2",
  "-crf", "15",
  "-preset", "medium",
  "-pix_fmt", "yuv420p",
  "-c:a", "aac",
  "-b:a", "320k",
  "-ar", "48000",
  "-t", "30.0",
  "-movflags", "+faststart",
  OUT_MP4,
], { stdio: ["pipe", "inherit", "pipe"] });

let ffErr = "";
ffmpeg.stderr.on("data", chunk => {
  ffErr += chunk.toString();
  if (ffErr.length > 8000) ffErr = ffErr.slice(-8000);
});

let frameCount = 0;
let chrome;
const tStart = Date.now();

function cleanup() {
  try { chrome?.kill("SIGKILL"); } catch {}
  try { fs.rmSync(tmpProfile, { recursive: true, force: true }); } catch {}
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  if (req.method === "GET" && url.pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(htmlBytes);
    return;
  }

  if (req.method === "POST" && url.pathname === "/frame") {
    const chunks = [];
    req.on("data", c => chunks.push(c));
    req.on("end", () => {
      const buf = Buffer.concat(chunks);
      if (buf.length !== EXPECTED_BYTES) {
        res.writeHead(400);
        res.end(`Bad frame size: ${buf.length}`);
        return;
      }
      frameCount++;
      if (frameCount % 150 === 0 || frameCount === TOTAL_FRAMES) {
        const elapsed = ((Date.now() - tStart) / 1000).toFixed(1);
        const pct = ((frameCount / TOTAL_FRAMES) * 100).toFixed(1);
        console.log(`[Render] Frame ${frameCount}/${TOTAL_FRAMES} (${pct}%) — ${elapsed}s`);
      }
      const ok = ffmpeg.stdin.write(buf);
      if (ok) {
        res.writeHead(200);
        res.end("ok");
      } else {
        ffmpeg.stdin.once("drain", () => {
          res.writeHead(200);
          res.end("ok");
        });
      }
    });
    return;
  }

  if (url.pathname === "/done") {
    res.writeHead(200);
    res.end("done");
    console.log(`[Render] All ${frameCount} frames captured. Finalizing MP4...`);
    ffmpeg.stdin.end();
    return;
  }

  if (url.pathname === "/err") {
    console.error("[Browser Error]", url.searchParams.get("msg"));
    res.writeHead(500);
    res.end("err");
    cleanup();
    process.exit(1);
  }

  res.writeHead(404);
  res.end("not found");
});

ffmpeg.on("close", code => {
  cleanup();
  server.close();
  if (code !== 0) {
    console.error("FFmpeg exited with code", code);
    console.error(ffErr);
    process.exit(code || 1);
  }
  const mb = (fs.statSync(OUT_MP4).size / (1024 * 1024)).toFixed(2);
  console.log(`[Done] Video written to ${OUT_MP4} (${mb} MB) in ${((Date.now() - tStart) / 1000).toFixed(1)}s`);
  process.exit(0);
});

server.listen(0, "127.0.0.1", () => {
  const { port } = server.address();
  const chromeBin = path.join(
    process.env.HOME,
    "Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell"
  );
  console.log(`[Render] Starting WebGL2 Metal capture at 1920x1080 @ 60fps (${TOTAL_FRAMES} frames)...`);
  chrome = spawn(chromeBin, [
    "--no-sandbox",
    `--user-data-dir=${tmpProfile}`,
    "--use-gl=angle",
    "--use-angle=metal",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    "--window-size=1920,1080",
    `http://127.0.0.1:${port}/?render=1`,
  ], { stdio: ["ignore", "ignore", "pipe"] });

  chrome.stderr.on("data", d => {
    const s = d.toString();
    if (s.includes("CONSOLE") || s.includes("ERROR:gl") || s.includes("FATAL")) {
      process.stderr.write(s);
    }
  });
});
