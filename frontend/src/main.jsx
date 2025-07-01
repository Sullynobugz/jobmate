console.log("main.jsx loaded");
import React from 'react';
import ReactDOM from 'react-dom/client';
import '@mantine/core/styles.css';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
