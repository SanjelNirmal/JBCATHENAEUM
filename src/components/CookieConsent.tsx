// Copyright by nirmal sanjel
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export function setCookie(name: string, value: string, days: number) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

export function getCookie(name: string) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for(let i=0;i < ca.length;i++) {
    let c = ca[i];
    while (c.charAt(0)==' ') c = c.substring(1,c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
  }
  return null;
}

interface CookieConsentProps {
  onNameClaimed: (name: string) => void;
}

export function CookieConsent({ onNameClaimed }: CookieConsentProps) {
  const [status, setStatus] = useState<'checking' | 'undecided' | 'asking_name' | 'answered'>('checking');
  const [nameInput, setNameInput] = useState('');

  useEffect(() => {
    const consent = getCookie('cookieConsent');
    if (consent) {
      setStatus('answered');
      if (consent === 'accepted') {
        const uName = getCookie('userName');
        if (uName) {
          onNameClaimed(uName);
        }
      }
    } else {
      setStatus('undecided');
    }
  }, [onNameClaimed]);

  if (status === 'checking' || status === 'answered') return null;

  if (status === 'undecided') {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#002147] text-white p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] border-t-2 border-[#c49b63]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm">
            <h4 className="font-bold mb-1 text-[#c49b63]">Cookie Preferences</h4>
            <p className="text-slate-300">We use cookies to improve your experience and personalize content. Do you accept cookies?</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => {
                setCookie('cookieConsent', 'declined', 365);
                setStatus('answered');
              }}
              className="text-white hover:text-slate-300 text-sm font-medium px-4 py-2"
            >
              Decline
            </button>
            <button 
              onClick={() => setStatus('asking_name')}
              className="bg-[#c49b63] hover:bg-[#b08b58] text-white px-6 py-2 rounded text-sm font-bold transition-colors"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'asking_name') {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#002147] text-white p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] border-t-2 border-[#c49b63]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 relative">
          <button 
            onClick={() => {
                setCookie('cookieConsent', 'declined', 365);
                setStatus('answered');
            }} 
            className="absolute -top-2 right-0 sm:hidden text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
          <div className="text-sm">
            <h4 className="font-bold mb-1 text-[#c49b63]">Welcome to JBC ATHENAEUM</h4>
            <p className="text-slate-300">Thank you for accepting! What's your name so we can personalize your experience?</p>
          </div>
          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <input 
              type="text" 
              placeholder="Your Name"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              className="px-3 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#c49b63] w-full sm:w-48 rounded-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && nameInput.trim()) {
                  setCookie('cookieConsent', 'accepted', 365);
                  setCookie('userName', nameInput.trim(), 365);
                  onNameClaimed(nameInput.trim());
                  setStatus('answered');
                }
              }}
            />
            <button 
              onClick={() => {
                if (nameInput.trim()) {
                  setCookie('cookieConsent', 'accepted', 365);
                  setCookie('userName', nameInput.trim(), 365);
                  onNameClaimed(nameInput.trim());
                  setStatus('answered');
                } else {
                  setCookie('cookieConsent', 'declined', 365);
                  setStatus('answered');
                }
              }}
              className="bg-[#c49b63] hover:bg-[#b08b58] text-white px-6 py-2 rounded text-sm font-bold transition-colors whitespace-nowrap"
            >
              Save
            </button>
          </div>
          <button 
            onClick={() => {
                setCookie('cookieConsent', 'declined', 365);
                setStatus('answered');
            }} 
            className="hidden sm:block text-slate-400 hover:text-white shrink-0 ml-2"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
