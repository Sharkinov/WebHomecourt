r"""Stress test for WebHomecourt and its Supabase backend.

Run from the repository root:

    stresstest\venv\Scripts\locust.exe -f stresstest\locustfile.py

Useful environment variables:

    STRESS_APP_URL=http://localhost:5173
    STRESS_SUPABASE_URL=https://<project-ref>.supabase.co
    STRESS_SUPABASE_ANON_KEY=<anon-or-publishable-key>
    STRESS_CREATE_ACCOUNTS=true
    STRESS_EMAIL_DOMAIN=example.com
    STRESS_ENABLE_WRITES=true
    STRESS_INITIAL_CREDITS=5000
    STRESS_MAX_EVENTS_PER_USER=1
    STRESS_MAX_PACKS_PER_USER=1

For hosted Supabase projects with email confirmation enabled, provide confirmed
test accounts instead of creating accounts during the run:

    STRESS_TEST_USERS=[{"email":"load1@example.com","password":"Password1!"}]

The script never uses a service-role key. It does not visit Dunk Royale or call
its tables/RPCs. Writes create identifiable LOCUST data, so run this only
against infrastructure you own or are authorized to test.
"""

from __future__ import annotations

import json
import logging
import os
import random
import threading
import time
import uuid
from datetime import datetime, timedelta, timezone
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.parse import quote, urljoin, urlparse

from locust import HttpUser, between, task
from locust.exception import StopUser
from websocket import WebSocket, create_connection


LOGGER = logging.getLogger(__name__)
ROOT = Path(__file__).resolve().parents[1]


def load_env_file(path: Path) -> None:
    """Load simple KEY=VALUE entries without requiring python-dotenv."""
    if not path.exists():
        return

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip("'\""))


load_env_file(ROOT / "stresstest" / ".env")


def env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def load_test_users() -> list[dict[str, str]]:
    raw = os.getenv("STRESS_TEST_USERS", "").strip()
    if not raw:
        email = os.getenv("STRESS_TEST_EMAIL", "").strip()
        password = os.getenv("STRESS_TEST_PASSWORD", "").strip()
        return [{"email": email, "password": password}] if email and password else []

    try:
        users = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise RuntimeError("STRESS_TEST_USERS must be valid JSON") from exc

    if not isinstance(users, list):
        raise RuntimeError("STRESS_TEST_USERS must be a JSON array")

    valid_users = []
    for user in users:
        if isinstance(user, dict) and user.get("email") and user.get("password"):
            valid_users.append(
                {"email": str(user["email"]), "password": str(user["password"])}
            )
    return valid_users


class AssetParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.assets: list[str] = []

    def handle_starttag(
        self, tag: str, attrs: list[tuple[str, str | None]]
    ) -> None:
        values = dict(attrs)
        path = values.get("src") if tag in {"script", "img"} else values.get("href")
        if path and not path.startswith(("http://", "https://", "data:", "#")):
            self.assets.append(path)


class CredentialPool:
    def __init__(self, users: list[dict[str, str]]) -> None:
        self.users = users
        self.index = 0
        self.lock = threading.Lock()

    def next(self) -> dict[str, str] | None:
        if not self.users:
            return None
        with self.lock:
            user = self.users[self.index % len(self.users)]
            self.index += 1
        return user.copy()


class SharedChatGame:
    """Cache the active game so thousands of users do not query it separately."""

    def __init__(self) -> None:
        self.game_id: int | None = int(CHAT_GAME_ID) if CHAT_GAME_ID else None
        self.checked = bool(CHAT_GAME_ID)
        self.lock = threading.Lock()


SUPABASE_URL = (
    os.getenv("STRESS_SUPABASE_URL")
    or ""
).rstrip("/")
SUPABASE_KEY = (
    os.getenv("STRESS_SUPABASE_ANON_KEY")
    or ""
)
CREATE_ACCOUNTS = env_bool("STRESS_CREATE_ACCOUNTS", True)
ENABLE_WRITES = env_bool("STRESS_ENABLE_WRITES", True)
EMAIL_DOMAIN = os.getenv("STRESS_EMAIL_DOMAIN", "example.com")
DEFAULT_PASSWORD = os.getenv("STRESS_NEW_USER_PASSWORD", "StressTest1!")
INITIAL_CREDITS = int(os.getenv("STRESS_INITIAL_CREDITS", "5000"))
MAX_EVENTS_PER_USER = int(os.getenv("STRESS_MAX_EVENTS_PER_USER", "1"))
MAX_PACKS_PER_USER = int(os.getenv("STRESS_MAX_PACKS_PER_USER", "1"))
REALTIME_TIMEOUT = float(os.getenv("STRESS_REALTIME_TIMEOUT", "10"))
CHAT_GAME_ID = os.getenv("STRESS_CHAT_GAME_ID", "").strip()
TEST_RUN_ID = os.getenv(
    "STRESS_RUN_ID", datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
)
CREDENTIALS = CredentialPool(load_test_users())
CHAT_GAME = SharedChatGame()


