"""
Simplified ApplAI Backend for Demo
Run with: py main_simple.py
"""
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import uuid
from urllib.parse import urlparse, parse_qs
import threading
import time

class ApplAIHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        """Handle GET requests"""
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/':
            response = {
                "message": "ApplAI Voice Interview Platform - Simple Backend Running",
                "version": "1.0.0-simple",
                "features": ["voice_interviews", "demo_mode"]
            }
        elif parsed_path.path == '/api/dashboard':
            response = {
                "total_interviews": 15,
                "active_interviews": 2,
                "completed_today": 8,
                "average_score": 78.5,
                "recent_interviews": [
                    {"candidate": "John Doe", "score": 85, "status": "completed"},
                    {"candidate": "Jane Smith", "score": 72, "status": "completed"},
                ]
            }
        elif parsed_path.path.startswith('/api/interviews/') and parsed_path.path.endswith('/summary'):
            session_id = parsed_path.path.split('/')[-2]
            response = {
                "session_id": session_id,
                "total_questions": 5,
                "status": "completed",
                "basic_score": 85,
                "conversation": [
                    {"ai": "Hello! Can you tell me your name?", "candidate": "My name is John Doe"},
                    {"ai": "What's your background?", "candidate": "I'm a software developer with 5 years experience"}
                ]
            }
        else:
            response = {"error": "Endpoint not found"}
        
        self.wfile.write(json.dumps(response).encode())

    def do_POST(self):
        """Handle POST requests"""
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/api/interviews/start':
            try:
                data = json.loads(post_data.decode())
                session_id = str(uuid.uuid4())
                language = data.get("language", "en")

                # Simple multilingual support for the first question
                first_questions = {
                    "en": "Hello! I'm your AI interview assistant. Can you please tell me your name?",
                    "de": "Hallo! Ich bin Ihr Interview-Assistent. Können Sie mir bitte Ihren Namen sagen?"
                }
                first_question = first_questions.get(language, first_questions["en"])

                response = {
                    "session_id": session_id,
                    "status": "started",
                    "first_question": first_question,
                    "audio_data": "",  # Empty for simple demo
                    "candidate_name": data.get("candidate_name", "Demo Candidate")
                }
            except Exception as exc:
                response = {"error": f"Invalid request data: {str(exc)}"}
        
        elif parsed_path.path == '/api/jobs/upload':
            response = {
                "job_id": str(uuid.uuid4()),
                "filename": "demo-job.pdf",
                "status": "processed",
                "extracted": {
                    "title": "Software Developer",
                    "skills": ["Python", "React", "AI/ML"],
                    "experience": "3+ years",
                    "description": "Exciting opportunity for a full-stack developer"
                }
            }
        
        elif parsed_path.path == '/api/context/upload':
            # Pretend we processed both uploaded files and store basic info
            try:
                # Note: The built-in http.server doesn't parse multipart, so this is a stub
                # In real usage, switch to FastAPI backend (main.py) for proper file parsing.
                response = {
                    "context_id": str(uuid.uuid4()),
                    "status": "processed (simple)",
                }
            except Exception as exc:
                response = {"error": f"Failed to process upload: {str(exc)}"}
        
        else:
            response = {"error": "Endpoint not found"}
        
        self.wfile.write(json.dumps(response).encode())

def run_server():
    """Run the simple HTTP server"""
    server_address = ('localhost', 8000)
    httpd = HTTPServer(server_address, ApplAIHandler)
    
    print("[ApplAI] Simple Backend Starting...")
    print("[ApplAI] Server running at: http://localhost:8000")
    print("[ApplAI] Frontend can now connect!")
    print("[ApplAI] Note: This is a simple demo server without full AI features")
    print("[ApplAI] For full voice AI, install full requirements and run main.py")
    print("\nPress Ctrl+C to stop")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[ApplAI] Server stopped")

if __name__ == "__main__":
    run_server()
