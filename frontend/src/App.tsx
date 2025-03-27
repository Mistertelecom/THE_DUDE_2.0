import React, { useState } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import NetworkCanvas from './components/NetworkCanvas';
import { lightTheme, darkTheme } from './theme';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <NetworkCanvas onThemeChange={setIsDarkMode} />
    </ThemeProvider>
  );
}

export default App; 