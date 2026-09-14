import os
import json
import asyncio
import random
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, StreamingResponse, JSONResponse
from starlette.middleware.sessions import SessionMiddleware
from contextlib import asynccontextmanager
import urllib.request
import urllib.parse

from .config import get_server_config, get_llm_config, get_auth_password
from .chat_engine import process_message, get_proactive_message, MOMENT_TEMPLATES
from .memory_system import get_intimacy_score, get_stats, get_memory_count
from .character_card import get_character_name, get_character_greeting, reload_character_card
from .intimacy import get_intimacy_level
from .scheduler import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    asyncio.create_task(proactive_loop())
    yield
    stop_scheduler()


app = FastAPI(title="虚拟女友", lifespan=lifespan)

_SESSION_KEY = os.environ.get("SESSION_SECRET", "vg_secret_2024_xp_5201314")
app.add_middleware(SessionMiddleware, secret_key=_SESSION_KEY, session_cookie="vg_session", max_age=86400 * 30)

static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")

connected_clients: list[WebSocket] = []


def check_auth(request: Request) -> bool:
    return request.session.get("logged_in") is True


async def proactive_loop():
    while True:
        await asyncio.sleep(random.randint(120, 300))
        if not connected_clients:
            continue
        msg = get_proactive_message()
        for ws in connected_clients[:]:
            try:
                await ws.send_text(json.dumps({
                    "type": "proactive",
                    "content": msg,
                }, ensure_ascii=False))
            except Exception:
                pass


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    if not check_auth(request):
        with open(os.path.join(static_dir, "login.html"), "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read(), media_type="text/html; charset=utf-8")
    with open(os.path.join(static_dir, "index.html"), "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read(), media_type="text/html; charset=utf-8")


@app.post("/api/login")
async def login(request: Request):
    body = await request.json()
    pwd = body.get("password", "").strip()
    expected = get_auth_password()
    if expected and pwd == expected:
        request.session["logged_in"] = True
        return {"success": True}
    return JSONResponse(status_code=401, content={"success": False, "message": "密码错误"})


@app.post("/api/logout")
async def logout(request: Request):
    request.session.clear()
    return {"success": True}


@app.get("/api/status")
async def get_status(request: Request):
    if not check_auth(request):
        return JSONResponse(status_code=401, content={"error": "未登录"})
    score = await get_intimacy_score()
    stats = await get_stats()
    mem_count = await get_memory_count()
    name = get_character_name()
    return {
        "character_name": name,
        "intimacy_score": score,
        "intimacy_level": get_intimacy_level(score),
        "total_messages": stats["total_messages"],
        "total_replies": stats["total_replies"],
        "current_round": stats["current_round"],
        "mode_switches": stats["mode_switches"],
        "memory_count": mem_count,
        "llm_configured": bool(get_llm_config().get("api_key", "").strip()),
    }


@app.get("/api/character")
async def get_character_info(request: Request):
    if not check_auth(request):
        return JSONResponse(status_code=401, content={"error": "未登录"})
    return {
        "name": get_character_name(),
        "greeting": get_character_greeting(),
    }


@app.post("/api/character/reload")
async def reload_character(request: Request):
    if not check_auth(request):
        return JSONResponse(status_code=401, content={"error": "未登录"})
    reload_character_card()
    return {"name": get_character_name(), "greeting": get_character_greeting()}


@app.get("/api/moments")
async def get_moments(request: Request):
    if not check_auth(request):
        return JSONResponse(status_code=401, content={"error": "未登录"})
    name = get_character_name()
    return {
        "character_name": name,
        "moments": MOMENT_TEMPLATES,
    }


@app.get("/api/image")
async def generate_image(prompt: str, request: Request):
    if not check_auth(request):
        return JSONResponse(status_code=401, content={"error": "未登录"})
    encoded = urllib.parse.quote(prompt)
    url = f"https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt={encoded}&image_size=square"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        resp = urllib.request.urlopen(req, timeout=60)
        content_type = resp.headers.get("Content-Type", "")
        data = resp.read()
        if "image" in content_type or len(data) > 1000:
            return StreamingResponse(
                iter([data]),
                media_type=content_type if "image" in content_type else "image/jpeg",
                headers={"Cache-Control": "public, max-age=3600"}
            )
        else:
            return JSONResponse(status_code=500, content={"error": "Image generation failed", "detail": data[:200].decode("utf-8", errors="replace")})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.websocket("/ws/chat")
async def chat_ws(websocket: WebSocket):
    expected_pwd = get_auth_password()

    if expected_pwd:
        cookie = websocket.headers.get("cookie", "")
        if "vg_session" not in cookie:
            await websocket.accept()
            await websocket.send_text(json.dumps({"type": "error", "content": "请先登录"}, ensure_ascii=False))
            await websocket.close()
            return

    await websocket.accept()
    connected_clients.append(websocket)

    greeting = get_character_greeting()
    name = get_character_name()
    await websocket.send_text(json.dumps({
        "type": "greeting",
        "content": greeting,
        "character_name": name,
    }, ensure_ascii=False))

    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            user_message = msg.get("content", "").strip()

            if not user_message:
                continue

            await websocket.send_text(json.dumps({"type": "read"}, ensure_ascii=False))

            try:
                result = await process_message(user_message)

                typing_dur = result.get("typing_duration", 1.5)
                await asyncio.sleep(typing_dur)

                if result.get("announcement"):
                    await websocket.send_text(json.dumps({
                        "type": "announcement",
                        "content": result["announcement"],
                    }, ensure_ascii=False))

                await websocket.send_text(json.dumps({
                    "type": "reply",
                    "content": result["reply"],
                    "mode": result["mode"],
                    "is_debug": result["is_debug"],
                }, ensure_ascii=False))

                for extra in result.get("extras", []):
                    await websocket.send_text(json.dumps({
                        "type": "extra",
                        "extra": extra,
                    }, ensure_ascii=False))

            except Exception as e:
                error_msg = str(e)
                if "api_key" in error_msg.lower() or "auth" in error_msg.lower():
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "content": "API Key 未配置或无效，请编辑 config.yaml 填入你的 LLM API Key",
                    }, ensure_ascii=False))
                else:
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "content": f"出错了：{error_msg}",
                    }, ensure_ascii=False))
    except WebSocketDisconnect:
        pass
    finally:
        if websocket in connected_clients:
            connected_clients.remove(websocket)


def run():
    cfg = get_server_config()
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=cfg.get("host", "0.0.0.0"),
        port=cfg.get("port", 8000),
        reload=False,
        ws="websockets",
    )


if __name__ == "__main__":
    run()
