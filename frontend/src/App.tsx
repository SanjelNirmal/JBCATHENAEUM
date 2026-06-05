// Copyright by nirmal sanjel | hackingwithnirmal@gmail.com | +977 9848744321
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
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
import { EduPilotWorkspaceView } from "./components/EduPilotWorkspaceView";
import { useResourcesData, useAuth, signOut } from "./lib/api";
import { LoginModal } from "./components/LoginModal";
import { CookieConsent, getCookie } from "./components/CookieConsent";
import { FileText, FileBadge, FileCheck, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

function NoteIcon({ type }: { type: string }) {
  if (type === 'PDF') return <FileCheck size={20} />;
  if (type === 'DOCX') return <FileBadge size={20} />;
  return <FileText size={20} />;
}

type ViewState = 'home' | 'viewer' | 'semesters' | 'resources' | 'contribute' | 'info' | 'library' | 'admin' | 'edupilot';

export default function App() {
  const [view, setView] = useState<ViewState>('home');
  const [subjectId, setSubjectId] = useState<string>("bca-cfa");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [infoPage, setInfoPage] = useState<string>('Support');
  const { profile: user, loading: authLoading } = useAuth();
  const [showLogin, setShowLogin] = useState<boolean>(false);
  const closeLoginModal = useCallback(() => setShowLogin(false), []);
  const hasProcessedSharedLink = useRef(false);

  const [cookieUserName, setCookieUserName] = useState<string | null>(null);

  useEffect(() => {
    const savedName = getCookie('userName');
    if (savedName) {
      setCookieUserName(savedName);
    }
  }, []);

  useEffect(() => {
    if (user && user.role === 'admin' && view === 'home') {
      // Auto-navigate to admin if they were on home and just logged in
      // Optional: setView('admin'); 
    }
  }, [user]);

  const { subjects, getSubjectById, loading, resources } = useResourcesData();

  const updateViewerUrl = useCallback((nextSubjectId: string, nextNoteId?: string | null) => {
    const url = new URL(window.location.href);
    url.searchParams.set('subject', nextSubjectId);
    if (nextNoteId) {
      url.searchParams.set('note', nextNoteId);
    } else {
      url.searchParams.delete('note');
    }
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }, []);

  const handleNoteChange = useCallback((nextSubjectId: string, noteId: string | null) => {
    setSelectedNoteId(noteId);
    updateViewerUrl(nextSubjectId, noteId);
  }, [updateViewerUrl]);

  useEffect(() => {
    if (hasProcessedSharedLink.current || subjects.length === 0) return;
    hasProcessedSharedLink.current = true;
    const searchParams = new URLSearchParams(window.location.search);
    const sharedSubjectId = searchParams.get('subject');
    const sharedNoteId = searchParams.get('note');
    if (!sharedSubjectId) return;
    const sharedSubject = subjects.find((subject) => subject.id === sharedSubjectId);
    if (!sharedSubject) return;
    const hasSharedNote = sharedNoteId
      ? sharedSubject.notes.some((note) => note.id === sharedNoteId)
      : false;
    setSubjectId(sharedSubjectId);
    setSelectedNoteId(hasSharedNote ? sharedNoteId : null);
    setView('viewer');
  }, [subjects]);

  const handleSelectSubject = (nextSubjectId: string, nextNoteId?: string) => {
    setSubjectId(nextSubjectId);
    setSelectedNoteId(nextNoteId || null);
    setView('viewer');
    updateViewerUrl(nextSubjectId, nextNoteId || null);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      if (view === 'admin') setView('home');
    } catch (err) {
      console.error("Logout failed:", err);
    }
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
          onClose={closeLoginModal} 
          onSuccess={(profile) => { 
            closeLoginModal(); 
            if (profile.role === 'admin') setView('admin'); 
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
        onNavigateEduPilot={() => setView('edupilot')}
        onNavigateAdmin={() => setView('admin')}
        user={user ? { name: user.name, faculty: user.faculty, role: user.role } : null}
        onLoginClick={() => setShowLogin(true)}
        onLogoutClick={handleLogout}
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
                const secureCookieSuffix = window.location.protocol === 'https:' ? '; Secure' : '';
                document.cookie = `userName=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax${secureCookieSuffix}`;
                document.cookie = `cookieConsent=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax${secureCookieSuffix}`;
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
          
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-12 pb-24">
            <PopularCollections onSelect={handleSelectSubject} onViewAll={() => setView('resources')} />

            <section className="py-14 border-t border-slate-100">
              <div className="rounded-3xl border border-[#002147]/10 bg-[#002147]/5 p-6 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] font-black text-[#c49b63] mb-2">New</p>
                  <h3 className="text-2xl md:text-3xl font-serif font-bold text-[#002147]">EduPilot Workspace Blueprint</h3>
                  <p className="text-slate-600 text-sm mt-2 max-w-2xl">
                    Review and use the connected archive + exam-prep structure for subjects, flashcards, quizzes, revision notes, and study scheduling.
                  </p>
                </div>
                <button
                  onClick={() => setView('edupilot')}
                  className="px-8 py-4 bg-[#002147] hover:bg-[#001b3a] text-white text-[11px] uppercase tracking-[0.2em] font-black rounded-xl self-start md:self-auto"
                >
                  Open EduPilot
                </button>
              </div>
            </section>
            
            {/* Recent Uploads Section */}
            <section className="py-20 md:py-32 border-t border-slate-100">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
                <div className="lg:col-span-7">
                  <div className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-[0.25em] rounded-full mb-5">
                    Fresh Intel
                  </div>
                  <h2 className="text-3xl md:text-5xl font-serif font-bold text-[#002147] mb-8 md:mb-10 tracking-tight">Recent Dispatches</h2>
                  <div className="space-y-4">
                    {resources.slice(0, 5).map((item, index) => (
                      <motion.div 
                        key={item.id} 
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => {
                          let matchedById: (typeof subjects)[number] | undefined;
                          let matchedByScope: (typeof subjects)[number] | undefined;
                          let matchedByName: (typeof subjects)[number] | undefined;

                          for (const subject of subjects) {
                            if (subject.id === item.subject) {
                              matchedById = subject;
                              break;
                            }

                            if (
                              !matchedByScope &&
                              subject.name === item.subject &&
                              subject.faculty === item.faculty &&
                              subject.semester === item.semester
                            ) {
                              matchedByScope = subject;
                            }

                            if (!matchedByName && subject.name === item.subject) {
                              matchedByName = subject;
                            }
                          }

                          const matchedSubject = matchedById || matchedByScope || matchedByName;
                          handleSelectSubject(matchedSubject?.id || item.subject, item.id);
                        }}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-5 md:p-6 bg-white border border-slate-100 rounded-2xl group hover:border-[#c49b63] hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer gap-4 sm:gap-0"
                      >
                        <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0">
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[#002147]/5 flex items-center justify-center text-[#002147] group-hover:bg-[#c49b63]/10 group-hover:text-[#c49b63] transition-all">
                            <NoteIcon type={item.resource_type || 'PDF'} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-[#002147] text-base md:text-lg group-hover:text-[#c49b63] transition-colors leading-snug line-clamp-2 break-words">{item.title}</h4>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-[9px] md:text-[10px] text-slate-400 uppercase font-black tracking-widest whitespace-nowrap">{item.faculty}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300 hidden xs:block"></span>
                              <span className="text-[9px] md:text-[10px] text-slate-400 uppercase font-black tracking-widest whitespace-nowrap">Sem {item.semester}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right sm:block flex justify-between items-center bg-slate-50 sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none mt-2 sm:mt-0">
                          <span className="text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-[#c49b63] transition-colors">
                            {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                          <ArrowRight className="sm:hidden text-slate-200" size={14} />
                        </div>
                      </motion.div>
                    ))}
                    {resources.length === 0 && (
                      <div className="p-10 md:p-16 text-center border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50/50">
                        <p className="text-slate-400 font-serif italic text-lg">Curating the next wave of knowledge...</p>
                        <button 
                          onClick={() => setView('contribute')}
                          className="mt-6 inline-flex items-center gap-2 text-[10px] font-black text-[#c49b63] uppercase tracking-[0.25em] hover:text-[#002147] transition-all"
                        >
                          Contribute to the archive <ArrowRight size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <div className="bg-[#002147] rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl group min-h-[400px] md:min-h-[500px] flex flex-col justify-center">
                    {/* Decorative abstract elements */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-[#c49b63]/10 rounded-full blur-[100px] -mr-40 -mt-40 group-hover:bg-[#c49b63]/20 transition-all duration-1000"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] -ml-32 -mb-32"></div>
                    
                    <div className="relative z-10 text-center md:text-left">
                      <div className="text-[10px] font-black text-[#c49b63] uppercase tracking-[0.4em] mb-6">The JBC Advantage</div>
                      <h2 className="text-3xl md:text-5xl font-serif font-bold mb-10 leading-[0.9] tracking-tighter">Academic Excellence Redefined.</h2>
                      
                      <div className="space-y-6 md:space-y-8 text-left">
                        {[
                          { title: 'Semantic Indexing', desc: 'Resources mapped to your specific course curriculum.' },
                          { title: 'Peer-Verified', desc: 'Materials curated and vetted by the campus community.' },
                          { title: 'Instant Retrieval', desc: 'High-speed access to thousands of past question variants.' }
                        ].map((feature, i) => (
                          <div key={i} className="flex gap-4 md:gap-5">
                            <div className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full border border-white/10 flex items-center justify-center text-[#c49b63] font-mono text-[10px]">
                              0{i + 1}
                            </div>
                            <div>
                              <h4 className="font-bold text-white text-sm md:text-base tracking-tight mb-1">{feature.title}</h4>
                              <p className="text-white/40 text-xs md:text-sm font-light leading-relaxed">{feature.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button 
                         onClick={() => {
                           setInfoPage('Our Mission');
                           setView('info');
                         }}
                         className="mt-12 group flex items-center justify-center md:justify-start gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-[#c49b63] hover:text-white transition-all w-full md:w-auto"
                      >
                        Learn about our mission <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </>
      )}

      {view === 'viewer' && (
        <main className="flex-1 w-full pb-24">
          <NoteViewer
            subjectData={currentSubjectData}
            initialNoteId={selectedNoteId}
            onNoteChange={handleNoteChange}
          />
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

      {view === 'admin' && user?.role === 'admin' && (
        <main className="flex-1 w-full pb-24 bg-slate-50">
          <AdminDashboard />
        </main>
      )}

      {view === 'edupilot' && (
        <main className="flex-1 w-full pb-24 bg-slate-50">
          <EduPilotWorkspaceView />
        </main>
      )}
      
      {view === 'home' && <StatsSection />}
      
      <Footer onNavigateInfo={(page) => {
        setInfoPage(page);
        setView('info');
      }} />

      <CookieConsent onNameClaimed={setCookieUserName} />
    </div>
  );
}
