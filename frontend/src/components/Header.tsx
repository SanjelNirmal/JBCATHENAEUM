// Copyright by nirmal sanjel | hackingwithnirmal@gmail.com | +977 9848744321
import { Search, LogIn, ChevronDown, Library, Menu, X as CloseIcon } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Subject } from "../lib/api";

export function Header({ 
  onNavigateHome, 
  onSelectSubject,
  onNavigateSemesters,
  onNavigateResources,
  onNavigateContribute,
  onNavigateLibrary,
  onNavigateAdmin,
  user,
  onLoginClick,
  onLogoutClick,
  subjects,
  resources = [],
  cookieUserName
}: { 
  onNavigateHome?: () => void, 
  onSelectSubject?: (subjectId: string) => void,
  onNavigateSemesters?: () => void,
  onNavigateResources?: () => void,
  onNavigateContribute?: () => void,
  onNavigateLibrary?: () => void,
  onNavigateAdmin?: () => void,
  user?: { name: string, faculty: string, role: string } | null,
  onLoginClick?: () => void,
  onLogoutClick?: () => void,
  subjects: Subject[],
  resources?: any[],
  cookieUserName?: string | null
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileFacultiesOpen, setIsMobileFacultiesOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Close search on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearch(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const subjectResults = debouncedQuery.length > 2 
    ? subjects.filter(sub => 
        sub.name.toLowerCase().includes(debouncedQuery.toLowerCase()) || 
        sub.faculty.toLowerCase().includes(debouncedQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const noteResults = debouncedQuery.length > 2
    ? resources.filter(res => 
        res.title.toLowerCase().includes(debouncedQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const hasResults = subjectResults.length > 0 || noteResults.length > 0;

  const NavLink = ({ label, onClick, className = "" }: { label: string, onClick?: () => void, className?: string }) => (
    <div 
      onClick={() => {
        onClick?.();
        setIsMobileMenuOpen(false);
      }} 
      className={`cursor-pointer transition-colors ${className}`}
    >
      {label}
    </div>
  );

  return (
    <header className="w-full relative font-sans flex flex-col z-50">
      {/* Top Utility Bar */}
      <div className="bg-[#001b3a] text-slate-300 text-xs px-4 md:px-12 py-2 flex justify-between md:justify-end items-center border-b border-white/10">
        
        {/* Mobile Logo (Tiny) */}
        <div className="flex md:hidden items-center" onClick={onNavigateHome}>
          <span className="text-[#c49b63] font-serif font-black tracking-tighter">JBC ATHENAEUM</span>
        </div>

        <div className="flex items-center space-x-4 md:space-x-6">
          {/* Search Bar - Hidden on small mobile, shown on md+ or through separate UI */}
          <div className="relative hidden md:block" ref={searchRef}>
            <div className="flex items-center bg-white/10 rounded px-3 py-1 border border-white/5 text-slate-300 hover:text-white transition-colors group">
              <Search size={14} className="mr-2" />
              <input 
                type="text"
                placeholder="Search subjects or notes..."
                className="bg-transparent border-none outline-none text-slate-300 placeholder:text-slate-300/70 w-48 text-xs"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearch(true);
                }}
                onFocus={() => setShowSearch(true)}
              />
            </div>
            
            {/* Search Dropdown */}
            {showSearch && debouncedQuery.length > 2 && (
              <div className="absolute top-full mt-2 right-0 w-80 bg-white shadow-2xl border border-slate-200 rounded-lg text-slate-800 z-50 max-h-[32rem] overflow-hidden">
                {hasResults ? (
                  <div className="flex flex-col">
                    {subjectResults.length > 0 && (
                      <div className="py-2">
                        <div className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50 border-y border-slate-100 flex items-center justify-between">
                          <span>Matching Subjects</span>
                          <span className="bg-slate-200 text-slate-500 px-1.5 rounded-sm">{subjectResults.length}</span>
                        </div>
                        {subjectResults.map(sub => (
                          <div 
                            key={sub.id} 
                            className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-l-4 border-transparent hover:border-[#c49b63] transition-all"
                            onClick={() => {
                              setShowSearch(false);
                              setSearchQuery('');
                              onSelectSubject?.(sub.id);
                            }}
                          >
                            <div className="text-sm font-bold text-[#002147] flex items-center justify-between">
                              {sub.name}
                              <ChevronDown size={12} className="-rotate-90 text-slate-300" />
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-medium">
                              <span className="text-[#c49b63]">{sub.faculty}</span> &bull; {sub.semester}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {noteResults.length > 0 && (
                      <div className="py-2 border-t border-slate-100">
                        <div className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50 border-y border-slate-100 flex items-center justify-between">
                          <span>Specific Documents</span>
                          <span className="bg-slate-200 text-slate-500 px-1.5 rounded-sm">{noteResults.length}</span>
                        </div>
                        {noteResults.map(note => (
                          <div 
                            key={note.id} 
                            className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-l-4 border-transparent hover:border-[#002147] transition-all"
                            onClick={() => {
                              setShowSearch(false);
                              setSearchQuery('');
                              onSelectSubject?.(note.subject);
                            }}
                          >
                            <div className="text-sm font-medium text-[#002147] truncate">{note.title}</div>
                            <div className="text-[10px] text-slate-400 mt-1 uppercase font-light">
                              {note.faculty} &bull; {note.semester}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <button 
                      onClick={() => { setShowSearch(false); onNavigateResources?.(); }}
                      className="w-full py-3 bg-slate-50 text-[10px] font-bold text-[#c49b63] uppercase tracking-[0.2em] hover:bg-amber-50 transition-colors border-t border-slate-100"
                    >
                      View All results for "{debouncedQuery}"
                    </button>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-white">
                    <Search size={32} className="mx-auto text-slate-100 mb-3" />
                    <p className="text-xs text-slate-500 font-medium italic">No subjects or notes found matching "{debouncedQuery}"</p>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">Try searching for a faculty like "BCA"</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <button onClick={onNavigateLibrary} className="hover:text-white transition-colors uppercase tracking-[0.15em] font-black hidden md:block">
            Library
          </button>
          {user ? (
            <div className="flex items-center space-x-4">
              {user.role === 'admin' && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateAdmin?.();
                  }}
                  className="hover:text-white transition-colors uppercase tracking-widest font-semibold text-[10px] border border-[#c49b63] text-[#c49b63] px-2 py-0.5 rounded-sm"
                >
                  Dashboard
                </button>
              )}
              <div className="hidden md:block text-right">
                <div className="text-sm font-semibold">{user.name}</div>
                <div className="text-[10px] text-white/70 uppercase">{user.faculty}</div>
              </div>
              <button onClick={onLogoutClick} className="hover:text-white/70 transition-colors uppercase tracking-[0.15em] font-black text-[10px] border border-white/20 px-2 py-0.5 rounded-sm">
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              {cookieUserName && (
                <div className="hidden sm:flex items-center space-x-2 mr-1 px-2 py-0.5 bg-[#c49b63]/10 rounded-full border border-[#c49b63]/20">
                  <div className="w-4 h-4 rounded-full bg-[#c49b63] flex items-center justify-center text-[#002147] text-[8px] font-black">
                    {cookieUserName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[9px] font-black text-[#c49b63] tracking-wider uppercase">{cookieUserName}</span>
                </div>
              )}
              <button onClick={onLoginClick} className="hover:text-white transition-colors uppercase tracking-[0.15em] font-black flex items-center space-x-1.5 group">
                <LogIn size={12} />
                <span>Login</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="bg-white border-b border-slate-200 shadow-sm relative">
        <div className="max-w-7xl mx-auto px-4 md:px-12 flex items-center justify-between h-20 md:h-24">
          
          {/* Logo / Brand */}
          <div className="flex items-center cursor-pointer group" onClick={onNavigateHome}>
            <img src="/logo.png" alt="JBC ATHENAEUM Logo" className="w-10 h-10 md:w-14 md:h-14 object-contain mr-3 md:mr-4 transition-transform group-hover:scale-110" onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              e.currentTarget.parentElement!.querySelector('.fallback-icon')!.classList.remove('hidden');
            }} />
            <div className="hidden fallback-icon w-10 h-10 md:w-12 md:h-12 bg-[#002147] flex items-center justify-center mr-3 md:mr-4 rounded-lg">
              <Library size={20} className="text-white" strokeWidth={2} />
            </div>
            <div className="leading-tight">
              <h1 className="text-base md:text-xl font-serif font-black tracking-tighter text-[#002147] uppercase">JBC <span className="text-[#c49b63]">Athenaeum</span></h1>
              <p className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">Registry of Knowledge</p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex h-full items-center space-x-10 text-[11px] font-black tracking-[0.2em] uppercase">
            
            {/* Faculties link with Mega Menu */}
            <div className="group flex items-center h-full cursor-pointer text-[#002147] border-b-2 border-transparent hover:border-[#c49b63] transition-all">
              <span className="flex items-center space-x-2 h-full pt-1">
                <span>Faculties</span>
                <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300 text-[#c49b63]" />
              </span>

              {/* Full-width Mega Menu Dropdown */}
              <div className="absolute left-0 top-full w-full bg-[#001b3a] text-white opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] overflow-hidden pointer-events-none group-hover:pointer-events-auto z-40 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-12 py-16 grid grid-cols-4 gap-12">
                  
                  {/* Column 1: BCA */}
                  <div className="space-y-6">
                    <h3 className="text-[#c49b63] font-serif text-xl italic mb-6 border-b border-white/10 pb-3">
                      BCA <span className="text-[10px] font-sans font-black text-white/30 not-italic tracking-[0.3em] ml-2">COMPUTER APPS</span>
                    </h3>
                    <ul className="space-y-3 text-xs text-white/60 font-medium">
                      <li onClick={() => onSelectSubject?.('bca-c-programming')} className="hover:text-[#c49b63] hover:translate-x-1 cursor-pointer transition-all flex items-center gap-2 group/item"><span className="w-1 h-1 bg-[#c49b63]/40 rounded-full group-hover/item:scale-150 transition-all"></span> Programming in C</li>
                      <li onClick={() => onSelectSubject?.('bca-dsa')} className="hover:text-[#c49b63] hover:translate-x-1 cursor-pointer transition-all flex items-center gap-2 group/item"><span className="w-1 h-1 bg-[#c49b63]/40 rounded-full group-hover/item:scale-150 transition-all"></span> Data Structures & Algo</li>
                      <li onClick={() => onSelectSubject?.('bca-dbms')} className="hover:text-[#c49b63] hover:translate-x-1 cursor-pointer transition-all flex items-center gap-2 group/item"><span className="w-1 h-1 bg-[#c49b63]/40 rounded-full group-hover/item:scale-150 transition-all"></span> Database Management</li>
                      <li onClick={() => onSelectSubject?.('bca-web-tech')} className="hover:text-[#c49b63] hover:translate-x-1 cursor-pointer transition-all flex items-center gap-2 group/item"><span className="w-1 h-1 bg-[#c49b63]/40 rounded-full group-hover/item:scale-150 transition-all"></span> Web Technology</li>
                      <li onClick={() => onSelectSubject?.('bca-se')} className="hover:text-[#c49b63] hover:translate-x-1 cursor-pointer transition-all flex items-center gap-2 group/item"><span className="w-1 h-1 bg-[#c49b63]/40 rounded-full group-hover/item:scale-150 transition-all"></span> Software Engineering</li>
                    </ul>
                  </div>

                  {/* Column 2: BSW */}
                  <div className="space-y-6">
                    <h3 className="text-[#c49b63] font-serif text-xl italic mb-6 border-b border-white/10 pb-3">
                      BSW <span className="text-[10px] font-sans font-black text-white/30 not-italic tracking-[0.3em] ml-2">SOCIAL WORK</span>
                    </h3>
                    <ul className="space-y-3 text-xs text-white/60 font-medium">
                      <li onClick={() => onSelectSubject?.('bsw-intro-social-work')} className="hover:text-[#c49b63] hover:translate-x-1 cursor-pointer transition-all flex items-center gap-2 group/item"><span className="w-1 h-1 bg-[#c49b63]/40 rounded-full group-hover/item:scale-150 transition-all"></span> Intro to Social Work</li>
                      <li onClick={() => onSelectSubject?.('bsw-basic-sociology')} className="hover:text-[#c49b63] hover:translate-x-1 cursor-pointer transition-all flex items-center gap-2 group/item"><span className="w-1 h-1 bg-[#c49b63]/40 rounded-full group-hover/item:scale-150 transition-all"></span> Sociology Concepts</li>
                      <li onClick={() => onSelectSubject?.('bsw-basic-psychology')} className="hover:text-[#c49b63] hover:translate-x-1 cursor-pointer transition-all flex items-center gap-2 group/item"><span className="w-1 h-1 bg-[#c49b63]/40 rounded-full group-hover/item:scale-150 transition-all"></span> Basic Psychology</li>
                      <li onClick={() => onSelectSubject?.('bsw-community-development')} className="hover:text-[#c49b63] hover:translate-x-1 cursor-pointer transition-all flex items-center gap-2 group/item"><span className="w-1 h-1 bg-[#c49b63]/40 rounded-full group-hover/item:scale-150 transition-all"></span> Community Development</li>
                      <li onClick={() => onSelectSubject?.('bsw-field-practicum1')} className="hover:text-[#c49b63] hover:translate-x-1 cursor-pointer transition-all flex items-center gap-2 group/item"><span className="w-1 h-1 bg-[#c49b63]/40 rounded-full group-hover/item:scale-150 transition-all"></span> Field Work Practicum</li>
                    </ul>
                  </div>

                  {/* Column 3: BBS */}
                  <div className="space-y-6">
                    <h3 className="text-[#c49b63] font-serif text-xl italic mb-6 border-b border-white/10 pb-3">
                      BBS <span className="text-[10px] font-sans font-black text-white/30 not-italic tracking-[0.3em] ml-2">BUSINESS</span>
                    </h3>
                    <ul className="space-y-3 text-xs text-white/60 font-medium">
                      <li onClick={() => onSelectSubject?.('mgt-207')} className="hover:text-[#c49b63] hover:translate-x-1 cursor-pointer transition-all flex items-center gap-2 group/item"><span className="w-1 h-1 bg-[#c49b63]/40 rounded-full group-hover/item:scale-150 transition-all"></span> Microeconomics</li>
                      <li onClick={() => onSelectSubject?.('mgt-213')} className="hover:text-[#c49b63] hover:translate-x-1 cursor-pointer transition-all flex items-center gap-2 group/item"><span className="w-1 h-1 bg-[#c49b63]/40 rounded-full group-hover/item:scale-150 transition-all"></span> Principles of Mgt</li>
                      <li onClick={() => onSelectSubject?.('mgt-211')} className="hover:text-[#c49b63] hover:translate-x-1 cursor-pointer transition-all flex items-center gap-2 group/item"><span className="w-1 h-1 bg-[#c49b63]/40 rounded-full group-hover/item:scale-150 transition-all"></span> Financial Accounting</li>
                      <li onClick={() => onSelectSubject?.('mgt-202')} className="hover:text-[#c49b63] hover:translate-x-1 cursor-pointer transition-all flex items-center gap-2 group/item"><span className="w-1 h-1 bg-[#c49b63]/40 rounded-full group-hover/item:scale-150 transition-all"></span> Business Statistics</li>
                      <li onClick={() => onSelectSubject?.('mgt-214')} className="hover:text-[#c49b63] hover:translate-x-1 cursor-pointer transition-all flex items-center gap-2 group/item"><span className="w-1 h-1 bg-[#c49b63]/40 rounded-full group-hover/item:scale-150 transition-all"></span> Marketing Fundamentals</li>
                    </ul>
                  </div>

                  {/* Column 4: BICTE */}
                  <div className="space-y-6">
                    <h3 className="text-[#c49b63] font-serif text-xl italic mb-6 border-b border-white/10 pb-3">
                      BICTE <span className="text-[10px] font-sans font-black text-white/30 not-italic tracking-[0.3em] ml-2">ICT ED</span>
                    </h3>
                    <ul className="space-y-3 text-xs text-white/60 font-medium">
                      <li onClick={() => onSelectSubject?.('ict-ed-416')} className="hover:text-[#c49b63] hover:translate-x-1 cursor-pointer transition-all flex items-center gap-2 group/item"><span className="w-1 h-1 bg-[#c49b63]/40 rounded-full group-hover/item:scale-150 transition-all"></span> Programming Concept</li>
                      <li onClick={() => onSelectSubject?.('ict-ed-426')} className="hover:text-[#c49b63] hover:translate-x-1 cursor-pointer transition-all flex items-center gap-2 group/item"><span className="w-1 h-1 bg-[#c49b63]/40 rounded-full group-hover/item:scale-150 transition-all"></span> OOP with C++</li>
                      <li onClick={() => onSelectSubject?.('ict-ed-435')} className="hover:text-[#c49b63] hover:translate-x-1 cursor-pointer transition-all flex items-center gap-2 group/item"><span className="w-1 h-1 bg-[#c49b63]/40 rounded-full group-hover/item:scale-150 transition-all"></span> Data Structure & Algo</li>
                      <li onClick={() => onSelectSubject?.('ict-ed-437')} className="hover:text-[#c49b63] hover:translate-x-1 cursor-pointer transition-all flex items-center gap-2 group/item"><span className="w-1 h-1 bg-[#c49b63]/40 rounded-full group-hover/item:scale-150 transition-all"></span> Web Technology</li>
                      <li onClick={onNavigateSemesters} className="text-[#c49b63] underline underline-offset-4 decoration-white/20 hover:decoration-[#c49b63] cursor-pointer text-[10px] font-black mt-4 uppercase tracking-[0.2em]">View Full Directory</li>
                    </ul>
                  </div>
                  
                </div>
                <div className="bg-[#c49b63] h-1.5 w-full"></div>
              </div>
            </div>

            <div onClick={onNavigateSemesters} className="text-slate-400 hover:text-[#002147] cursor-pointer transition-colors flex items-center h-full">Semesters</div>
            <div onClick={onNavigateResources} className="text-slate-400 hover:text-[#002147] cursor-pointer transition-colors flex items-center h-full">Resources</div>
            <button onClick={onNavigateContribute} className="bg-[#002147] hover:bg-[#c49b63] text-white px-8 py-3.5 text-[10px] font-black uppercase tracking-[0.25em] transition-all shadow-xl hover:shadow-[#c49b63]/20 hover:-translate-y-0.5 ml-6 border-none rounded-xl">
              Upload Notes
            </button>
          </nav>

          {/* Right Section: Auth & Mobile Controls */}
          <div className="flex items-center space-x-2 md:space-x-6">
            {/* Mobile Search Toggle */}
            <button 
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="md:hidden p-3 bg-slate-50 rounded-2xl text-[#002147] hover:bg-slate-100 transition-all mr-2"
            >
              {mobileSearchOpen ? <CloseIcon size={20} /> : <Search size={20} />}
            </button>
            
            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="md:hidden p-3 bg-slate-50 rounded-2xl text-[#002147] hover:bg-slate-100 transition-all"
            >
              {isMobileMenuOpen ? <CloseIcon size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-[#001b3a] z-[100] md:hidden overflow-y-auto pt-24 px-8 pb-12 flex flex-col items-center animate-in fade-in zoom-in duration-300">
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute top-8 right-8 p-3 bg-white/10 rounded-full text-white"
          >
            <CloseIcon size={24} />
          </button>

          <div className="w-full max-w-sm space-y-10">
            {/* Mobile Search Input in Overlay */}
            <div className="w-full relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#c49b63] transition-colors" size={24} />
              <input 
                type="text" 
                placeholder="Search archive..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-16 pr-8 py-6 bg-white/5 border-2 border-white/10 rounded-3xl text-xl font-medium text-white placeholder:text-white/20 focus:border-[#c49b63]/50 outline-none transition-all"
              />
              
              {/* Search results in mobile overlay */}
              {debouncedQuery.length > 2 && (
                <div className="mt-4 bg-white rounded-3xl overflow-hidden shadow-2xl max-h-[300px] overflow-y-auto">
                   {(subjectResults.length > 0 || noteResults.length > 0) ? (
                    <div className="flex flex-col py-2">
                       {subjectResults.map(sub => (
                        <div 
                          key={sub.id} 
                          className="px-6 py-4 hover:bg-slate-50 border-b border-slate-50 last:border-none"
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            setSearchQuery('');
                            onSelectSubject?.(sub.id);
                          }}
                        >
                          <div className="text-sm font-bold text-[#002147]">{sub.name}</div>
                          <div className="text-[10px] text-[#c49b63] mt-1 uppercase font-black tracking-widest">{sub.faculty} Faculty</div>
                        </div>
                      ))}
                    </div>
                   ) : (
                    <div className="p-8 text-center text-slate-400 text-xs">No matches found</div>
                   )}
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-4">
              <div onClick={() => { onNavigateHome?.(); setIsMobileMenuOpen(false); }} className="text-4xl font-serif font-black text-[#c49b63] tracking-tighter cursor-pointer">
                Athenaeum
              </div>
              <div className="h-1 w-12 bg-[#c49b63]"></div>
            </div>

            <nav className="flex flex-col items-center space-y-8 text-xl font-bold tracking-[0.1em] text-white/80 uppercase">
              <NavLink label="Home" onClick={onNavigateHome} />
              
              <div className="flex flex-col items-center">
                <div 
                  onClick={() => setIsMobileFacultiesOpen(!isMobileFacultiesOpen)}
                  className="flex items-center gap-3 text-white"
                >
                  Faculties <ChevronDown size={20} className={`transition-transform ${isMobileFacultiesOpen ? 'rotate-180' : ''}`} />
                </div>
                {isMobileFacultiesOpen && (
                  <div className="flex flex-col items-center gap-4 mt-6 text-sm font-medium text-white/50 lowercase tracking-[0.2em] animate-in slide-in-from-top-4">
                    <span onClick={() => { onNavigateSemesters?.(); setIsMobileMenuOpen(false); }}>BCA</span>
                    <span onClick={() => { onNavigateSemesters?.(); setIsMobileMenuOpen(false); }}>BSW</span>
                    <span onClick={() => { onNavigateSemesters?.(); setIsMobileMenuOpen(false); }}>BBS</span>
                    <span onClick={() => { onNavigateSemesters?.(); setIsMobileMenuOpen(false); }}>BICTE</span>
                  </div>
                )}
              </div>

              <NavLink label="Semesters" onClick={onNavigateSemesters} />
              <NavLink label="Library" onClick={onNavigateLibrary} />
              <NavLink label="Resources" onClick={onNavigateResources} />
              
              <button 
                onClick={() => { onNavigateContribute?.(); setIsMobileMenuOpen(false); }}
                className="w-full bg-[#c49b63] py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] text-[#002147] shadow-2xl"
              >
                Upload Notes
              </button>

              {!user && (
                <button 
                  onClick={() => { onLoginClick?.(); setIsMobileMenuOpen(false); }}
                  className="text-sm font-black text-white/40 tracking-[0.4em] uppercase"
                >
                  Portal Login
                </button>
              )}
            </nav>
          </div>
        </div>
      )}
      {/* Inline Mobile Search - When toggled from header */}
      {mobileSearchOpen && !isMobileMenuOpen && (
        <div className="md:hidden w-full bg-white border-b border-slate-100 p-4 animate-in slide-in-from-top-full duration-300">
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#c49b63] transition-colors" size={18} />
              <input 
                type="text" 
                autoFocus
                placeholder="Search archive..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-[#002147] placeholder:text-slate-300 focus:outline-none focus:border-[#c49b63] transition-all"
              />
              <button 
                onClick={() => {setSearchQuery(''); setMobileSearchOpen(false)}}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300"
              >
                <CloseIcon size={16} />
              </button>
            </div>
            
            {/* Inline search results */}
            {debouncedQuery.length > 2 && (
              <div className="mt-3 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-[300px] overflow-y-auto">
                 {(subjectResults.length > 0 || noteResults.length > 0) ? (
                   <div className="flex flex-col py-2">
                      {subjectResults.map(sub => (
                        <div 
                          key={sub.id} 
                          className="px-5 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-none"
                          onClick={() => {
                            setMobileSearchOpen(false);
                            setSearchQuery('');
                            onSelectSubject?.(sub.id);
                          }}
                        >
                          <div className="text-xs font-bold text-[#002147]">{sub.name}</div>
                          <div className="text-[9px] text-[#c49b63] mt-0.5 uppercase font-medium">{sub.faculty}</div>
                        </div>
                      ))}
                   </div>
                 ) : (
                   <div className="p-6 text-center text-slate-400 text-xs">No matches found</div>
                 )}
              </div>
            )}
        </div>
      )}
    </header>
  );
}
