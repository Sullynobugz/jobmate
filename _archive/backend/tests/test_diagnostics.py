import os
import base64
import json
import uuid
import asyncio

import httpx
import pytest
import websockets

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

@pytest.mark.asyncio
async def test_full_interview_flow():
    """End-to-end smoke test: upload docs, start interview, receive audio."""
    async with httpx.AsyncClient(base_url=BACKEND_URL) as client:
        # ---------- 1. Context upload -----------------
        dummy_payload = b"ApplAI test document"
        files = {
            "company": ("company.md", dummy_payload, "text/markdown"),
            "role": ("role.md", dummy_payload, "text/markdown"),
        }
        r = await client.post("/api/context/upload", files=files)
        assert r.status_code == 200, f"/api/context/upload failed: {r.text}"
        context_id = r.json().get("context_id")
        assert context_id, "context_id missing in response"

        # ---------- 2. Start interview ----------------
        payload = {
            "candidate_name": "Diagnostic Bot",
            "job_requirements": "Test position",
            "context_id": context_id,
            "language": "en",
        }
        r = await client.post("/api/interviews/start", json=payload)
        assert r.status_code == 200, f"start interview failed: {r.text}"
        data = r.json()
        for key in ("session_id", "question", "audio"):
            assert key in data, f"Missing key '{key}' in start_interview response"
        session_id = data["session_id"]
        # basic sanity check on audio base64
        assert len(data["audio"]) > 50, "Audio data too short"

    # ---------- 3. WebSocket round-trip --------------
    ws_url = BACKEND_URL.replace("http", "ws") + f"/ws/interview/{session_id}"
    # send dummy audio (empty) to ensure server handles gracefully
    async with websockets.connect(ws_url) as ws:
        await ws.send(json.dumps({"type": "audio", "audio": ""}))
        response = await asyncio.wait_for(ws.recv(), timeout=10)
        msg = json.loads(response)
        assert "type" in msg, "WebSocket response missing type"

