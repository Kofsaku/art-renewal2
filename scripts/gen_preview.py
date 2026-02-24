#!/usr/bin/env python3
"""
gen_preview.py

Thymeleaf テンプレートから静的 HTML プレビューを自動生成します。
テンプレートを編集したらこのスクリプトを実行してください。

依存ライブラリ: なし（Python 3.6+ 標準ライブラリのみ）

使い方:
    python3 scripts/gen_preview.py                   # 全ページ生成
    python3 scripts/gen_preview.py statusMonitor     # 特定ページのみ生成
"""

import re
import sys
from pathlib import Path

# ── パス設定 ─────────────────────────────────────────────────────────────────
ROOT          = Path(__file__).resolve().parent.parent
TEMPLATES_DIR = ROOT / "resources" / "templates"
OUTPUT_DIR    = ROOT / "resources"
LAYOUT_PATH   = TEMPLATES_DIR / "layout" / "layout.html"

# ── 対象ページ（ページ名: テンプレートの相対パス） ────────────────────────────
PAGES = {
    "statusMonitor":        "statusMonitor/index.html",
    "dataMonitor":          "dataMonitor/index.html",
    "personalList":         "personalList/index.html",
    "personalRegistration": "personalRegistration/index.html",
    "historyReport":        "historyReport/index.html",
    "mapMonitor":           "mapMonitor/index.html",
    "home":                 "home/index.html",
}

# ── @{/path} → 静的 URL マッピング ───────────────────────────────────────────
ROUTE_MAP = {
    "/home":                 "/index.html",
    "/statusMonitor":        "/resources/statusMonitor-preview.html",
    "/dataMonitor":          "/resources/dataMonitor-preview.html",
    "/personalList":         "/resources/personalList-preview.html",
    "/personalRegistration": "/resources/personalRegistration-preview.html",
    "/historyReport":        "/resources/historyReport-preview.html",
    "/mapMonitor":           "/resources/mapMonitor-preview.html",
    "/gateRegistration":     "#",
    "/initial":              "#",
    "/logout":               "#",
    "/gate":                 "#",
    "/gateEdit":             "#",
    "/device":               "#",
    "/tenant":               "#",
}

# webjars → CDN マッピング
WEBJAR_MAP = {
    "/webjars/bootstrap/5.3.0/css/bootstrap.min.css":
        "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css",
    "/webjars/bootstrap/5.3.0/js/bootstrap.min.js":
        "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js",
}


# ── URL 解決 ─────────────────────────────────────────────────────────────────
def resolve_path(path: str) -> str:
    """@{/path} 形式のパスを静的 URL に変換する"""
    if path in ROUTE_MAP:
        return ROUTE_MAP[path]
    if path in WEBJAR_MAP:
        return WEBJAR_MAP[path]
    # CSS / JS / images など
    return f"/resources/static{path}"


# ── フラグメント抽出 ──────────────────────────────────────────────────────────
def find_fragment(html: str, fragment_name: str):
    """
    layout:fragment="fragment_name" を持つ要素全体（開始〜終了タグ）を返す。
    Returns: (outer_html: str | None, tag_name: str | None)
    """
    marker = f'layout:fragment="{fragment_name}"'
    attr_pos = html.find(marker)
    if attr_pos == -1:
        return None, None

    # 属性の直前にある '<' = 開始タグの先頭
    tag_start = html.rfind('<', 0, attr_pos)
    if tag_start == -1:
        return None, None

    # タグ名を取得
    tag_match = re.match(r'<(\w+)', html[tag_start:])
    if not tag_match:
        return None, None
    tag_name = tag_match.group(1)

    # 開始タグの終端 '>' を探す
    tag_open_end = html.find('>', attr_pos) + 1
    if tag_open_end == 0:
        return None, None

    # 自己終了タグ (<tag ... />) の場合
    if html[tag_open_end - 2:tag_open_end] == '/>':
        return html[tag_start:tag_open_end], tag_name

    # ネストに対応して対応する閉じタグを探す
    depth = 1
    pos = tag_open_end
    open_pat  = re.compile(rf'<{re.escape(tag_name)}(?:\s|>)', re.IGNORECASE)
    close_pat = re.compile(rf'</{re.escape(tag_name)}>', re.IGNORECASE)

    while pos < len(html) and depth > 0:
        om = open_pat.search(html, pos)
        cm = close_pat.search(html, pos)

        if not cm:
            break

        if om and om.start() < cm.start():
            depth += 1
            pos = om.end()
        else:
            depth -= 1
            if depth == 0:
                return html[tag_start:cm.end()], tag_name
            pos = cm.end()

    return None, None


def extract_section(html: str, tag: str) -> str:
    """<tag>...</tag> の中身（innerHTML）を返す"""
    m = re.search(rf'<{tag}[^>]*>(.*?)</{tag}>', html, re.DOTALL | re.IGNORECASE)
    return m.group(1) if m else ""


