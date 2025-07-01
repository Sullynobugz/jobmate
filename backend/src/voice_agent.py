"""
ApplAI Voice Agent - Core conversation engine for AI interviews
"""
import asyncio
import json
import logging
from typing import Dict, List, Optional
from openai import OpenAI
import io
import base64

logger = logging.getLogger(__name__)

class VoiceAgent:
    def __init__(self, openai_api_key: str):
        self.client = OpenAI(api_key=openai_api_key)
        self.conversation_history = {}
        self.interview_templates = {
            "general": [
                "Hello! I'm your AI interview assistant. Can you please tell me your name?",
                "Great to meet you! Can you briefly describe your professional background?",
                "What interests you most about this role?",
                "Can you tell me about a challenging project you've worked on?",
                "Do you have any questions about the role or company?"
            ]
        }
    
    async def start_interview(self, session_id: str, job_requirements: str = None) -> Dict:
        """Initialize a new interview session"""
        self.conversation_history[session_id] = {
            "messages": [],
            "current_question": 0,
            "job_requirements": job_requirements or "General position",
            "candidate_responses": [],
            "score": 0
        }
        
        first_question = self.interview_templates["general"][0]
        
        # Generate TTS audio for first question
        audio_data = await self.text_to_speech(first_question)
        
        return {
            "session_id": session_id,
            "question": first_question,
            "audio": audio_data,
            "status": "started"
        }
    
    async def process_voice_input(self, session_id: str, audio_data: bytes) -> Dict:
        """Process candidate voice input and generate AI response"""
        if session_id not in self.conversation_history:
            return {"error": "Session not found"}
        
        try:
            # Convert speech to text
            transcript = await self.speech_to_text(audio_data)
            
            # Add to conversation history
            session = self.conversation_history[session_id]
            session["candidate_responses"].append(transcript)
            
            # Generate next question using GPT-4
            next_question = await self.generate_next_question(session, transcript)
            
            # Convert response to speech
            audio_response = await self.text_to_speech(next_question)
            
            # Update session
            session["current_question"] += 1
            session["messages"].append({
                "candidate": transcript,
                "ai": next_question
            })
            
            return {
                "transcript": transcript,
                "next_question": next_question,
                "audio": audio_response,
                "session_status": "continuing" if session["current_question"] < 5 else "completed"
            }
            
        except Exception as e:
            logger.error(f"Error processing voice input: {e}")
            return {"error": str(e)}
    
    async def speech_to_text(self, audio_data: bytes) -> str:
        """Convert audio to text using OpenAI Whisper"""
        try:
            # Create audio file-like object
            audio_file = io.BytesIO(audio_data)
            audio_file.name = "audio.wav"
            
            # Use OpenAI Whisper
            transcript = self.client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file
            )
            
            return transcript.text
            
        except Exception as e:
            logger.error(f"Speech to text error: {e}")
            return "I couldn't understand that. Could you please repeat?"
    
    async def text_to_speech(self, text: str) -> str:
        """Convert text to speech using OpenAI TTS"""
        try:
            response = self.client.audio.speech.create(
                model="tts-1",
                voice="alloy",  # Professional, neutral voice
                input=text
            )
            
            # Convert to base64 for easy transmission
            audio_bytes = response.content
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            
            return audio_base64
            
        except Exception as e:
            logger.error(f"Text to speech error: {e}")
            return ""
    
    async def generate_next_question(self, session: Dict, candidate_response: str) -> str:
        """Generate contextual follow-up question using GPT-4"""
        try:
            # Build conversation context
            conversation_context = f"""
            Job Requirements: {session['job_requirements']}
            
            Previous conversation:
            """
            
            for msg in session["messages"]:
                conversation_context += f"AI: {msg['ai']}\nCandidate: {msg['candidate']}\n"
            
            conversation_context += f"Candidate's latest response: {candidate_response}\n"
            
            # Generate next question
            prompt = f"""
            You are conducting a professional job interview. Based on the conversation above:
            
            1. If this is early in the interview, ask about their background and experience
            2. If they've shared experience, ask about specific skills or projects
            3. If near the end, ask if they have questions or summarize
            4. Keep questions natural, professional, and relevant to the job
            5. Limit response to 1-2 sentences maximum
            
            Generate the next interview question:
            """
            
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a professional HR interviewer conducting a voice interview."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=100,
                temperature=0.7
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"Error generating question: {e}")
            # Fallback to template questions
            current_q = session["current_question"]
            if current_q < len(self.interview_templates["general"]):
                return self.interview_templates["general"][current_q]
            else:
                return "Thank you for your time. That concludes our interview."
    
    def get_interview_summary(self, session_id: str) -> Dict:
        """Generate interview summary and candidate scoring"""
        if session_id not in self.conversation_history:
            return {"error": "Session not found"}
        
        session = self.conversation_history[session_id]
        
        return {
            "session_id": session_id,
            "total_questions": len(session["messages"]),
            "responses": session["candidate_responses"],
            "conversation": session["messages"],
            "status": "completed",
            "basic_score": len(session["candidate_responses"]) * 20  # Simple scoring for now
        }
