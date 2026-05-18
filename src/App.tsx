// Copyright by nirmal sanjel
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { FeatureSplit } from "./components/FeatureSplit";
import { Footer } from "./components/Footer";
import { StatsSection } from "./components/StatsSection";
import { PopularCollections } from "./components/PopularCollections";
import { NoteViewer } from "./components/NoteViewer";
import { SemestersView } from "./components/SemestersView";
import { ResourcesView } from "./components/ResourcesView";
import { ContributeView } from "./components/ContributeView";
import { InfoView } from "./components/InfoView";
import { LibraryArchivesView } from "./components/LibraryArchivesView";
import { AdminDashboard } from "./components/AdminDashboard";
import { useResourcesData } from "./lib/api";
import { LoginModal } from "./components/LoginModal";
import { CookieConsent, getCookie } from "./components/CookieConsent";
import { FileText, FileBadge, FileCheck } from "lucide-react";

function NoteIcon({ type }: { type: string }) {
  if (type === 'PDF') return <FileCheck size={20} />;
  if (type === 'DOCX') return <FileBadge size={20} />;
  return <FileText size={20} />;
}

type ViewState = 'home' | 'viewer' | 'semesters' | 'resources' | 'contribute' | 'info' | 'library' | 'admin';

type UserData = { name: string, faculty: string } | null;

export default function App() {
  const [view, setView] = useState<ViewState>('home');
  const [subjectId, setSubjectId] = useState<string>("bca-cfa");
  const [infoPage, setInfoPage] = useState<string>('Support');
  const [user, setUser] = useState<UserData>(() => {
    const saved = localStorage.getItem('jbc_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [showLogin, setShowLogin] = useState<boolean>(false);

  const [cookieUserName, setCookieUserName] = useState<string | null>(null);

  useEffect(() => {
    const savedName = getCookie('userName');
    if (savedName) {
      setCookieUserName(savedName);
    }
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('jbc_user', JSON.stringify(user));
      // Sync auth name to cookie name if they match the admin role
      if (user.name && !cookieUserName) {
        setCookieUserName(user.name);
      }
    } else {
      localStorage.removeItem('jbc_user');
    }
  }, [user, cookieUserName]);

  const { subjects, getSubjectById, loading, resources } = useResourcesData();

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
        resources={resources}
        cookieUserName={cookieUserName}
      />
      
      {cookieUserName ? (
        <div className="bg-[#002147] border-b border-[#c49b63] py-2 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#c49b63]/10 via-transparent to-transparent pointer-events-none"></div>
          <div className="max-w-7xl mx-auto flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#c49b63] flex items-center justify-center text-[#002147] font-bold text-xs ring-4 ring-[#c49b63]/20">
                {cookieUserName.charAt(0).toUpperCase()}
              </div>
              <p className="text-sm font-medium text-white flex flex-col sm:flex-row sm:items-center sm:gap-2">
                <span className="text-slate-300">Welcome,</span>
                <span className="font-bold text-[#c49b63] text-base tracking-tight uppercase">{cookieUserName}</span>
                <span className="hidden lg:inline text-slate-500 font-light ml-1 italic">| Your academic portal is ready.</span>
              </p>
            </div>
            <button 
              onClick={() => {
                document.cookie = "userName=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                document.cookie = "cookieConsent=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                setCookieUserName(null);
              }}
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-white/5 transition-all"
            >
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 group-hover:text-[#c49b63]">Clear Cache</span>
            </button>
          </div>
        </div>
      ) : null}

      {view === 'home' && (
        <>
          <Hero 
            onNavigateResources={() => setView('resources')} 
            onSelectSubject={handleSelectSubject}
            onNavigateSemesters={() => setView('semesters')}
            subjects={subjects}
            resources={resources}
          />
          <StatsSection />
          
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-12 pb-24">
            <PopularCollections onSelect={handleSelectSubject} onViewAll={() => setView('resources')} />
            
            {/* Recent Uploads Section */}
            <section className="py-24 border-t border-slate-100">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                <div>
                  <h2 className="text-3xl font-serif font-bold text-[#002147] mb-6">Recently Added Resources</h2>
                  <div className="space-y-4">
                    {resources.slice(0, 4).map((item) => (
                      <div 
                        key={item.id} 
                        onClick={() => {
                          setSubjectId(item.subject);
                          setView('viewer');
                        }}
                        className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-lg group hover:border-[#c49b63] transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded bg-[#002147]/5 flex items-center justify-center text-[#002147]">
                            <NoteIcon type={item.resource_type || 'PDF'} />
                          </div>
                          <div>
                            <h4 className="font-bold text-[#002147] group-hover:text-[#c49b63] transition-colors">{item.title}</h4>
                            <p className="text-xs text-slate-400">{item.faculty} — {item.semester}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="block text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                            {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    ))}
                    {resources.length === 0 && (
                      <div className="p-8 text-center border border-dashed border-slate-200 rounded-lg">
                        <p className="text-sm text-slate-400">Waiting for first contribution...</p>
                        <button 
                          onClick={() => setView('contribute')}
                          className="mt-3 text-xs font-bold text-[#c49b63] uppercase tracking-widest hover:underline"
                        >
                          Be the first to upload
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-[#002147] rounded-3xl p-10 text-white relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#c49b63]/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                  <h2 className="text-3xl font-serif font-bold mb-8 relative z-10">Why JBC ATHENAEUM?</h2>
                  <div className="space-y-6 relative z-10">
                    {[
                      'Organized semester-wise archives',
                      'Verified academic materials',
                      'Community-driven note sharing',
                      'Secure digital preservation',
                      'Designed specifically for JBC scholars'
                    ].map((text, i) => (
                      <div key={i} className="flex items-start gap-4">
                        <div className="w-6 h-6 rounded-full bg-[#c49b63] flex items-center justify-center shrink-0 mt-0.5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <p className="text-white/80 font-light">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

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
          <ContributeView initialName={user?.name || cookieUserName || undefined} />
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


