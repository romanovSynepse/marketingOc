#!/usr/bin/env python3
"""SynOC · клонировщик рилсов: скачать → клоны по рецепту А → проверка уникальности.

Методика: reels/klonirovshik.md (рецепт А — раздел 3, метаданные — 5, хук — 6, уникальность — 7).
Нужны ffmpeg/ffprobe; Pillow — только для скруглённых углов рамки (без него углы прямые).

Команды:
  python3 reel_clone.py fetch <ссылка-или-shortcode> [--out DIR]
  python3 reel_clone.py clone <файл> [-n 3] [--out DIR] [--hook "текст" ...] [--seed N]
  python3 reel_clone.py check <файл> --against <файл-или-папка> [...]
  python3 reel_clone.py run   <ссылка|shortcode|файл> [-n 3] [--out DIR] [--hook ...] [--against ...]

Переменные окружения:
  HIKERAPI_KEY           ключ HikerAPI (для fetch/run по ссылке)
  HIKERAPI_BASE          по умолчанию https://api.hikerapi.com
  HIKERAPI_MEDIA_EP      по умолчанию /v1/media/by/url  (параметр url=)
  HIKERAPI_CODE_EP       по умолчанию /v1/media/by/code (параметр code=)
"""
from __future__ import annotations

import argparse
import glob
import hashlib
import json
import os
import random
import re
import shutil
import ssl
import subprocess
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request

OUT_W, OUT_H, FPS = 1080, 1920, 30
FONT_CANDIDATES = [
    "/usr/share/fonts/opentype/inter/Inter-Medium.otf",
    "/usr/share/fonts/opentype/inter/Inter-Regular.otf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
]
# Пастельные рамки: у каждого клона пачки свой оттенок.
PASTELS = {
    "голубой": "#cfe3f5", "лавандовый": "#e2d9f3", "мятный": "#d3efe2", "песочный": "#efe3cf",
    "персиковый": "#f6dccd", "розовый": "#f4d7e0", "лимонный": "#f2efc9", "серо-голубой": "#d8dee8",
    "оливковый": "#e1e6cf", "сиреневый": "#ead6ee",
}
FRAME_POSITIONS = (0.10, 0.25, 0.40, 0.55, 0.70, 0.85)
VIDEO_EXT = (".mp4", ".mov", ".m4v", ".webm", ".mkv")


# ── утилиты ─────────────────────────────────────────────────────────────────

def die(msg: str) -> None:
    print(f"✗ {msg}", file=sys.stderr)
    sys.exit(1)


def run(cmd: list[str], capture: bool = False) -> bytes:
    res = subprocess.run(cmd, stdout=subprocess.PIPE if capture else subprocess.DEVNULL,
                         stderr=subprocess.PIPE)
    if res.returncode != 0:
        tail = res.stderr.decode(errors="replace").strip().splitlines()[-12:]
        raise RuntimeError(f"{cmd[0]} завершился с ошибкой:\n" + "\n".join(tail))
    return res.stdout if capture else b""


def need_tools() -> None:
    for tool in ("ffmpeg", "ffprobe"):
        if not shutil.which(tool):
            die(f"не найден {tool}")


def probe(path: str) -> dict:
    raw = run(["ffprobe", "-v", "error", "-print_format", "json", "-show_format", "-show_streams", path],
              capture=True)
    info = json.loads(raw)
    v = next((s for s in info["streams"] if s["codec_type"] == "video"), None)
    if not v:
        raise RuntimeError(f"{path}: нет видеодорожки")
    return {
        "duration": float(info["format"].get("duration") or v.get("duration") or 0),
        "width": int(v["width"]), "height": int(v["height"]),
        "has_audio": any(s["codec_type"] == "audio" for s in info["streams"]),
    }


def ssl_context() -> ssl.SSLContext:
    for var in ("SSL_CERT_FILE", "REQUESTS_CA_BUNDLE", "NODE_EXTRA_CA_CERTS"):
        path = os.environ.get(var)
        if path and os.path.exists(path):
            return ssl.create_default_context(cafile=path)
    return ssl.create_default_context()


def http_get(url: str, headers: dict | None = None) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "synoc-reel-clone/1.0", **(headers or {})})
    try:
        with urllib.request.urlopen(req, context=ssl_context(), timeout=120) as r:
            return r.read()
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")[:300]
        raise RuntimeError(f"GET {url.split('?')[0]} → HTTP {e.code}: {body}") from None
    except urllib.error.URLError as e:
        raise RuntimeError(f"GET {url.split('?')[0]} → {e.reason}. Проверьте Allowed domains окружения.") from None


