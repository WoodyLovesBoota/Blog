#!/usr/bin/env python3
"""
velog 글의 이미지를 내려받아 webp 로 최적화하고, md 안의 링크를 로컬 경로로 바꾼다.

사용법:
  python3 scripts/velog-images.py content/posts/<slug>.md

결과:
  public/images/<slug>/01.webp, 02.webp ...
  md 본문의 velog 이미지 URL → /images/<slug>/NN.webp
"""
import io
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image, ImageOps

MAX_WIDTH = 1600  # 본문 폭 대비 레티나 여유
QUALITY = 80

ROOT = Path(__file__).resolve().parent.parent
VELOG_HOSTS = ("velog.velcdn.com", "images.velog.io", "media.vlpt.us", "velog.io")

# ![alt](url) 과 <img src="url"> 둘 다 잡는다
MD_IMG = re.compile(r"!\[([^\]]*)\]\((\S+?)(?:\s+\"[^\"]*\")?\)")
HTML_IMG = re.compile(r"<img\s[^>]*?src=[\"']([^\"']+)[\"'][^>]*>", re.I)


def is_velog(url: str) -> bool:
    host = urllib.parse.urlparse(url).netloc
    return any(host == h or host.endswith("." + h) for h in VELOG_HOSTS)


def fetch(url: str) -> bytes:
    # 한글 파일명 등 비ASCII 경로를 안전하게 인코딩
    p = urllib.parse.urlsplit(url)
    safe = urllib.parse.urlunsplit(p._replace(path=urllib.parse.quote(urllib.parse.unquote(p.path))))
    req = urllib.request.Request(safe, headers={"User-Agent": "Mozilla/5.0 (blog-migration)"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def to_webp(data: bytes, out: Path) -> tuple[int, int]:
    im = Image.open(io.BytesIO(data))
    animated = getattr(im, "is_animated", False)
    if animated:
        frames, durations = [], []
        for i in range(im.n_frames):
            im.seek(i)
            f = im.convert("RGBA")
            if f.width > MAX_WIDTH:
                f = f.resize((MAX_WIDTH, round(f.height * MAX_WIDTH / f.width)), Image.LANCZOS)
            frames.append(f)
            durations.append(im.info.get("duration", 100))
        # 화면 녹화 GIF 는 lossy 가 오히려 커지기도 해서 여러 설정 중 가장 작은 것을 쓴다
        best = None
        for opts in ({"quality": QUALITY}, {"lossless": True}, {"quality": QUALITY, "allow_mixed": True}):
            buf = io.BytesIO()
            frames[0].save(buf, "WEBP", save_all=True, append_images=frames[1:],
                           duration=durations, loop=0, method=6, **opts)
            if best is None or buf.tell() < len(best):
                best = buf.getvalue()
        out.write_bytes(best)
        return frames[0].size
    im = ImageOps.exif_transpose(im)
    im = im.convert("RGBA" if im.mode in ("RGBA", "LA", "P") else "RGB")
    if im.width > MAX_WIDTH:
        im = im.resize((MAX_WIDTH, round(im.height * MAX_WIDTH / im.width)), Image.LANCZOS)
    im.save(out, "WEBP", quality=QUALITY, method=6)
    return im.size


def main(md_path: str) -> None:
    md = Path(md_path).resolve()
    slug = md.stem
    out_dir = ROOT / "public" / "images" / slug
    text = md.read_text(encoding="utf8")

    mapping: dict[str, str] = {}
    urls = [m.group(2) for m in MD_IMG.finditer(text)] + [m.group(1) for m in HTML_IMG.finditer(text)]
    for url in urls:
        if url in mapping or not is_velog(url):
            continue
        n = len(mapping) + 1
        out_dir.mkdir(parents=True, exist_ok=True)
        out = out_dir / f"{n:02d}.webp"
        data = fetch(url)
        w, h = to_webp(data, out)
        mapping[url] = f"/images/{slug}/{out.name}"
        print(f"  {n:02d}: {len(data)//1024}KB → {out.stat().st_size//1024}KB ({w}x{h})")

    if not mapping:
        print("velog 이미지 없음")
        return

    # <img> 태그는 마크다운 이미지 문법으로 통일
    def repl_html(m: re.Match) -> str:
        src = m.group(1)
        if src not in mapping:
            return m.group(0)
        alt = re.search(r"alt=[\"']([^\"']*)[\"']", m.group(0))
        return f"![{alt.group(1) if alt else ''}]({mapping[src]})"

    text = HTML_IMG.sub(repl_html, text)
    for src, local in mapping.items():
        text = text.replace(src, local)
    md.write_text(text, encoding="utf8")
    print(f"{len(mapping)}개 변환 → public/images/{slug}/")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
