import re
from playwright.sync_api import sync_playwright, Page

TARGET_DISTRICTS = ["內湖區", "中山區", "大安區", "信義區", "松山區"]
EXTRA_AREA_KEYWORDS = ["民生社區", "民生東路", "仁愛路", "網球中心", "大直"]

SEARCH_URL = (
    "https://rent.591.com.tw/list"
    "?region=1&other=near_subway"
    "&rentprice={min},{max}"
    "&kind={kind}"
)

LAYOUT_CODE = {"整層住家": "1", "套房": "2", "雅房": "3"}


def _parse_price(text: str) -> int:
    m = re.search(r"([\d,]+)元", text)
    if m:
        return int(m.group(1).replace(",", ""))
    return 0


def _parse_area(text: str) -> str:
    m = re.search(r"([\d.]+)坪", text)
    return f"{m.group(1)}坪" if m else ""


def _parse_address(text: str) -> str:
    # 格式通常是「社區名-行政區-路段」或「行政區-路段」
    parts = text.split("\n")
    for p in parts:
        p = p.strip()
        if any(d in p for d in TARGET_DISTRICTS):
            return p
    return parts[0].strip() if parts else ""


def _extract_cards(page: Page) -> list[dict]:
    page.wait_for_selector(".recommend-ware", timeout=15000)
    cards = page.query_selector_all(".recommend-ware")
    results = []
    for card in cards:
        link = card.query_selector("a[href*='/2']")
        if not link:
            continue
        href = link.get_attribute("href") or ""
        post_id = re.search(r"/(\d{7,})", href)
        if not post_id:
            continue

        all_text = card.inner_text()
        lines = [l.strip() for l in all_text.splitlines() if l.strip()]

        price_text = card.query_selector("[class*='price'],[class*='rent-price']")
        price = _parse_price(price_text.inner_text() if price_text else all_text)

        tags = [
            t.inner_text().strip()
            for t in card.query_selector_all(".tag,[class*='tag']")
            if t.inner_text().strip()
        ]

        title_el = card.query_selector(".content a,.ware-title,h2,h3")
        title = title_el.inner_text().strip() if title_el else (lines[2] if len(lines) > 2 else "")

        # 找站距資訊
        station_dist = ""
        for line in lines:
            if "距" in line and ("公尺" in line or "站" in line):
                station_dist = line
                break

        results.append({
            "id": post_id.group(1),
            "title": title,
            "price": price,
            "area": _parse_area(all_text),
            "address": _parse_address(all_text),
            "station_dist": station_dist,
            "tags": tags,
            "url": href,
            "source": "591",
        })
    return results


class Scraper591:
    def __init__(self, config: dict):
        self.config = config

    def _build_url(self) -> str:
        rent = self.config.get("rent", {})
        kinds = ",".join(
            LAYOUT_CODE[l]
            for l in self.config.get("layout", [])
            if l in LAYOUT_CODE
        )
        return SEARCH_URL.format(
            min=rent.get("min", 0),
            max=rent.get("max", 99999),
            kind=kinds,
        )

    def _in_target_area(self, listing: dict) -> bool:
        addr = listing["address"] + listing["title"] + " ".join(listing.get("tags", []))
        if any(d in addr for d in TARGET_DISTRICTS):
            return True
        if any(kw in addr for kw in EXTRA_AREA_KEYWORDS):
            return True
        return False

    def _passes_filter(self, listing: dict) -> bool:
        if not self._in_target_area(listing):
            return False
        text = listing["title"] + listing["address"]
        for kw in self.config.get("blacklist", []):
            if kw in text:
                return False
        return True

    def run(self) -> list[dict]:
        url = self._build_url()
        print(f"[591] 載入：{url}")

        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True)
            page = browser.new_page(
                user_agent=(
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/120.0.0.0 Safari/537.36"
                )
            )
            page.goto(url, wait_until="domcontentloaded", timeout=30000)

            listings = _extract_cards(page)
            browser.close()

        filtered = [l for l in listings if self._passes_filter(l)]
        print(f"[591] 抓到 {len(listings)} 筆 → 符合條件 {len(filtered)} 筆")
        return filtered