# ── fetch: HikerAPI ─────────────────────────────────────────────────────────

SHORTCODE_RE = re.compile(r"instagram\.com/(?:[^/]+/)?(?:reel|reels|p|tv)/([A-Za-z0-9_-]+)")


def shortcode_of(ref: str) -> str | None:
    m = SHORTCODE_RE.search(ref)
    if m:
        return m.group(1)
    return ref if re.fullmatch(r"[A-Za-z0-9_-]{6,20}", ref) else None


def find_video_url(obj) -> str | None:
    """Ищет ссылку на видео в ответе HikerAPI любой формы."""
    if isinstance(obj, list):
        for item in obj:
            found = find_video_url(item)
            if found:
                return found
        return None
    if not isinstance(obj, dict):
        return None
    for key in ("video_url", "video_dash_url"):
        if isinstance(obj.get(key), str) and obj[key].startswith("http"):
            return obj[key]
    versions = obj.get("video_versions")
    if isinstance(versions, list) and versions:
        best = max((v for v in versions if isinstance(v, dict) and v.get("url")),
                   key=lambda v: (v.get("width") or 0) * (v.get("height") or 0), default=None)
        if best:
            return best["url"]
    for key in ("media", "item", "items", "data", "carousel_media", "resources"):
        if key in obj:
            found = find_video_url(obj[key])
            if found:
                return found
    return None


def hiker_media(ref: str) -> dict:
    key = os.environ.get("HIKERAPI_KEY")
    if not key:
        die("нет HIKERAPI_KEY в окружении. Добавьте его в Environment variables и откройте новую сессию.")
    base = os.environ.get("HIKERAPI_BASE", "https://api.hikerapi.com").rstrip("/")
    headers = {"x-access-key": key, "accept": "application/json"}
    code = shortcode_of(ref)
    attempts = []
    if ref.startswith("http"):
        attempts.append((os.environ.get("HIKERAPI_MEDIA_EP", "/v1/media/by/url"), {"url": ref}))
    if code:
        attempts.append((os.environ.get("HIKERAPI_CODE_EP", "/v1/media/by/code"), {"code": code}))
    if not attempts:
        die(f"не понял ссылку: {ref}")
    errors = []
    for ep, params in attempts:
        try:
            return json.loads(http_get(f"{base}{ep}?{urllib.parse.urlencode(params)}", headers))
        except (RuntimeError, json.JSONDecodeError) as e:
            errors.append(str(e))
    raise RuntimeError("HikerAPI не отдал ролик:\n  " + "\n  ".join(errors))


def cmd_fetch(ref: str, out_dir: str) -> str:
    os.makedirs(out_dir, exist_ok=True)
    media = hiker_media(ref)
    video_url = find_video_url(media)
    if not video_url:
        raise RuntimeError("в ответе HikerAPI нет ссылки на видео (это не рилс или пост без видео?)")
    name = shortcode_of(ref) or hashlib.sha1(ref.encode()).hexdigest()[:10]
    path = os.path.join(out_dir, f"{name}.mp4")
    with open(path, "wb") as f:
        f.write(http_get(video_url))
    with open(os.path.join(out_dir, f"{name}.hiker.json"), "w") as f:
        json.dump(media, f, ensure_ascii=False, indent=1)
    info = probe(path)
    print(f"✓ скачано: {path} · {info['duration']:.1f} с · {info['width']}×{info['height']}")
    return path


# ── clone: рецепт А ─────────────────────────────────────────────────────────

def rounded_mask(w: int, h: int, radius: int, path: str) -> bool:
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        return False
    img = Image.new("L", (w, h), 0)
    ImageDraw.Draw(img).rounded_rectangle((0, 0, w - 1, h - 1), radius=radius, fill=255)
    img.save(path)
    return True