# ── Thymeleaf 属性の変換・除去 ────────────────────────────────────────────────
def sub_thymeleaf(html: str) -> str:
    """Thymeleaf 属性を静的 HTML 用に変換・除去する"""

    # th:href="@{/path}" → href="..."
    html = re.sub(
        r'th:href="@\{([^}]+)\}"',
        lambda m: f'href="{resolve_path(m.group(1))}"',
        html
    )

    # th:src="@{/path}" → src="..."
    html = re.sub(
        r'th:src="@\{([^}]+)\}"',
        lambda m: f'src="{resolve_path(m.group(1))}"',
        html
    )

    # <link> タグで誤って src= になったものを href= に修正
    html = re.sub(
        r'(<link\b[^>]*)src=("(?:[^"]+)")',
        r'\1href=\2',
        html
    )

    # 除去する属性（前後スペースごと削除）
    DROP_ATTRS = [
        r'layout:decorate="[^"]*"',
        r'layout:fragment="[^"]*"',
        r'layout:replace="[^"]*"',
        r'th:remove="[^"]*"',
        r'th:inline="[^"]*"',
        r'th:content="[^"]*"',
        r'th:text="[^"]*"',
        r'th:value="[^"]*"',
        r'th:onclick="[^"]*"',
        r'sec:authorize="[^"]*"',
        r'xmlns:th="[^"]*"',
        r'xmlns:layout="[^"]*"',
        r'xmlns:sec="[^"]*"',
        r'xmlns="[^"]*"',
    ]
    for pat in DROP_ATTRS:
        html = re.sub(r'\s*' + pat, '', html)

    # <th:block> / </th:block> を除去（中身は保持）
    html = re.sub(r'<th:block[^>]*>', '', html)
    html = re.sub(r'</th:block>', '', html)

    # CSRF hidden input を除去
    html = re.sub(r'<input[^>]+serverErrorMessage[^>]*/?\s*>', '', html)

    return html


# ── 合成 ─────────────────────────────────────────────────────────────────────
def compose(layout_path: Path, page_path: Path) -> str:
    """レイアウト + ページテンプレートを合成して静的 HTML を返す"""

    layout = layout_path.read_text(encoding="utf-8")
    page   = page_path.read_text(encoding="utf-8")

    # ① ページ <head> の <style> / <title> をレイアウトの </head> 直前に挿入
    page_head = extract_section(page, "head")
    extras = re.findall(
        r'<(?:style|title)[^>]*>.*?</(?:style|title)>',
        page_head,
        re.DOTALL | re.IGNORECASE
    )
    if extras:
        layout = layout.replace("</head>", "\n".join(extras) + "\n</head>", 1)

    # ② フラグメントを置換（header-controls / content / page-legend）
    for frag_name in ["header-controls", "content", "page-legend"]:
        page_elem,   _ = find_fragment(page,   frag_name)
        layout_elem, _ = find_fragment(layout, frag_name)

        if page_elem and layout_elem:
            # layout 側に th:remove="tag" がある場合、page 側の外側タグを除去
            if 'th:remove="tag"' in layout_elem:
                inner = re.sub(
                    r'^<[^>]+>\s*', '', page_elem, count=1)   # 開始タグ除去
                inner = re.sub(
                    r'\s*</\w+>\s*$', '', inner, count=1)     # 終了タグ除去
                layout = layout.replace(layout_elem, inner, 1)
            else:
                layout = layout.replace(layout_elem, page_elem, 1)
        elif layout_elem:
            layout = layout.replace(layout_elem, "", 1)

    # ③ ページ <body> 内のスクリプトを </body> 直前に追加
    page_body = extract_section(page, "body")
    scripts = re.findall(
        r'<script(?:\s[^>]*)?>.*?</script>',
        page_body,
        re.DOTALL
    )
    if scripts:
        layout = layout.replace("</body>", "\n".join(scripts) + "\n</body>", 1)

    # ④ Thymeleaf 属性を変換・除去
    result = sub_thymeleaf(layout)

    # ⑤ DOCTYPE を先頭に整形
    result = re.sub(r'<!DOCTYPE[^>]*>\s*', '', result, flags=re.IGNORECASE)
    result = "<!DOCTYPE html>\n" + result.lstrip()

    return result


# ── エントリポイント ──────────────────────────────────────────────────────────
def main():
    target = sys.argv[1] if len(sys.argv) > 1 else None
    targets = {k: v for k, v in PAGES.items() if not target or k == target}

    if target and not targets:
        print(f"エラー: '{target}' は対象ページに含まれていません")
        print(f"対象: {', '.join(PAGES.keys())}")
        sys.exit(1)

    print(f"生成先: {OUTPUT_DIR.relative_to(ROOT)}/")
    success = 0

    for name, rel in targets.items():
        page_path = TEMPLATES_DIR / rel
        if not page_path.exists():
            print(f"  スキップ: {name} (テンプレートなし: {rel})")
            continue

        out_path = OUTPUT_DIR / f"{name}-preview.html"
        try:
            html = compose(LAYOUT_PATH, page_path)
            out_path.write_text(html, encoding="utf-8")
            print(f"  ✓ {out_path.name}")
            success += 1
        except Exception as e:
            print(f"  ✗ {name}: {e}")
            import traceback; traceback.print_exc()

    print(f"\n完了: {success} / {len(targets)} ページ生成")


if __name__ == "__main__":
    main()
