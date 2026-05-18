/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { FeatureSplit } from "./components/FeatureSplit";
import { Footer } from "./components/Footer";
import { NoteViewer } from "./components/NoteViewer";
import { SemestersView } from "./components/SemestersView";
import { ResourcesView } from "./components/ResourcesView";
import { ContributeView } from "./components/ContributeView";
import { InfoView } from "./components/InfoView";
import { LibraryArchivesView } from "./components/LibraryArchivesView";
import { AdminDashboard } from "./components/AdminDashboard";
import { useResourcesData } from "./lib/api";
import { LoginModal } from "./components/LoginModal";
import { CookieConsent } from "./components/CookieConsent";

type ViewState = 'home' | 'viewer' | 'semesters' | 'resources' | 'contribute' | 'info' | 'library' | 'admin';

type UserData = { name: string, faculty: string } | null;

export default function App() {
  const [view, setView] = useState<ViewState>('home');
  const [subjectId, setSubjectId] = useState<string>("bca-cfa");
  const [infoPage, setInfoPage] = useState<string>('Support');
  const [user, setUser] = useState<UserData>(null);
  const [showLogin, setShowLogin] = useState<boolean>(false);
  const [cookieUserName, setCookieUserName] = useState<string | null>(null);

  const { subjects, getSubjectById, loading } = useResourcesData();

  const handleSelectSubject = (subjectId: string) => {
    setSubjectId(subjectId);
    setView('viewer');
  };

  const currentSubjectData = getSubjectById(subjectId) || {
    id: 'placeholder',
    faculty: '-',
    semester: '-',
    name: subjectId,
    notes: []
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {showLogin && (
        <LoginModal 
          onClose={() => setShowLogin(false)} 
          onSuccess={(u) => { 
            setUser(u); 
            setShowLogin(false); 
            if (u.faculty === 'Admin') setView('admin'); 
          }} 
        />
      )}
      <Header 
        onNavigateHome={() => setView('home')} 
        onSelectSubject={handleSelectSubject} 
        onNavigateSemesters={() => setView('semesters')}
        onNavigateResources={() => setView('resources')}
        onNavigateContribute={() => setView('contribute')}
        onNavigateLibrary={() => setView('library')}
        onNavigateAdmin={() => setView('admin')}
        user={user}
        onLoginClick={() => setShowLogin(true)}
        onLogoutClick={() => { setUser(null); if(view === 'admin') setView('home'); }}
        subjects={subjects}
      />
      
      {cookieUserName ? (
        <div className="bg-[#002147] border-b border-[#c49b63]/20 py-3 px-4 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-[#c49b63]/5 to-transparent pointer-events-none"></div>
          <div className="max-w-7xl mx-auto flex items-center justify-between relative z-10">
            <p className="text-sm font-medium text-white flex items-center gap-2">
              <span className="text-[#c49b63] animate-pulse">✨</span>
              Welcome back, <span className="font-serif font-bold text-[#c49b63] text-base tracking-tight">{cookieUserName}</span>
              <span className="hidden sm:inline text-slate-400 font-light ml-1">| Continuing your academic journey.</span>
            </p>
            <button 
              onClick={() => {
                document.cookie = "userName=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                setCookieUserName(null);
              }}
              className="text-[10px] uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
            >
              Not you?
            </button>
          </div>
        </div>
      ) : null}

      {view === 'home' && (
        <>
          <Hero onNavigateResources={() => setView('resources')} />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-12 pb-24">
            <FeatureSplit onNavigateViewer={() => handleSelectSubject('bca-cfa')} />
          </main>
        </>
      )}

      {view === 'viewer' && (
        <main className="flex-1 w-full pb-24">
          <NoteViewer subjectData={currentSubjectData} />
        </main>
      )}

      {view === 'semesters' && (
        <main className="flex-1 w-full pb-24">
          <SemestersView onSelectSubject={handleSelectSubject} subjects={subjects} />
        </main>
      )}

      {view === 'resources' && (
        <main className="flex-1 w-full pb-24">
          <ResourcesView onSelectSubject={handleSelectSubject} subjects={subjects} />
        </main>
      )}

      {view === 'contribute' && (
        <main className="flex-1 w-full pb-24">
          <ContributeView />
        </main>
      )}

      {view === 'info' && (
        <main className="flex-1 w-full pb-24">
          <InfoView pageTitle={infoPage} />
        </main>
      )}

      {view === 'library' && (
        <main className="flex-1 w-full pb-24">
          <LibraryArchivesView />
        </main>
      )}

      {view === 'admin' && user?.faculty === 'Admin' && (
        <main className="flex-1 w-full pb-24 bg-slate-50">
          <AdminDashboard />
        </main>
      )}
      
      <Footer onNavigateInfo={(page) => {
        setInfoPage(page);
        setView('info');
      }} />

      <CookieConsent onNameClaimed={setCookieUserName} />
    </div>
  );
}