def recipe_params(rng: random.Random, color_name: str) -> dict:
    border = rng.randrange(44, 65, 2)
    return {
        "frame": color_name,
        "frame_hex": PASTELS[color_name],
        "border_px": border,
        "radius_px": rng.randint(30, 38),
        "base_zoom": round(rng.uniform(1.02, 1.04), 3),          # постоянный кроп: своя точка кадра
        "zoom_max": round(rng.uniform(1.05, 1.07), 3),           # общий потолок зума — 1,07 (методика)
        "zoom_period_s": round(rng.uniform(8.0, 10.0), 2),     # вход-выход зума: смена плана ~4–5 с
        "zoom_phase": round(rng.uniform(0, 6.283), 3),
        "pan_period_s": round(rng.uniform(9.0, 14.0), 2),
        "pan_phase": round(rng.uniform(0, 6.283), 3),
        "pan_dir": rng.choice([1, -1]),
        "focus_x": round(rng.uniform(0.25, 0.75), 3),
        "focus_y": round(rng.uniform(0.25, 0.75), 3),
        "speed": round(rng.uniform(0.994, 1.010), 4),
        "contrast": round(1 + rng.choice([1, -1]) * rng.uniform(0.03, 0.07), 3),
        "saturation": round(1 + rng.choice([1, -1]) * rng.uniform(0.03, 0.07), 3),
        "temperature": round(rng.choice([1, -1]) * rng.uniform(0.02, 0.05), 3),  # >0 тепло, <0 холод
        "eq_gain_db": round(rng.choice([1, -1]) * rng.uniform(0.8, 1.8), 2),
        "trim_start_s": round(rng.uniform(0.10, 0.30), 2),
    }


def build_clone(src: str, dst: str, p: dict, hook: str | None, info: dict, tmp: str) -> None:
    b = p["border_px"]
    iw, ih = OUT_W - 2 * b, OUT_H - 2 * b
    bz = p["base_zoom"]
    z, zp, zph = p["zoom_max"] / bz - 1, p["zoom_period_s"], p["zoom_phase"]
    pp, pph, pdir = p["pan_period_s"], p["pan_phase"], p["pan_dir"]
    zoom = f"({bz}*(1+{z:.4f}*(0.5-0.5*cos(2*PI*t/{zp}+{zph}))))"
    t = p["temperature"]
    vf = [
        f"setpts=PTS/{p['speed']}", f"fps={FPS}",
        f"scale={iw}:{ih}:force_original_aspect_ratio=increase:flags=bicubic",
        f"crop={iw}:{ih}",
        f"scale=w='trunc({iw}*{zoom}/2)*2':h='trunc({ih}*{zoom}/2)*2':eval=frame:flags=bicubic",
        f"crop={iw}:{ih}:x='(iw-{iw})*clip({p['focus_x']}+{pdir}*0.25*sin(2*PI*t/{pp}+{pph}),0,1)'"
        f":y='(ih-{ih})*{p['focus_y']}'",
        f"eq=contrast={p['contrast']}:saturation={p['saturation']}",
        f"colorbalance=rm={t}:gm={t / 3:.3f}:bm={-t}",
        "format=yuva420p",
    ]
    inputs = ["-ss", str(p["trim_start_s"]), "-i", src,
              "-f", "lavfi", "-i", f"color=c={p['frame_hex']}:s={OUT_W}x{OUT_H}:r={FPS}"]
    graph = f"[0:v]{','.join(vf)}[v]"
    mask = os.path.join(tmp, "mask.png")
    if rounded_mask(iw, ih, p["radius_px"], mask):
        inputs += ["-loop", "1", "-i", mask]
        graph += f";[2:v]format=gray,fps={FPS}[m];[v][m]alphamerge[vr]"
        vlabel = "vr"
    else:
        vlabel = "v"
    graph += f";[1:v][{vlabel}]overlay={b}:{b}:shortest=1:format=auto[o]"
    if hook:
        font = next((f for f in FONT_CANDIDATES if os.path.exists(f)), None)
        hook_file = os.path.join(tmp, "hook.txt")
        with open(hook_file, "w") as f:
            f.write(hook)
        fontopt = f"fontfile={font}:" if font else ""
        graph += (f";[o]drawtext={fontopt}textfile={hook_file}:fontsize=56:fontcolor=white"
                  f":x=(w-text_w)/2:y=h*0.17:shadowcolor=black@0.55:shadowx=0:shadowy=2"
                  f":enable='lt(t,3)'[o2]")
        vout = "o2"
    else:
        vout = "o"
    graph += f";[{vout}]format=yuv420p[vout]"
    cmd = ["ffmpeg", "-y", "-hide_banner", *inputs, "-filter_complex", graph, "-map", "[vout]"]
    if info["has_audio"]:
        cmd += ["-map", "0:a:0", "-af",
                f"atempo={p['speed']},equalizer=f=3000:t=q:w=1:g={p['eq_gain_db']}",
                "-c:a", "aac", "-b:a", "160k", "-ar", "48000"]
    cmd += [
        "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p", "-r", str(FPS),
        "-bsf:v", "filter_units=remove_types=6",          # убрать SEI с подписью x264
        "-map_metadata", "-1", "-map_chapters", "-1",
        "-metadata:s:v:0", "encoder=", "-metadata:s:v:0", "handler_name=",
        "-metadata:s:a:0", "handler_name=", "-metadata:s:a:0", "encoder=",
        "-fflags", "+bitexact", "-flags:v", "+bitexact", "-flags:a", "+bitexact",
        "-movflags", "+faststart", "-shortest", dst,
    ]
    run(cmd)
    scrub_compressor_name(dst)


