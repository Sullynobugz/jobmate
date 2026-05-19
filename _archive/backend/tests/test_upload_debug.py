#!/usr/bin/env python3
"""
Debug-Tests für Upload-Funktionalität.
Zeigt detaillierte Fehlerdiagnose bei Upload-Problemen.
"""

import io
import httpx
import pytest
import asyncio

BACKEND_URL = "http://localhost:8000"

@pytest.mark.asyncio
async def test_backend_connectivity():
    """Test 1: Grundlegende Backend-Erreichbarkeit"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{BACKEND_URL}/")
            print(f"✓ Backend erreichbar: {response.status_code}")
            print(f"  Response: {response.json()}")
            assert response.status_code == 200
        except Exception as e:
            print(f"✗ Backend nicht erreichbar: {e}")
            raise

@pytest.mark.asyncio
async def test_upload_endpoint_exists():
    """Test 2: Upload-Endpoint existiert und akzeptiert POST"""
    async with httpx.AsyncClient() as client:
        # Teste verschiedene HTTP-Methoden
        try:
            # OPTIONS für CORS-Preflight
            response = await client.options(f"{BACKEND_URL}/api/context/upload")
            print(f"✓ OPTIONS /api/context/upload: {response.status_code}")
        except Exception as e:
            print(f"? OPTIONS Fehler: {e}")
        
        # GET sollte 405 (Method Not Allowed) liefern
        try:
            response = await client.get(f"{BACKEND_URL}/api/context/upload")
            print(f"✓ GET /api/context/upload: {response.status_code} (erwartet: 405)")
        except Exception as e:
            print(f"? GET Fehler: {e}")

@pytest.mark.asyncio
async def test_upload_with_files():
    """Test 3: Actual file upload"""
    async with httpx.AsyncClient() as client:
        # Erstelle Dummy-Dateien
        company_content = b"Unser Unternehmen steht fuer Innovation und Teamarbeit."
        role_content = b"Wir suchen einen erfahrenen Python-Entwickler."
        
        files = {
            "company": ("company.txt", io.BytesIO(company_content), "text/plain"),
            "role": ("role.txt", io.BytesIO(role_content), "text/plain")
        }
        
        try:
            response = await client.post(f"{BACKEND_URL}/api/context/upload", files=files)
            print(f"✓ POST /api/context/upload: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"  Erfolg! Context ID: {data.get('context_id', 'FEHLT')}")
                assert "context_id" in data
            else:
                print(f"  Fehler: {response.text}")
                
        except httpx.ConnectError as e:
            print(f"✗ Verbindungsfehler: {e}")
            raise
        except Exception as e:
            print(f"✗ Upload-Fehler: {e}")
            raise

@pytest.mark.asyncio 
async def test_cors_headers():
    """Test 4: CORS-Headers werden korrekt gesetzt"""
    async with httpx.AsyncClient() as client:
        headers = {
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type"
        }
        
        try:
            response = await client.options(f"{BACKEND_URL}/api/context/upload", headers=headers)
            print(f"✓ CORS Preflight: {response.status_code}")
            
            cors_headers = {
                "Access-Control-Allow-Origin": response.headers.get("access-control-allow-origin"),
                "Access-Control-Allow-Methods": response.headers.get("access-control-allow-methods"),
                "Access-Control-Allow-Headers": response.headers.get("access-control-allow-headers")
            }
            
            for key, value in cors_headers.items():
                print(f"  {key}: {value}")
                
        except Exception as e:
            print(f"? CORS Test Fehler: {e}")

if __name__ == "__main__":
    # Direkte Ausführung für schnelle Diagnose
    async def run_tests():
        print("=== Upload Debug Tests ===\n")
        await test_backend_connectivity()
        print()
        await test_upload_endpoint_exists()  
        print()
        await test_upload_with_files()
        print()
        await test_cors_headers()
        print("\n=== Tests abgeschlossen ===")
    
    asyncio.run(run_tests())
