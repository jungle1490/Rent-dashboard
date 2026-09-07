#!/usr/bin/env python3
"""
租屋偵測系統
用法：
  python run.py              # 執行一次（從 config.yaml 或環境變數讀設定）
  python run.py --loop       # 每 15 分鐘執行一次（本機背景常駐）
"""
import argparse
import os
import time

import yaml

from notifier import TelegramNotifier
from scraper_591 import Scraper591
from state import GistState


def load_config(path: str = "config.yaml") -> dict:
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            cfg = yaml.safe_load(f)
    else:
        cfg = {}

    # 環境變數覆蓋（GitHub Actions secrets）
    if os.environ.get("TELEGRAM_TOKEN"):
        cfg.setdefault("telegram", {})["bot_token"] = os.environ["TELEGRAM_TOKEN"]
    if os.environ.get("TELEGRAM_CHAT_ID"):
        cfg.setdefault("telegram", {})["chat_id"] = os.environ["TELEGRAM_CHAT_ID"]
    if os.environ.get("GITHUB_PAT"):
        cfg.setdefault("github", {})["pat"] = os.environ["GITHUB_PAT"]
    if os.environ.get("GIST_ID"):
        cfg.setdefault("github", {})["gist_id"] = os.environ["GIST_ID"]

    return cfg


def run_once(config: dict) -> None:
    print("=== 開始偵測 ===")

    state = GistState(
        pat=config["github"]["pat"],
        gist_id=config["github"]["gist_id"],
    )
    notifier = TelegramNotifier(
        token=config["telegram"]["bot_token"],
        chat_id=config["telegram"]["chat_id"],
    )

    print("[state] 載入 Gist 狀態...")
    state.load()

    # --- 591 ---
    scraper = Scraper591(config=config)
    listings = scraper.run()

    new_count = 0
    for listing in listings:
        if not state.is_new_591(listing["id"]):
            continue
        msg = notifier.format_591(listing)
        if notifier.send(msg):
            state.mark_591(listing["id"])
            new_count += 1
            print(f"  ✓ 通知：{listing['title'][:35]}...")
        time.sleep(0.5)

    print(f"[591] 新物件通知 {new_count} 筆")

    state.save()
    print("=== 完成 ===\n")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--loop", action="store_true", help="持續每 N 分鐘執行")
    parser.add_argument("--config", default="config.yaml")
    args = parser.parse_args()

    config = load_config(args.config)

    if args.loop:
        interval = config.get("schedule", {}).get("interval_minutes", 15) * 60
        print(f"持續模式：每 {interval // 60} 分鐘執行一次")
        while True:
            try:
                run_once(config)
            except Exception as e:
                print(f"[錯誤] {e}")
            time.sleep(interval)
    else:
        run_once(config)


if __name__ == "__main__":
    main()
