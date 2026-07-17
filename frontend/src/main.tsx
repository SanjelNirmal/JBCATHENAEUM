// Copyright by nirmal sanjel | hackingwithnirmal@gmail.com | +977 9848744321
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ConfigurationErrorScreen } from './components/ConfigurationErrorScreen.tsx';
import { publicEnvironment } from './lib/env.ts';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {publicEnvironment.issues.length > 0 ? (
      <ConfigurationErrorScreen issues={publicEnvironment.issues} />
    ) : (
      <App />
    )}
  </StrictMode>,
);
