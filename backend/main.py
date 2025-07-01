from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
import uvicorn
import json
import uuid
import asyncio
import os
from typing import Dict, List

# Import our voice agent
from src.voice_agent import VoiceAgent

app = FastAPI(title="ApplAI Voice Interview Platform", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Voice Agent (you'll need to set OPENAI_API_KEY environment variable)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "your-openai-api-key-here")
voice_agent = VoiceAgent(OPENAI_API_KEY)

# Active WebSocket connections
active_connections: Dict[str, WebSocket] = {}

# Models
class InterviewRequest(BaseModel):
    candidate_name: str
    job_requirements: str = "General position"

class JobRequirement(BaseModel):
    title: str
    description: str
    skills: List[str] = []
    experience: str = ""

# Authentication (simplified for MVP)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)

def get_current_user(token: str = Depends(oauth2_scheme)):
    # Simplified auth - in production, validate JWT tokens
    return {"user": "demo_user", "role": "recruiter"}

@app.get("/")
def root():
    return {
        "message": "ApplAI Voice Interview Platform - Backend Running",
        "version": "1.0.0",
        "features": ["voice_interviews", "ai_agent", "real_time_audio"]
    }

# ============ VOICE INTERVIEW ENDPOINTS ============

@app.post("/api/interviews/start")
async def start_interview(request: InterviewRequest, user=Depends(get_current_user)):
    """Start a new voice interview session"""
    session_id = str(uuid.uuid4())
    
    try:
        result = await voice_agent.start_interview(
            session_id=session_id,
            job_requirements=request.job_requirements
        )
        
        return {
            "session_id": session_id,
            "status": "started",
            "first_question": result["question"],
            "audio_data": result["audio"],
            "candidate_name": request.candidate_name
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start interview: {str(e)}")

@app.get("/api/interviews/{session_id}/summary")
async def get_interview_summary(session_id: str, user=Depends(get_current_user)):
    """Get interview summary and results"""
    summary = voice_agent.get_interview_summary(session_id)
    
    if "error" in summary:
        raise HTTPException(status_code=404, detail=summary["error"])
    
    return summary

@app.get("/api/interviews/active")
async def get_active_interviews(user=Depends(get_current_user)):
    """Get list of active interview sessions"""
    return {
        "active_sessions": list(voice_agent.conversation_history.keys()),
        "total_active": len(voice_agent.conversation_history)
    }

# ============ WEBSOCKET FOR REAL-TIME VOICE ============

@app.websocket("/ws/interview/{session_id}")
async def websocket_interview(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for real-time voice interview"""
    await websocket.accept()
    active_connections[session_id] = websocket
    
    try:
        while True:
            # Receive audio data from client
            message = await websocket.receive_text()
            data = json.loads(message)
            
            if data["type"] == "audio":
                # Process audio data (base64 encoded)
                import base64
                audio_bytes = base64.b64decode(data["audio"])
                
                # Process with voice agent
                result = await voice_agent.process_voice_input(session_id, audio_bytes)
                
                # Send response back to client
                await websocket.send_text(json.dumps({
                    "type": "response",
                    "transcript": result.get("transcript", ""),
                    "next_question": result.get("next_question", ""),
                    "audio": result.get("audio", ""),
                    "status": result.get("session_status", "continuing")
                }))
                
            elif data["type"] == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
                
    except WebSocketDisconnect:
        if session_id in active_connections:
            del active_connections[session_id]
    except Exception as e:
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": str(e)
        }))

# ============ JOB MANAGEMENT ============

@app.post("/api/jobs/upload")
async def upload_job_requirement(file: UploadFile = File(...), user=Depends(get_current_user)):
    """Upload job requirement document"""
    # For now, return mock data - later implement actual document processing
    return {
        "job_id": str(uuid.uuid4()),
        "filename": file.filename,
        "status": "processed",
        "extracted": {
            "title": "Software Developer",
            "skills": ["Python", "React", "AI/ML"],
            "experience": "3+ years",
            "description": "Exciting opportunity for a full-stack developer"
        }
    }

# ============ DASHBOARD ENDPOINTS ============

@app.get("/api/dashboard")
def get_dashboard_data(user=Depends(get_current_user)):
    """Get dashboard statistics"""
    return {
        "total_interviews": len(voice_agent.conversation_history),
        "active_interviews": len(active_connections),
        "completed_today": 8,
        "average_score": 78.5,
        "recent_interviews": [
            {"candidate": "John Doe", "score": 85, "status": "completed"},
            {"candidate": "Jane Smith", "score": 72, "status": "completed"},
        ]
    }

@app.get("/api/interviews/history")
def get_interview_history(user=Depends(get_current_user)):
    """Get interview history for review"""
    history = []
    for session_id, data in voice_agent.conversation_history.items():
        summary = voice_agent.get_interview_summary(session_id)
        if "error" not in summary:
            history.append(summary)
    
    return {"interviews": history}

# ============ ADMIN ENDPOINTS ============

@app.get("/api/admin/users")
def get_users(user=Depends(get_current_user)):
    """Get system users (mock data for now)"""
    return {
        "users": [
            {"id": 1, "name": "Admin User", "role": "admin", "email": "admin@applai.com"},
            {"id": 2, "name": "HR Manager", "role": "recruiter", "email": "hr@applai.com"},
        ]
    }

@app.get("/api/admin/voice-agent/config")
def get_voice_agent_config(user=Depends(get_current_user)):
    """Get voice agent configuration"""
    return {
        "voice": "alloy",
        "model": "gpt-4",
        "interview_length": "5-10 minutes",
        "languages": ["English"],
        "personality": "Professional and friendly"
    }

if __name__ == "__main__":
    print("🎤 Starting ApplAI Voice Interview Platform...")
    print("🔗 WebSocket available at: ws://localhost:8000/ws/interview/{session_id}")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
