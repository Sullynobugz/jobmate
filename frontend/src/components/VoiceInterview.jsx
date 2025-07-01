import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Button, Title, Text, Alert, Group, Progress, Card, Switch, Select, ActionIcon } from '@mantine/core';
import { IconMicrophone, IconMicrophoneOff, IconPlayerPlay, IconPlayerStop, IconLanguage } from '@tabler/icons-react';

export default function VoiceInterview() {
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [transcript, setTranscript] = useState('');
  const [interviewStatus, setInterviewStatus] = useState('not_started'); // not_started, starting, active, completed
  const [liveTranscript, setLiveTranscript] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [demoMode, setDemoMode] = useState(false);
  const [messages, setMessages] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [language, setLanguage] = useState('de'); // Default to German
  const [answerElapsed, setAnswerElapsed] = useState(0);
  const location = useLocation();
  const timerRef = useRef(null);
  
  const mediaRecorderRef = useRef(null);
  const websocketRef = useRef(null);
  const audioRef = useRef(null);
  const recognitionRef = useRef(null);
  
  // Demo questions for simulation (English and German)
  const demoQuestions = {
    en: [
      "Hello! I'm your AI interview assistant. Can you please tell me your name?",
      "Great to meet you! Can you briefly describe your professional background?",
      "What interests you most about this role?",
      "Can you tell me about a challenging project you've worked on?",
      "Do you have any questions about the role or company?",
      "Thank you for your time. That concludes our interview."
    ],
    de: [
      "Hallo! Ich bin Ihr Interview-Assistent. Können Sie mir bitte Ihren Namen sagen?",
      "Schön, Sie kennenzulernen! Können Sie kurz Ihren beruflichen Hintergrund beschreiben?",
      "Was interessiert Sie am meisten an dieser Position?",
      "Können Sie mir von einem herausfordernden Projekt erzählen, an dem Sie gearbeitet haben?",
      "Haben Sie noch Fragen zur Stelle oder zum Unternehmen?",
      "Vielen Dank für Ihre Zeit. Das war unser Gespräch."
    ]
  };

  // Initialize WebSocket connection
  const connectWebSocket = (sessionId) => {
    const ws = new WebSocket(`ws://localhost:8000/ws/interview/${sessionId}`);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'response') {
        setTranscript(data.transcript);
        setCurrentQuestion(data.next_question);
        setMessages(prev => [...prev, { sender: 'ai', text: data.next_question }]);
        
        // Play AI response audio
        if (data.audio) {
          playAudioResponse(data.audio);
        }
        
        if (data.status === 'completed') {
          setInterviewStatus('completed');
        }
      }
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    websocketRef.current = ws;
  };

  // Start interview session
  const startInterview = async () => {
    const contextId = location.state?.contextId;
    setInterviewStatus('starting');
    
    if (demoMode) {
      // Demo mode - simulate interview without backend
      setTimeout(() => {
        setSessionId('demo-session-' + Date.now());
        setCurrentQuestion(demoQuestions[language][0]);
        setIsConnected(true);
        setInterviewStatus('active');
        setQuestionIndex(0);
        
        // Simulate AI speaking
        speakText(demoQuestions[language][0]);
      }, 1000);
      return;
    }
    
    try {
      const response = await fetch('http://localhost:8000/api/interviews/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            context_id: contextId ?? undefined,
          candidate_name: 'Demo Candidate',
          language
        })
      });
      
      const result = await response.json();
      
      if (result.session_id) {
        setSessionId(result.session_id);
        setCurrentQuestion(result.first_question);
        setMessages([{ sender: 'ai', text: result.first_question }]);
        connectWebSocket(result.session_id);
        
        // Play first question
        if (result.audio_data) {
          playAudioResponse(result.audio_data);
        }
        
        setInterviewStatus('active');
      }
    } catch (error) {
      console.error('Failed to start interview:', error);
      setInterviewStatus('not_started');
    }
  };

  // Play AI audio response
  const playAudioResponse = (base64Audio) => {
    try {
      const audioBlob = base64ToBlob(base64Audio, 'audio/mpeg');
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      clearInterval(timerRef.current);
      timerRef.current=null;
      setAnswerElapsed(0);
      audioRef.current.src = audioUrl;
      audioRef.current.play();
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  // Convert base64 to Blob
  const base64ToBlob = (base64, mimeType) => {
    const byteChars = atob(base64);
    const byteNumbers = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteNumbers[i] = byteChars.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  // Start recording
  const startRecording = async () => {
    if (demoMode) {
      startSpeechRecognition();
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        sendAudioToServer(audioBlob);
      };
      
      mediaRecorder.start();
      // start timer for non-demo mode
      setAnswerElapsed(0);
      timerRef.current = setInterval(() => {
        setAnswerElapsed(prev => {
          if (prev + 1 >= 60) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (demoMode) {
      stopSpeechRecognition();
      return;
    }
    
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
      timerRef.current=null;
      setAnswerElapsed(0);
    }
  };

  // Send audio to server
  const sendAudioToServer = async (audioBlob) => {
    if (!websocketRef.current || !isConnected) return;
    
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Audio = reader.result.split(',')[1]; // Remove data:audio/wav;base64, prefix
        
        websocketRef.current.send(JSON.stringify({
          type: 'audio',
          audio: base64Audio
        }));
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Error sending audio:', error);
    }
  };

  // Speech Recognition for demo mode
  const startSpeechRecognition = () => {
    let transcriptBuffer = '';
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      const message = language === 'de' 
        ? 'Spracherkennung wird in diesem Browser nicht unterstützt. Bitte verwenden Sie Chrome oder Edge.'
        : 'Speech recognition not supported in this browser. Please use Chrome or Edge.';
      alert(message);
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
  
  recognition.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const res = event.results[i];
      interim += res[0].transcript;
      if (res.isFinal) {
        transcriptBuffer += res[0].transcript + ' ';
      }
    }
    setLiveTranscript(interim);
  };
  
  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    setIsRecording(false);
  };
  
  recognition.onend = () => {
    clearInterval(timerRef.current);
    timerRef.current=null;
    setAnswerElapsed(0);
    setIsRecording(false);
    const final = (transcriptBuffer || liveTranscript).trim();
    setLiveTranscript('');

    if (!final) {
      // Nothing captured – do not advance the interview
      return;
    }

    setTranscript(final);
    setMessages(prev => [...prev, { sender: 'user', text: final }]);

    const nextIndex = questionIndex + 1;
    if (nextIndex < demoQuestions[language].length) {
      const nextQ = demoQuestions[language][nextIndex];
      setCurrentQuestion(nextQ);
      setQuestionIndex(nextIndex);
      setMessages(prev => [...prev, { sender: 'ai', text: nextQ }]);
      speakText(nextQ);
    } else {
      setInterviewStatus('completed');
    }
  };
  
  recognition.start();
  recognitionRef.current = recognition;
};

  return (
    <Box>
      {/* Demo Mode Toggle */}
      <Card withBorder p="md" mb="md">
        <Group justify="space-between" align="center">
          <div>
            <Text fw={500}>
              {language === 'de' ? 'Demo-Modus' : 'Demo Mode'}
            </Text>
            <Text size="sm" c="dimmed">
              {demoMode
                ? (language === 'de' ? 'Simuliert Interview ohne Backend' : 'Simulating interview without backend')
                : (language === 'de' ? 'Benötigt Python Backend Server' : 'Requires Python backend server')}
            </Text>
          </div>
          <Switch
            checked={demoMode}
            onChange={(e) => setDemoMode(e.currentTarget.checked)}
            disabled={interviewStatus !== 'not_started'}
          />
        </Group>
      </Card>

      {/* Recording Progress */}
      {isRecording && (
        <>
          <Text size="sm" c="orange" mb="xs">
            {language === 'de' ? 'Aufnahme läuft' : 'Recording'} – {answerElapsed}s
          </Text>
          <Progress
            value={(answerElapsed / 60) * 100}
            size="sm"
            color={answerElapsed < 30 ? 'orange' : 'green'}
            mb="md"
          />
        </>
      )}

      {/* Connection Status */}
      <Alert color={isConnected ? 'green' : demoMode ? 'blue' : 'red'} mb="md">
        {isConnected
          ? language === 'de'
            ? 'Verbunden mit KI-Interviewer'
            : 'Connected to AI Interviewer'
          : demoMode
          ? language === 'de'
            ? 'Demo-Modus - Simuliertes KI-Interview'
            : 'Demo Mode - Simulated AI Interview'
          : language === 'de'
          ? 'Verbindung zum Server getrennt - Demo-Modus aktivieren oder Python Backend starten'
          : 'Disconnected from server - Enable Demo Mode or start Python backend'}
      </Alert>

      {/* Interview Status */}
      <Card withBorder p="md" mb="lg">
        <Group justify="space-between" mb="sm">
          <Text fw={500}>{language === 'de' ? 'Interview-Status' : 'Interview Status'}</Text>
          <Text c={interviewStatus === 'active' ? 'green' : 'gray'}>
            {language === 'de'
              ? {
                  not_started: 'NICHT GESTARTET',
                  starting: 'STARTET',
                  active: 'AKTIV',
                  completed: 'ABGESCHLOSSEN'
                }[interviewStatus]
              : interviewStatus.replace('_', ' ').toUpperCase()}
          </Text>
        </Group>
        {interviewStatus === 'active' && <Progress value={50} size="sm" color="blue" />}
      </Card>

      {/* Current Question */}
      {currentQuestion && (
        <Card withBorder p="md" mb="lg" bg="blue.0">
          <Text fw={500} mb="sm">
            {language === 'de' ? 'KI-Interviewer:' : 'AI Interviewer:'}
          </Text>
          <Text>{currentQuestion}</Text>
        </Card>
      )}

      {/* Transcript */}
      {transcript && (
        <Card withBorder p="md" mb="lg" bg="gray.0">
          <Text fw={500} mb="sm">
            {language === 'de' ? 'Ihre Antwort:' : 'Your Response:'}
          </Text>
          <Text>{transcript}</Text>
        </Card>
      )}

      {/* Controls */}
      <Group justify="center" mb="lg">
        {interviewStatus === 'not_started' && (
          <Button size="lg" onClick={startInterview} leftSection={<IconPlayerPlay />}>
            {language === 'de' ? 'Interview starten' : 'Start Interview'}
          </Button>
        )}

        {interviewStatus === 'active' && (
          <Button
            size="lg"
            color={isRecording ? 'red' : 'blue'}
            onClick={isRecording ? stopRecording : startRecording}
            leftSection={isRecording ? <IconMicrophoneOff /> : <IconMicrophone />}
            disabled={!isConnected && !demoMode}
          >
            {isRecording
              ? language === 'de'
                ? 'Aufnahme stoppen'
                : 'Stop Recording'
              : language === 'de'
              ? 'Aufnahme starten'
              : 'Start Recording'}
          </Button>
        )}

        {interviewStatus === 'completed' && (
          <Alert color="green" size="lg">
            {language === 'de'
              ? 'Interview abgeschlossen! Vielen Dank für Ihre Zeit.'
              : 'Interview completed! Thank you for your time.'}
          </Alert>
        )}
      </Group>

      {/* Instructions */}
      <Card withBorder p="md">
        <Text fw={500} mb="sm">
          {language === 'de' ? 'Anweisungen:' : 'Instructions:'}
        </Text>
        <Text size="sm">
          {language === 'de' ? (
            <>
              1. {demoMode ? 'Demo-Modus ist AN - verwendet echte Spracherkennung' : 'Benötigt Python Backend Server'}
              <br />2. Klicken Sie "Interview starten" um zu beginnen
              <br />3. Hören Sie sich die Frage des KI-Interviewers an
              <br />4. Klicken Sie "Aufnahme starten" und sprechen Sie Ihre Antwort klar
              <br />5. Die Sprache wird automatisch verarbeitet, wenn Sie fertig sind
              <br />6. Warten Sie auf die nächste Frage
              {demoMode && (
                <span style={{ color: '#666' }}>
                  <br />⚠️ Funktioniert am besten in Chrome/Edge Browsern
                </span>
              )}
            </>
          ) : (
            <>
              1. {demoMode ? 'Demo Mode is ON - using real speech recognition' : 'Requires Python backend server'}
              <br />2. Click "Start Interview" to begin
              <br />3. Listen to the AI interviewer's question
              <br />4. Click "Start Recording" and speak your answer clearly
              <br />5. Speech will be automatically processed when you finish
              <br />6. Wait for the next question
              {demoMode && (
                <span style={{ color: '#666' }}>
                  <br />⚠️ Works best in Chrome/Edge browsers
                </span>
              )}
            </>
          )}
        </Text>
      </Card>

      {/* Hidden audio element */}
      <audio ref={audioRef} style={{ display: 'none' }} />
    </Box>
  );
}
