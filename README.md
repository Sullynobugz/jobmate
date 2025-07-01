# ApplAI: Recruitment Automation Platform

## Overview
ApplAI is a recruitment automation platform prototype that processes job requirement documents and manages the hiring pipeline with AI-powered parsing, candidate evaluation, and a recruiter dashboard.

## MVP Features
- Upload/paste job requirements (PDF, DOCX, TXT)
- AI-powered requirement extraction
- Candidate profile creation/import
- Automated candidate-to-job matching with scoring
- Recruiter dashboard with ranked lists
- Export shortlist functionality

## Tech Stack
- Frontend: React (Vite)
- Backend: Node.js (Express)
- Database: PostgreSQL
- AI: OpenAI API
- Queue: BullMQ (Redis)
- Multi-tenancy & RBAC from the start

## Setup
See `docker-compose.yml` for local development.
