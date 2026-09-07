"""GitHub Gist-backed state store for deduplication."""
import json
import requests


class GistState:
    API = "https://api.github.com/gists"
    FILENAME = "state.json"
    MAX_IDS = 500

    def __init__(self, pat: str, gist_id: str):
        self.gist_id = gist_id
        self.headers = {
            "Authorization": f"token {pat}",
            "Accept": "application/vnd.github+json",
        }
        self._state: dict = {"seen_591": [], "seen_threads": []}

    def load(self) -> None:
        resp = requests.get(f"{self.API}/{self.gist_id}", headers=self.headers, timeout=10)
        resp.raise_for_status()
        gist = resp.json()
        raw = gist["files"].get(self.FILENAME, {}).get("content", "{}")
        self._state = json.loads(raw)

    def save(self) -> None:
        # Keep only the most recent MAX_IDS entries
        for key in ("seen_591", "seen_threads"):
            self._state[key] = self._state.get(key, [])[-self.MAX_IDS:]

        content = json.dumps(self._state, ensure_ascii=False)
        payload = {"files": {self.FILENAME: {"content": content}}}
        resp = requests.patch(
            f"{self.API}/{self.gist_id}",
            headers=self.headers,
            json=payload,
            timeout=10,
        )
        resp.raise_for_status()

    def is_new_591(self, listing_id: str) -> bool:
        return listing_id not in self._state.get("seen_591", [])

    def is_new_thread(self, post_url: str) -> bool:
        return post_url not in self._state.get("seen_threads", [])

    def mark_591(self, listing_id: str) -> None:
        seen = self._state.setdefault("seen_591", [])
        if listing_id not in seen:
            seen.append(listing_id)

    def mark_thread(self, post_url: str) -> None:
        seen = self._state.setdefault("seen_threads", [])
        if post_url not in seen:
            seen.append(post_url)
