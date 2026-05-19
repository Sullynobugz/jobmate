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
import difflib

logger = logging.getLogger(__name__)

class VoiceAgent:
    def __init__(self, openai_api_key: str):
        self.client = OpenAI(api_key=openai_api_key)
        self.conversation_history = {}  # session_id -> dict
        self.interview_templates = {
            "general": [
                "Hello! I'm your AI interview assistant. Can you please tell me your name?",
                "Great to meet you! Can you briefly describe your professional background?",
                "What interests you most about this role?",
                "Can you tell me about a challenging project you've worked on?",
                "Do you have any questions about the role or company?"
            ],
            "german": [
                "Hallo! Ich bin Ihr KI-Interviewassistent. Können Sie mir bitte Ihren Namen nennen?",
                "Schön, Sie kennenzulernen! Können Sie kurz Ihren beruflichen Hintergrund beschreiben?",
                "Was interessiert Sie am meisten an dieser Position?",
                "Können Sie mir von einem herausfordernden Projekt erzählen, an dem Sie gearbeitet haben?",
                "Haben Sie noch Fragen zur Stelle oder zum Unternehmen?"
            ]
        }
    
    async def start_interview(self, session_id: str, job_requirements: str = None, language: str = "en", num_questions: int = 8) -> Dict:
        """Initialize a new interview session"""
        # Ensure job requirements string is available
        if not job_requirements:
            job_requirements = "General position"

        # Pre-generate dynamic question sheet first
        question_sheet = await self._generate_question_sheet(job_requirements, language, num_questions)

        self.conversation_history[session_id] = {
            "messages": [],
            "current_question": 0,
            "job_requirements": job_requirements or "General position",
            "candidate_responses": [],
            "score": 0,
            "language": language,
            "question_sheet": question_sheet
        }
        
        first_question = question_sheet[0]
        
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
            
            # Increment index *before* generating, so fallback picks the right template
            session["current_question"] += 1

            # Generate next question using GPT-4
            next_question = await self.generate_next_question(session, transcript)
            
            # Convert response to speech
            audio_response = await self.text_to_speech(next_question)
            session["messages"].append({
                "candidate": transcript,
                "ai": next_question
            })
            
            return {
                "transcript": transcript,
                "next_question": next_question,
                "audio": audio_response,
                "session_status": "continuing" if session["current_question"] < len(session.get("question_sheet", [])) else "completed"
            }
        except Exception as e:
            logger.error(f"Error processing voice input: {e}")
            return {"error": str(e)}
    
    async def _generate_question_sheet(self, job_text: str, language: str, num_questions: int = 8) -> List[str]:
        """Generate a list of interview questions up-front using GPT. Fallback to template list."""
        try:
            sys_prompt = (
                "Du bist ein professioneller HR-Interviewer. Erstelle eine Liste von "
                f"{num_questions} prägnanten Fragen (1-2 Sätze) auf Deutsch basierend auf den Jobanforderungen unten. "
                "Beginne mit einem Warm-up, gehe dann tiefer auf Skills/Projekte ein und schließe mit Rückfragen. "
                "Gib die Liste als JSON-Array zurück."
            )
            if not language.startswith("de"):
                sys_prompt = sys_prompt.replace("auf Deutsch", "in English")

            completion = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": sys_prompt},
                    {"role": "user", "content": job_text[:4000]}
                ],
                max_tokens=400,
                temperature=0.3
            )
            raw = completion.choices[0].message.content.strip()
            import json as _json
            questions = _json.loads(raw)
            questions = [q.strip() for q in questions if q.strip()]
            if len(questions) < num_questions:
                raise ValueError("too_few_generated")
            return questions
        except Exception as e:
            logger.warning(f"Question sheet generation failed, using templates. Reason: {e}")
            template = self.interview_templates["german" if language.startswith("de") else "general"]
            return template[:num_questions]
    
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
            # --- Build trimmed job requirements (max 2000 chars) ---
            job_text = session['job_requirements']
            if len(job_text) > 2000:
                job_text = job_text[:2000] + "…"

            # Use only last 5 exchanges for brevity
            previous_conv = ""
            for msg in session["messages"][-5:]:
                previous_conv += f"AI: {msg['ai']}\nCandidate: {msg['candidate']}\n"

            conversation_context = f"""
            Job Requirements (summary):\n{job_text}\n\nPrevious conversation:\n{previous_conv}\nCandidate's latest response: {candidate_response}\n"""
            
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
            
            # If session language is German, instruct GPT accordingly
            lang_instruction = "Bitte antworte auf Deutsch." if session.get("language", "en").startswith("de") else "Please answer in English."
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": f"You are a professional HR interviewer conducting a voice interview. {lang_instruction}"},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=120,
                temperature=0.5
            )
            
            # If we already have a pre-generated sheet, fetch by index
            idx = session["current_question"]
            sheet = session.get("question_sheet")
            if sheet and idx < len(sheet):
                return sheet[idx]

            proposed_question = response.choices[0].message.content.strip() if response.choices else ""
            logger.info(f"GPT question: {proposed_question}")

            # Avoid repeating the same question
            last_q = session["messages"][-1]["ai"] if session["messages"] else ""
            if last_q and difflib.SequenceMatcher(None, last_q, proposed_question).ratio() > 0.9:
                logger.warning("Proposed question too similar to previous – using template fallback")
                raise ValueError("duplicate_question")

            return proposed_question
            
        except Exception as e:
            logger.error(f"Error generating question: {e}")
            # Fallback to template questions
            current_q = session["current_question"]
        if session.get("language","en").startswith("de"):
            template_list = self.interview_templates.get("german", [])
        else:
            template_list = self.interview_templates.get("general", [])
        if current_q < len(template_list):
            return template_list[current_q]
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
