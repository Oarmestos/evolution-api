import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.tsx';
import { ThemeController } from './components/ThemeController';
import './index.css';
import { initializeTheme } from './store/useThemeStore';

initializeTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeController />
    <App />
  </StrictMode>,
);
