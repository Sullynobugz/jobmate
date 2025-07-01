import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { MantineProvider, Container, Title, Button, Group } from '@mantine/core';

import Upload from './pages/Upload';
import InterviewConsole from './pages/InterviewConsole';

function Navigation() {
  const location = useLocation();
  const navLinks = [
    { path: '/', label: 'Dokumente hochladen' },
    { path: '/interview', label: 'Interview' },
  ];
  
  return (
    <Group mb="lg">
      {navLinks.map(link => (
        <Button 
          key={link.path}
          component={Link} 
          to={link.path} 
          variant={location.pathname === link.path ? 'filled' : 'outline'}
        >
          {link.label}
        </Button>
      ))}
    </Group>
  );
}

function App() {


  return (
      <MantineProvider
        theme={{
          fontFamily: 'Inter, sans-serif',
          headings: { fontFamily: 'Inter, sans-serif', fontWeight: 600 },
          colors: {
            primary: ['#edf2ff','#dbe4ff','#bac8ff','#91a7ff','#748ffc','#5c7cfa','#4c6ef5','#4263eb','#3b5bdb','#364fc7']
          }
        }}
        withGlobalStyles
        withNormalizeCSS
      >
        <Router>
          <Container size="md" py="md">
            <Group mb="lg">
              <Title order={1}>ApplAI Sprachinterview</Title>
            </Group>
            <Navigation />
            <Routes>
              <Route path="/" element={<Upload />} />
              <Route path="/interview" element={<InterviewConsole />} />
            </Routes>
          </Container>
        </Router>
      </MantineProvider>
  );
}

export default App;
