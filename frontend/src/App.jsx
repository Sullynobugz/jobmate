import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { MantineProvider, Container, Title, Button, Group, ActionIcon } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';
import Upload from './pages/Upload';
import Dashboard from './pages/Dashboard';
import ExtractionReview from './pages/ExtractionReview';
import MatchCandidates from './pages/MatchCandidates';
import AdminUsers from './pages/AdminUsers';

function Navigation() {
  const location = useLocation();
  const navLinks = [
    { path: '/', label: 'Voice Interview' },
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/extraction-review', label: 'Interview Review' },
    { path: '/match-candidates', label: 'Interview Results' },
    { path: '/admin-users', label: 'Admin Users' },
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
  const [colorScheme, setColorScheme] = React.useState('light');
  React.useEffect(() => {
    document.body.style.backgroundColor = colorScheme === 'dark' ? '#1a1b1e' : '#ffffff';
    document.body.style.color = colorScheme === 'dark' ? '#ffffff' : '#000000';
  }, [colorScheme]);
  const toggleColorScheme = (value) => setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));

  return (
      <MantineProvider key={colorScheme} 
        theme={{
          colorScheme,
          fontFamily: 'Inter, sans-serif',
          headings: { fontFamily: 'Inter, sans-serif', fontWeight: 600 },
          colors: {
            primary: ['#edf2ff','#dbe4ff','#bac8ff','#91a7ff','#748ffc','#5c7cfa','#4c6ef5','#4263eb','#3b5bdb','#364fc7']
          }
        }}
        withGlobalStyles 
        withNormalizeCSS
        defaultColorScheme="light"
      >
        <Router>
          <Container size="md" py="md">
            <Group justify="space-between" mb="lg">
              <Title order={1}>ApplAI Voice Interview</Title>
              <ActionIcon variant="outline" size="lg" onClick={toggleColorScheme}>
                {colorScheme === 'dark' ? <IconSun /> : <IconMoon />}
              </ActionIcon>
            </Group>
            <Navigation />
            <Routes>
              <Route path="/" element={<Upload />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/extraction-review" element={<ExtractionReview />} />
              <Route path="/match-candidates" element={<MatchCandidates />} />
              <Route path="/admin-users" element={<AdminUsers />} />
            </Routes>
          </Container>
        </Router>
      </MantineProvider>
  );
}

export default App;