def scrub_compressor_name(path: str) -> None:
    """mov-муксер пишет «Lavc libx264» в поле compressorname (32 байта в avc1). Зануляем его на месте."""
    with open(path, "r+b") as f:
        head = f.read(1 << 20)
        i = head.find(b"Lavc")
        if i > 0 and head[i - 1] == len(head[i:head.find(b"\0", i)]):
            f.seek(i - 1)
            f.write(b"\0" * (head[i - 1] + 1))


def metadata_clean(path: str) -> bool:
    with open(path, "rb") as f:
        data = f.read()
    return not any(s in data for s in (b"x264", b"Lavf", b"Lavc", b"ffmpeg", b"creation_time"))


def cmd_clone(src: str, n: int, out_dir: str, hooks: list[str], seed: int | None) -> list[dict]:
    need_tools()
    info = probe(src)
    os.makedirs(out_dir, exist_ok=True)
    base = os.path.splitext(os.path.basename(src))[0]
    seed = seed if seed is not None else int(hashlib.sha1(open(src, "rb").read(1 << 20)).hexdigest()[:8], 16)
    rng = random.Random(seed)
    colors = rng.sample(list(PASTELS), k=min(n, len(PASTELS)))
    results = []
    for i in range(n):
        p = recipe_params(rng, colors[i % len(colors)])
        hook = hooks[i] if i < len(hooks) else (hooks[-1] if hooks else None)
        dst = os.path.join(out_dir, f"{base}_A{i + 1:02d}.mp4")
        with tempfile.TemporaryDirectory() as tmp:
            build_clone(src, dst, p, hook, info, tmp)
        rec = {"file": dst, "hook": hook, "params": p, "metadata_clean": metadata_clean(dst)}
        with open(dst[:-4] + ".json", "w") as f:
            json.dump(rec, f, ensure_ascii=False, indent=1)
        print(f"✓ {os.path.basename(dst)} · рамка {p['frame']} {p['border_px']}px · зум ≤{p['zoom_max']}"
              f" · скорость ×{p['speed']} · метаданные {'чистые' if rec['metadata_clean'] else 'НЕ чистые'}")
        results.append(rec)
    return results


# ── check: уникальность 1–10 ────────────────────────────────────────────────

def dhash_frames(path: str) -> list[int]:
    dur = probe(path)["duration"]
    hashes = []
    for pos in FRAME_POSITIONS:
        raw = run(["ffmpeg", "-v", "error", "-ss", f"{dur * pos:.3f}", "-i", path, "-frames:v", "1",
                   "-vf", "scale=9:8:flags=area,format=gray", "-f", "rawvideo", "-"], capture=True)
        if len(raw) < 72:
            continue
        bits = 0
        for r in range(8):
            for c in range(8):
                bits = (bits << 1) | (raw[r * 9 + c] > raw[r * 9 + c + 1])
        hashes.append(bits)
    return hashes


def bits_to_score(avg_bits: float) -> int:
    """Средняя разница кадров (бит из 64) → шкала 1–10 методики.
    Опорные точки из reels/klonirovshik.md: Стандарт ~4 бит («похож»), рецепт А — 7–8 баллов,
    Ультра 10–18 бит, зеркало — 10. Калибровать по реальным клонам."""
    return max(1, min(10, round(1 + 0.75 * avg_bits)))


def verdict(score: int) -> str:
    if score <= 3:
        return "копия — не выкладываем"
    if score <= 5:
        return "похож — перемонтировать"
    if score <= 7:
        return "уникален — можно выкладывать"
    return "сильно уникален"