class WebUser(HttpUser):
    host = os.getenv("STRESS_APP_URL", "http://localhost:5173")
    wait_time = between(1, 4)

    frontend_routes = (
        "/",
        "/agenda",
        "/brackets",
        "/estadisticas",
        "/lakerscourt",
        "/store",
        "/perfil",
        "/my-friends",
        "/wrapped",
        "/comparison",
        "/historial-lakers",
        "/collection",
        "/login",
        "/register",
    )

    access_token: str | None = None
    refresh_token: str | None = None
    user_id: str | None = None
    email: str | None = None
    password: str | None = None
    created_account = False
    created_events = 0
    purchased_packs = 0
    discovered_assets: list[str] = []
    realtime_socket: WebSocket | None = None
    realtime_topic: str | None = None
    realtime_join_ref: str | None = None
    realtime_ref = 0
    realtime_last_heartbeat = 0.0

    def on_start(self) -> None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            LOGGER.error(
                "Missing STRESS_SUPABASE_URL/STRESS_SUPABASE_ANON_KEY "
                "(or VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY in WebHomecourt/.env)"
            )
            raise StopUser()

        # Discover the chat room before signup traffic saturates Auth/PostgREST.
        self.active_chat_game_id()

        if CREATE_ACCOUNTS:
            unique = uuid.uuid4().hex[:12]
            self.email = f"locust-{TEST_RUN_ID}-{unique}@{EMAIL_DOMAIN}"
            self.password = DEFAULT_PASSWORD
            self.signup()
        else:
            credential = CREDENTIALS.next()
            if credential:
                self.email = credential["email"]
                self.password = credential["password"]
                self.login()
            else:
                LOGGER.warning(
                    "No test credentials configured; this user will run anonymous traffic."
                )

        self.load_frontend_assets()

    def base_headers(self) -> dict[str, str]:
        return {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {self.access_token or SUPABASE_KEY}",
            "Content-Type": "application/json",
        }

    def api_request(
        self,
        method: str,
        path: str,
        *,
        name: str,
        expected: tuple[int, ...] = (200,),
        **kwargs: Any,
    ):
        headers = self.base_headers()
        headers.update(kwargs.pop("headers", {}))

        with self.client.request(
            method,
            f"{SUPABASE_URL}{path}",
            headers=headers,
            name=name,
            catch_response=True,
            **kwargs,
        ) as response:
            if response.status_code not in expected:
                detail = response.text[:300].replace("\n", " ")
                response.failure(f"HTTP {response.status_code}: {detail}")
            return response

    def save_session(self, payload: dict[str, Any]) -> bool:
        self.access_token = payload.get("access_token")
        self.refresh_token = payload.get("refresh_token")
        user = payload.get("user") or {}
        self.user_id = user.get("id")
        return bool(self.access_token and self.user_id)

    def signup(self) -> None:
        response = self.api_request(
            "POST",
            "/auth/v1/signup",
            name="Auth: signup",
            expected=(200, 201),
            json={"email": self.email, "password": self.password},
        )
        if response.status_code not in (200, 201):
            return

        payload = response.json()
        self.created_account = True
        if self.save_session(payload):
            self.complete_profile()
            return

        # Hosted projects normally require email confirmation. The signup itself
        # is still measured; authenticated tasks wait for a confirmed account.
        LOGGER.info(
            "Account %s requires email confirmation; continuing anonymously.",
            self.email,
        )

    def login(self) -> None:
        response = self.api_request(
            "POST",
            "/auth/v1/token?grant_type=password",
            name="Auth: password login",
            expected=(200,),
            json={"email": self.email, "password": self.password},
        )
        if response.status_code == 200:
            self.save_session(response.json())

    def complete_profile(self) -> None:
        if not self.user_id:
            return

        suffix = self.user_id.replace("-", "")[:12]
        payload = {
            "user_id": self.user_id,
            "username": f"locust_{suffix}",
            "nickname": f"Locust {suffix[:6]}",
            "birthdate": "1995-06-01",
            "gender": 1,
            "notifications": False,
            "online": False,
        }
        self.api_request(
            "POST",
            "/rest/v1/user_laker?on_conflict=user_id",
            name="Profile: complete registration",
            expected=(200, 201, 204),
            headers={"Prefer": "resolution=merge-duplicates,return=minimal"},
            json=payload,
        )
        if ENABLE_WRITES and INITIAL_CREDITS > 0:
            self.rpc(
                "add_user_credits",
                {"p_user_id": self.user_id, "p_credits": INITIAL_CREDITS},
                name="Profile: seed test credits",
                expected=(200, 204),
            )

    def load_frontend_assets(self) -> None:
        response = self.client.get("/", name="Frontend: home")
        if response.status_code != 200 or self.discovered_assets:
            return

        parser = AssetParser()
        parser.feed(response.text)
        type(self).discovered_assets = list(dict.fromkeys(parser.assets))

    @task(8)
    def browse_frontend(self) -> None:
        route = random.choice(self.frontend_routes)
        self.client.get(route, name=f"Frontend: {route}")

        if self.discovered_assets:
            for asset in random.sample(
                self.discovered_assets, min(2, len(self.discovered_assets))
            ):
                self.client.get(urljoin(self.host, asset), name="Frontend: static asset")

    @task(5)
    def public_home_data(self) -> None:
        rpc = random.choice(
            (
                "get_last_game_id",
                "get_recent_news",
                "get_packs_store",
                "get_lakers_players",
            )
        )
        self.api_request(
            "POST",
            f"/rest/v1/rpc/{rpc}",
            name=f"RPC: {rpc}",
            json={},
        )

    @task(3)
    def public_catalog_data(self) -> None:
        resource, params = random.choice(
            (
                ("court", {"select": "court_id,name,direction", "limit": "50"}),
                (
                    "skill_level",
                    {"select": "skill_level_id,description", "order": "skill_level_id"},
                ),
                (
                    "question",
                    {"select": "*", "winner": "is.null", "order": "start_date", "limit": "5"},
                ),
            )
        )
        self.api_request(
            "GET",
            f"/rest/v1/{resource}",
            name=f"Table: {resource}",
            params=params,
        )

    @task(3)
    def agenda_data(self) -> None:
        now = datetime.now(timezone.utc)
        self.api_request(
            "POST",
            "/rest/v1/rpc/get_agenda_games",
            name="RPC: get_agenda_games",
            json={"p_year": now.year, "p_month": now.month},
        )

    @task(6)
    def authenticated_dashboard(self) -> None:
        if not self.user_id:
            return

        operation = random.choice(
            (
                "profile",
                "stats",
                "history",
                "events",
                "collection_summary",
                "card_collection",
                "ratings",
                "friend_chats",
            )
        )

        if operation == "profile":
            self.api_request(
                "GET",
                "/rest/v1/user_laker",
                name="Profile: current user",
                params={"select": "*", "user_id": f"eq.{self.user_id}", "limit": "1"},
            )
        elif operation == "stats":
            self.rpc("get_user_stats", {"p_user_id": self.user_id})
        elif operation == "history":
            self.rpc("get_user_match_history", {"p_user_id": self.user_id})
        elif operation == "events":
            self.rpc("get_available_events", {"p_user_id": self.user_id})
        elif operation == "collection_summary":
            self.rpc("collection_summary", {"p_user_id": self.user_id})
        elif operation == "card_collection":
            self.rpc("card_collection", {"p_user_id": self.user_id})
        elif operation == "ratings":
            self.rpc("get_pending_rating_full", {"p_user_id": self.user_id})
        elif operation == "friend_chats":
            self.rpc("get_friend_chats", {"p_user_id": self.user_id})

    def rpc(
        self,
        function_name: str,
        payload: dict[str, Any],
        *,
        name: str | None = None,
        expected: tuple[int, ...] = (200,),
    ):
        return self.api_request(
            "POST",
            f"/rest/v1/rpc/{function_name}",
            name=name or f"RPC: {function_name}",
            expected=expected,
            json=payload,
        )

    def schema_get(
        self,
        schema: str,
        resource: str,
        *,
        name: str,
        params: dict[str, str],
    ):
        return self.api_request(
            "GET",
            f"/rest/v1/{resource}",
            name=name,
            headers={"Accept-Profile": schema},
            params=params,
        )

    def record_realtime(
        self,
        name: str,
        started_at: float,
        *,
        response_length: int = 0,
        exception: Exception | None = None,
    ) -> None:
        self.environment.events.request.fire(
            request_type="WS",
            name=name,
            response_time=(time.perf_counter() - started_at) * 1000,
            response_length=response_length,
            exception=exception,
            context={},
        )

    def next_realtime_ref(self) -> str:
        self.realtime_ref += 1
        return str(self.realtime_ref)

    def receive_realtime_reply(
        self,
        expected_ref: str,
        *,
        expect_broadcast: bool = False,
    ) -> tuple[bool, int]:
        if not self.realtime_socket:
            return False, 0

        received_bytes = 0
        got_reply = False
        got_broadcast = not expect_broadcast
        deadline = time.monotonic() + REALTIME_TIMEOUT
        while time.monotonic() < deadline and not (got_reply and got_broadcast):
            raw = self.realtime_socket.recv()
            received_bytes += len(raw)
            message = json.loads(raw)
            if message.get("event") == "phx_reply" and message.get("ref") == expected_ref:
                got_reply = message.get("payload", {}).get("status") == "ok"
            if message.get("event") == "broadcast":
                payload = message.get("payload", {})
                got_broadcast = payload.get("event") == "message"
        return got_reply and got_broadcast, received_bytes

    def connect_realtime(self, game_id: int) -> bool:
        topic = f"realtime:chat:game-{game_id}"
        if self.realtime_socket and self.realtime_topic == topic:
            return True

        self.close_realtime()
        parsed = urlparse(SUPABASE_URL)
        websocket_scheme = "wss" if parsed.scheme == "https" else "ws"
        websocket_url = (
            f"{websocket_scheme}://{parsed.netloc}/realtime/v1/websocket"
            f"?apikey={quote(SUPABASE_KEY)}&vsn=1.0.0"
        )
        started_at = time.perf_counter()
        try:
            self.realtime_socket = create_connection(
                websocket_url,
                timeout=REALTIME_TIMEOUT,
            )
            self.realtime_topic = topic
            join_ref = self.next_realtime_ref()
            self.realtime_join_ref = join_ref
            join_message = {
                "topic": topic,
                "event": "phx_join",
                "payload": {
                    "config": {
                        "broadcast": {"ack": True, "self": True},
                        "presence": {"enabled": False},
                        "postgres_changes": [],
                        "private": False,
                    },
                },
                "ref": join_ref,
                "join_ref": join_ref,
            }
            if self.access_token:
                join_message["payload"]["access_token"] = self.access_token
            self.realtime_socket.send(json.dumps(join_message))
            ok, received_bytes = self.receive_realtime_reply(join_ref)
            if not ok:
                raise RuntimeError("Realtime channel rejected phx_join")
            self.realtime_last_heartbeat = time.monotonic()
            self.record_realtime(
                "Realtime chat: connect and subscribe",
                started_at,
                response_length=received_bytes,
            )
            return True
        except Exception as exc:
            self.record_realtime(
                "Realtime chat: connect and subscribe",
                started_at,
                exception=exc,
            )
            self.close_realtime()
            return False

    def heartbeat_realtime(self) -> None:
        if (
            not self.realtime_socket
            or time.monotonic() - self.realtime_last_heartbeat < 20
        ):
            return
        heartbeat_ref = self.next_realtime_ref()
        self.realtime_socket.send(
            json.dumps(
                {
                    "topic": "phoenix",
                    "event": "heartbeat",
                    "payload": {},
                    "ref": heartbeat_ref,
                    "join_ref": None,
                }
            )
        )
        self.receive_realtime_reply(heartbeat_ref)
        self.realtime_last_heartbeat = time.monotonic()

    def close_realtime(self) -> None:
        if not self.realtime_socket:
            return
        try:
            leave_ref = self.next_realtime_ref()
            self.realtime_socket.send(
                json.dumps(
                    {
                        "topic": self.realtime_topic,
                        "event": "phx_leave",
                        "payload": {},
                        "ref": leave_ref,
                        "join_ref": self.realtime_join_ref,
                    }
                )
            )
            self.realtime_socket.close()
        except Exception:
            pass
        finally:
            self.realtime_socket = None
            self.realtime_topic = None
            self.realtime_join_ref = None

    def active_chat_game_id(self) -> int | None:
        if CHAT_GAME.checked:
            return CHAT_GAME.game_id

        with CHAT_GAME.lock:
            if CHAT_GAME.checked:
                return CHAT_GAME.game_id
            response = self.schema_get(
                "simulacion_juego",
                "v_marcador_activo",
                name="Realtime chat: discover active game",
                params={"select": "game_id", "order": "start_date.desc", "limit": "1"},
            )
            if response.status_code == 200 and response.json():
                CHAT_GAME.game_id = int(response.json()[0]["game_id"])
                CHAT_GAME.checked = True
            elif response.status_code == 200:
                CHAT_GAME.checked = True
                LOGGER.warning(
                    "No active game found. Set STRESS_CHAT_GAME_ID to test a specific room."
                )
            return CHAT_GAME.game_id

    @task(8)
    def realtime_chat_flow(self) -> None:
        if not self.user_id or not self.access_token:
            return
        game_id = self.active_chat_game_id()
        if game_id is None or not self.connect_realtime(game_id):
            return

        started_at = time.perf_counter()
        try:
            self.heartbeat_realtime()
            message_ref = self.next_realtime_ref()
            outgoing = {
                "id": f"{int(time.time() * 1000)}-{uuid.uuid4().hex[:7]}",
                "username": (
                    f"Locust {self.user_id[:6]}" if self.user_id else "Locust Stress Test"
                ),
                "message": (
                    f"LOCUST realtime test {TEST_RUN_ID} "
                    f"{datetime.now().strftime('%H:%M:%S')}"
                ),
                "created_at": datetime.now(timezone.utc).isoformat(),
                "game_id": game_id,
            }
            self.realtime_socket.send(
                json.dumps(
                    {
                        "topic": self.realtime_topic,
                        "event": "broadcast",
                        "payload": {
                            "type": "broadcast",
                            "event": "message",
                            "payload": outgoing,
                        },
                        "ref": message_ref,
                        "join_ref": self.realtime_join_ref,
                    }
                )
            )
            ok, received_bytes = self.receive_realtime_reply(
                message_ref,
                expect_broadcast=True,
            )
            if not ok:
                raise RuntimeError("Realtime broadcast was not acknowledged/received")
            self.record_realtime(
                "Realtime chat: broadcast and receive",
                started_at,
                response_length=received_bytes,
            )
        except Exception as exc:
            self.record_realtime(
                "Realtime chat: broadcast and receive",
                started_at,
                exception=exc,
            )
            self.close_realtime()

    @task(3)
    def wrapped_flow(self) -> None:
        """Load the same datasets used by every Wrapped card."""
        self.client.get("/wrapped", name="Frontend: /wrapped")

        game = self.schema_get(
            "simulacion_juego",
            "game",
            name="Wrapped: last finished game",
            params={
                "select": "game_id,venue,start_date,won,opposing_team_id",
                "game_end_time": "not.is.null",
                "order": "start_date.desc",
                "limit": "1",
            },
        )
        if game.status_code != 200 or not game.json():
            return

        game_row = game.json()[0]
        game_id = game_row["game_id"]
        opposing_team_id = game_row["opposing_team_id"]
        self.schema_get(
            "simulacion_juego",
            "team",
            name="Wrapped: team logos",
            params={
                "select": "team_id,team_name,abreviatura,logo_url",
                "team_id": f"in.(1,{opposing_team_id})",
            },
        )
        self.schema_get(
            "simulacion_juego",
            "team_player_stats",
            name="Wrapped: game and MVP stats",
            params={
                "select": (
                    "points,assists,rebounds,team_player_id,"
                    "team_player(team_id,first_name,last_name,photo_url)"
                ),
                "game_id": f"eq.{game_id}",
            },
        )
        self.api_request(
            "GET",
            "/rest/v1/wrap_backgrounds",
            name="Wrapped: backgrounds",
            params={
                "select": "wrap_backgrounds_id,label,poster_url,display_order",
                "order": "display_order",
            },
        )

    @task(2)
    def create_lakerscourt_event(self) -> None:
        if (
            not ENABLE_WRITES
            or not self.user_id
            or self.created_events >= MAX_EVENTS_PER_USER
        ):
            return

        courts = self.api_request(
            "GET",
            "/rest/v1/court",
            name="LakersCourt: choose court",
            params={"select": "court_id", "allow_court": "eq.true", "limit": "10"},
        )
        levels = self.api_request(
            "GET",
            "/rest/v1/skill_level",
            name="LakersCourt: choose skill level",
            params={"select": "skill_level_id", "limit": "10"},
        )
        if (
            courts.status_code != 200
            or levels.status_code != 200
            or not courts.json()
            or not levels.json()
        ):
            return

        starts_at = datetime.now(timezone.utc) + timedelta(
            days=random.randint(1, 30),
            hours=random.randint(1, 10),
        )
        payload = {
            "event_name": f"LOCUST {TEST_RUN_ID} {uuid.uuid4().hex[:8]}",
            "date": starts_at.isoformat(),
            "court_id": random.choice(courts.json())["court_id"],
            "min_age": 18,
            "max_age": 50,
            "max_players": random.choice((4, 6, 8, 10)),
            "skill_level_id": random.choice(levels.json())["skill_level_id"],
            "female_event": False,
            "created_user_id": self.user_id,
            "allow_event": True,
        }
        response = self.api_request(
            "POST",
            "/rest/v1/event",
            name="LakersCourt: create event",
            expected=(200, 201),
            headers={"Prefer": "return=representation"},
            json=payload,
        )
        if response.status_code in (200, 201):
            self.created_events += 1

    @task(2)
    def buy_lakerscards_pack(self) -> None:
        if (
            not ENABLE_WRITES
            or not self.user_id
            or self.purchased_packs >= MAX_PACKS_PER_USER
        ):
            return

        packs = self.rpc("get_packs_store", {}, name="LakersCards: load store")
        if packs.status_code != 200:
            return
        active_packs = [
            pack
            for pack in packs.json()
            if pack.get("pack_id") is not None and pack.get("is_active")
        ]
        if not active_packs:
            return

        pack = min(active_packs, key=lambda item: int(item.get("cost") or 0))
        response = self.rpc(
            "randomize_display_cards",
            {"p_pack": int(pack["pack_id"]), "p_user_id": self.user_id},
            name="LakersCards: buy and open pack",
        )
        if response.status_code == 200:
            self.purchased_packs += 1
            self.rpc(
                "collection_summary",
                {"p_user_id": self.user_id},
                name="LakersCards: refresh collection",
            )

    @task(1)
    def refresh_auth_session(self) -> None:
        if not self.refresh_token:
            return

        response = self.api_request(
            "POST",
            "/auth/v1/token?grant_type=refresh_token",
            name="Auth: refresh session",
            expected=(200,),
            json={"refresh_token": self.refresh_token},
        )
        if response.status_code == 200:
            self.save_session(response.json())

    @task(1)
    def reversible_event_membership(self) -> None:
        if not ENABLE_WRITES or not self.user_id:
            return

        response = self.rpc("get_available_events", {"p_user_id": self.user_id})
        if response.status_code != 200:
            return

        events = [
            event
            for event in response.json()
            if event.get("event_id")
            and event.get("created_user_id") != self.user_id
            and int(event.get("current_players") or 0) < int(event.get("max_players") or 0)
        ]
        if not events:
            return

        event_id = random.choice(events)["event_id"]
        membership = self.api_request(
            "GET",
            "/rest/v1/user_event",
            name="Event: check membership",
            params={
                "select": "user_event_id",
                "user_id": f"eq.{self.user_id}",
                "event_id": f"eq.{event_id}",
                "limit": "1",
            },
        )
        if membership.status_code != 200 or membership.json():
            return

        joined = self.api_request(
            "POST",
            "/rest/v1/user_event",
            name="Event: join",
            expected=(200, 201, 204),
            headers={"Prefer": "return=minimal"},
            json={
                "user_id": self.user_id,
                "event_id": event_id,
                "rated_others": False,
            },
        )
        if joined.status_code not in (200, 201, 204):
            return

        self.api_request(
            "DELETE",
            "/rest/v1/user_event",
            name="Event: leave (cleanup)",
            expected=(200, 204),
            headers={"Prefer": "return=minimal"},
            params={
                "user_id": f"eq.{self.user_id}",
                "event_id": f"eq.{event_id}",
            },
        )

    def on_stop(self) -> None:
        self.close_realtime()
        if not self.access_token:
            return
        self.api_request(
            "POST",
            "/auth/v1/logout",
            name="Auth: logout",
            expected=(200, 204),
        )
