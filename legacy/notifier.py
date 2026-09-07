import requests


class TelegramNotifier:
    def __init__(self, token: str, chat_id: str):
        self.token = token
        self.chat_id = chat_id
        self.api = f"https://api.telegram.org/bot{token}"

    def send(self, text: str) -> bool:
        payload = {
            "chat_id": self.chat_id,
            "text": text,
            "parse_mode": "HTML",
            "disable_web_page_preview": False,
        }
        try:
            resp = requests.post(f"{self.api}/sendMessage", json=payload, timeout=10)
            resp.raise_for_status()
            return True
        except Exception as e:
            print(f"[Telegram] send error: {e}")
            return False

    def format_591(self, listing: dict) -> str:
        price = f"{listing['price']:,}" if listing["price"] else "?"
        area = f"｜{listing['area']}" if listing.get("area") else ""
        address = listing.get("address") or "（地址未公開）"
        dist = f"\n🚇 {listing['station_dist']}" if listing.get("station_dist") else ""
        return (
            f"🏠 <b>[591] 近捷運</b>{area}\n"
            f"💰 月租 <b>${price}</b>\n"
            f"📍 {address}{dist}\n"
            f"🔗 <a href=\"{listing['url']}\">{listing['title']}</a>"
        )

    def format_thread(self, post: dict) -> str:
        price = f"${post['price']:,}" if post.get("price") else "未標示"
        location = post.get("location") or "未標示"
        contact = f"\n📞 {post['contact']}" if post.get("contact") else ""
        return (
            f"🧵 <b>[Threads] #台北租屋</b>\n"
            f"💰 月租 {price}｜{location}{contact}\n"
            f"🔗 <a href=\"{post['url']}\">查看貼文</a>"
        )