def expand(paths: list[str], exclude: str) -> list[str]:
    files = []
    for p in paths:
        if os.path.isdir(p):
            files += [f for f in sorted(glob.glob(os.path.join(p, "*"))) if f.lower().endswith(VIDEO_EXT)]
        elif os.path.exists(p):
            files.append(p)
    ex = os.path.abspath(exclude)
    return [f for f in dict.fromkeys(files) if os.path.abspath(f) != ex]


def cmd_check(path: str, against: list[str], quiet: bool = False) -> dict:
    need_tools()
    refs = expand(against, path)
    if not refs:
        die("не с чем сравнивать: укажите исходник и прошлые клоны в --against")
    mine = dhash_frames(path)
    nearest = None
    for ref in refs:
        other = dhash_frames(ref)
        k = min(len(mine), len(other))
        if not k:
            continue
        avg = sum(bin(a ^ b).count("1") for a, b in zip(mine[:k], other[:k])) / k
        if nearest is None or avg < nearest[1]:
            nearest = (ref, avg)
    if nearest is None:
        die("не удалось снять кадры для сравнения")
    score = bits_to_score(nearest[1])
    res = {"file": path, "nearest": nearest[0], "avg_bits": round(nearest[1], 1), "score": score,
           "verdict": verdict(score), "ok": score >= 6}
    if not quiet:
        print(f"{'✓' if res['ok'] else '✗'} {os.path.basename(path)}: {score}/10 — {res['verdict']}"
              f" (ближайший: {os.path.basename(nearest[0])}, {res['avg_bits']} бит)")
    return res


# ── run: всё сразу ──────────────────────────────────────────────────────────

def cmd_run(ref: str, n: int, out_dir: str, hooks: list[str], against: list[str], seed: int | None) -> None:
    src = ref if os.path.exists(ref) else cmd_fetch(ref, os.path.join(out_dir, "source"))
    clones = cmd_clone(src, n, os.path.join(out_dir, "clones"), hooks, seed)
    # Жадный отбор: каждый клон сравниваем с исходником, прошлыми клонами и уже принятыми из этой пачки.
    print("\nПроверка уникальности (против исходника, прошлых клонов и принятых из этой пачки):")
    report, accepted = [], []
    for c in clones:
        chk = cmd_check(c["file"], [src, *against, *accepted])
        if chk["ok"]:
            accepted.append(c["file"])
        report.append({**c, "check": chk})
    with open(os.path.join(out_dir, "report.json"), "w") as f:
        json.dump(report, f, ensure_ascii=False, indent=1)
    ok = sum(r["check"]["ok"] for r in report)
    print(f"\nИтог: {ok} из {len(report)} клонов можно выкладывать (балл ≥ 6). Отчёт: {out_dir}/report.json")


def main() -> None:
    ap = argparse.ArgumentParser(description="SynOC: скачать → клоны по рецепту А → уникальность")
    sub = ap.add_subparsers(dest="cmd", required=True)
    f = sub.add_parser("fetch", help="скачать рилс через HikerAPI")
    f.add_argument("ref")
    f.add_argument("--out", default="work/source")
    c = sub.add_parser("clone", help="сделать клоны по рецепту А")
    c.add_argument("src")
    c.add_argument("-n", type=int, default=3)
    c.add_argument("--out", default="work/clones")
    c.add_argument("--hook", action="append", default=[], help="хук на первые 3 с; можно несколько — по одному на клон")
    c.add_argument("--seed", type=int)
    k = sub.add_parser("check", help="уникальность 1–10 против исходника и прошлых клонов")
    k.add_argument("file")
    k.add_argument("--against", nargs="+", required=True)
    r = sub.add_parser("run", help="скачать (если ссылка) → клоны → проверка")
    r.add_argument("ref")
    r.add_argument("-n", type=int, default=3)
    r.add_argument("--out", default="work")
    r.add_argument("--hook", action="append", default=[])
    r.add_argument("--against", nargs="*", default=[], help="прошлые клоны этого источника (файлы или папки)")
    r.add_argument("--seed", type=int)
    a = ap.parse_args()
    try:
        if a.cmd == "fetch":
            cmd_fetch(a.ref, a.out)
        elif a.cmd == "clone":
            cmd_clone(a.src, a.n, a.out, a.hook, a.seed)
        elif a.cmd == "check":
            cmd_check(a.file, a.against)
        else:
            cmd_run(a.ref, a.n, a.out, a.hook, a.against, a.seed)
    except RuntimeError as e:
        die(str(e))


if __name__ == "__main__":
    main()
