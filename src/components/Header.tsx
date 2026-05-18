import { Search, LogIn, ChevronDown, Library } from "lucide-react";
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
  subjects
}: { 
  onNavigateHome?: () => void, 
  onSelectSubject?: (subjectId: string) => void,
  onNavigateSemesters?: () => void,
  onNavigateResources?: () => void,
  onNavigateContribute?: () => void,
  onNavigateLibrary?: () => void,
  onNavigateAdmin?: () => void,
  user?: { name: string, faculty: string } | null,
  onLoginClick?: () => void,
  onLogoutClick?: () => void,
  subjects: Subject[]
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

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

  const searchResults = subjects.filter(sub => 
    sub.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    sub.faculty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header className="w-full relative font-sans flex flex-col z-50">
      {/* Top Utility Bar */}
      <div className="bg-[#001b3a] text-slate-300 text-xs px-4 md:px-12 py-2 flex justify-end items-center space-x-6 border-b border-white/10">
        
        {/* Search Bar */}
        <div className="relative" ref={searchRef}>
          <div className="flex items-center bg-white/10 rounded px-3 py-1 border border-white/5 text-slate-300 hover:text-white transition-colors group">
            <Search size={14} className="mr-2" />
            <input 
              type="text"
              placeholder="Search Notes..."
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
          {showSearch && searchQuery.length > 0 && (
            <div className="absolute top-full mt-2 right-0 w-64 bg-white shadow-xl border border-slate-200 rounded text-slate-800 z-50 max-h-80 overflow-y-auto">
              {searchResults.length > 0 ? (
                <div className="py-2">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 border-b border-slate-100 mb-1">Matching Subjects</div>
                  {searchResults.map(sub => (
                    <div 
                      key={sub.id} 
                      className="px-4 py-2 hover:bg-slate-50 cursor-pointer border-l-2 border-transparent hover:border-[#002147]"
                      onClick={() => {
                        setShowSearch(false);
                        setSearchQuery('');
                        onSelectSubject?.(sub.name);
                      }}
                    >
                      <div className="text-sm font-semibold text-[#002147]">{sub.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 uppercase">{sub.faculty} &bull; {sub.semester}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-xs text-slate-500 text-center">No subjects found matching "{searchQuery}"</div>
              )}
            </div>
          )}
        </div>

        <button onClick={onNavigateLibrary} className="hover:text-white transition-colors uppercase tracking-widest font-semibold hidden md:block">
          Library Archives
        </button>
        {user ? (
          <div className="flex items-center space-x-4">
            {user.faculty === 'Admin' && (
              <button 
                onClick={() => onNavigateHome?.()} 
                className="hover:text-white transition-colors uppercase tracking-widest font-semibold text-xs border border-[#c49b63] text-[#c49b63] px-3 py-1 rounded-sm mr-2"
                onClickCapture={(e) => {
                  e.stopPropagation();
                  onNavigateAdmin?.();
                }}
              >
                Dashboard
              </button>
            )}
            <div className="hidden md:block text-right">
              <div className="text-sm font-semibold">{user.name}</div>
              <div className="text-[10px] text-white/70 uppercase">{user.faculty} {user.faculty !== 'Admin' && 'Scholar'}</div>
            </div>
            <button onClick={onLogoutClick} className="hover:text-white/70 transition-colors uppercase tracking-widest font-semibold text-xs border border-white/20 px-3 py-1 rounded-sm">
              Logout
            </button>
          </div>
        ) : (
          <button onClick={onLoginClick} className="hover:text-white transition-colors uppercase tracking-widest font-semibold flex items-center space-x-1 group">
            <LogIn size={14} />
            <span>Login</span>
          </button>
        )}
      </div>

      {/* Main Navigation Bar */}
      <div className="bg-white border-b border-slate-200 shadow-sm relative">
        <div className="max-w-7xl mx-auto px-4 md:px-12 flex items-center justify-between h-20">
          
          {/* Logo / Brand */}
          <div className="flex items-center cursor-pointer" onClick={onNavigateHome}>
            <img src="/logo.png" alt="JBC ATHENAEUM Logo" className="w-12 h-12 object-contain mr-3" onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              e.currentTarget.parentElement!.querySelector('.fallback-icon')!.classList.remove('hidden');
            }} />
            <div className="hidden fallback-icon w-10 h-10 bg-[#002147] flex items-center justify-center mr-3">
              <Library size={20} className="text-white" strokeWidth={2} />
            </div>
            <div className="leading-tight">
              <h1 className="text-lg font-serif font-bold tracking-tight text-[#002147]">JBC ATHENAEUM</h1>
              <p className="text-[10px] uppercase tracking-tighter text-slate-400">Note Sharing Platform</p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex h-full items-center space-x-8 text-sm font-semibold tracking-wide uppercase">
            
            {/* Faculties link with Mega Menu */}
            <div className="group flex items-center h-full cursor-pointer text-[#002147] border-b-2 border-transparent hover:border-[#002147] transition-colors">
              <span className="flex items-center space-x-1 h-full pt-1">
                <span>Faculties</span>
                <ChevronDown size={16} className="mt-[-2px] group-hover:rotate-180 transition-transform duration-200 ease-out" />
              </span>

              {/* Full-width Mega Menu Dropdown */}
              <div className="absolute left-0 top-full w-full bg-[#002147] text-white opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 shadow-2xl overflow-hidden pointer-events-none group-hover:pointer-events-auto z-40 border-t border-white/10">
                <div className="max-w-7xl mx-auto px-4 md:px-12 py-12 grid grid-cols-1 md:grid-cols-4 gap-12">
                  
                  {/* Column 1: BCA */}
                  <div>
                    <h3 className="text-[#c49b63] font-serif text-lg italic mb-4 border-b border-white/10 pb-2">
                      Computer Applications (BCA)
                    </h3>
                    <ul className="space-y-2 text-sm text-slate-300 font-light">
                      <li onClick={() => onSelectSubject?.('bca-c-programming')} className="hover:text-white cursor-pointer transition-colors">Programming in C</li>
                      <li onClick={() => onSelectSubject?.('bca-dsa')} className="hover:text-white cursor-pointer transition-colors">Data Structures & Algo</li>
                      <li onClick={() => onSelectSubject?.('bca-dbms')} className="hover:text-white cursor-pointer transition-colors">Database Management</li>
                      <li onClick={() => onSelectSubject?.('bca-web-tech')} className="hover:text-white cursor-pointer transition-colors">Web Technology</li>
                      <li onClick={() => onSelectSubject?.('bca-se')} className="hover:text-white cursor-pointer transition-colors">Software Engineering</li>
                      <li onClick={onNavigateSemesters} className="hover:text-white cursor-pointer text-xs italic mt-2 opacity-50">+ View All Subjects</li>
                    </ul>
                  </div>

                  {/* Column 2: BSW */}
                  <div>
                    <h3 className="text-[#c49b63] font-serif text-lg italic mb-4 border-b border-white/10 pb-2">
                      Social Work (BSW)
                    </h3>
                    <ul className="space-y-2 text-sm text-slate-300 font-light">
                      <li onClick={() => onSelectSubject?.('bsw-intro-social-work')} className="hover:text-white cursor-pointer transition-colors">Intro to Social Work</li>
                      <li onClick={() => onSelectSubject?.('bsw-basic-sociology')} className="hover:text-white cursor-pointer transition-colors">Sociology Concepts</li>
                      <li onClick={() => onSelectSubject?.('bsw-basic-psychology')} className="hover:text-white cursor-pointer transition-colors">Basic Psychology</li>
                      <li onClick={() => onSelectSubject?.('bsw-community-development')} className="hover:text-white cursor-pointer transition-colors">Community Organization</li>
                      <li onClick={() => onSelectSubject?.('bsw-field-practicum1')} className="hover:text-white cursor-pointer transition-colors">Field Work Practicum</li>
                      <li onClick={onNavigateSemesters} className="hover:text-white cursor-pointer text-xs italic mt-2 opacity-50">+ View All Subjects</li>
                    </ul>
                  </div>

                  {/* Column 3: BBS */}
                  <div>
                    <h3 className="text-[#c49b63] font-serif text-lg italic mb-4 border-b border-white/10 pb-2">
                      Business Studies (BBS)
                    </h3>
                    <ul className="space-y-2 text-sm text-slate-300 font-light">
                      <li onClick={() => onSelectSubject?.('mgt-207')} className="hover:text-white cursor-pointer transition-colors">Microeconomics</li>
                      <li onClick={() => onSelectSubject?.('mgt-213')} className="hover:text-white cursor-pointer transition-colors">Principles of Management</li>
                      <li onClick={() => onSelectSubject?.('mgt-211')} className="hover:text-white cursor-pointer transition-colors">Financial Accounting</li>
                      <li onClick={() => onSelectSubject?.('mgt-202')} className="hover:text-white cursor-pointer transition-colors">Business Statistics</li>
                      <li onClick={() => onSelectSubject?.('mgt-214')} className="hover:text-white cursor-pointer transition-colors">Fundamentals of Marketing</li>
                      <li onClick={onNavigateSemesters} className="hover:text-white cursor-pointer text-xs italic mt-2 opacity-50">+ View All Subjects</li>
                    </ul>
                  </div>

                  {/* Column 4: BICTE */}
                  <div>
                    <h3 className="text-[#c49b63] font-serif text-lg italic mb-4 border-b border-white/10 pb-2">
                       Info & Comm Tech (BICTE)
                    </h3>
                    <ul className="space-y-2 text-sm text-slate-300 font-light">
                      <li onClick={() => onSelectSubject?.('ict-ed-416')} className="hover:text-white cursor-pointer transition-colors">Programming Concept with C</li>
                      <li onClick={() => onSelectSubject?.('ict-ed-426')} className="hover:text-white cursor-pointer transition-colors">OOP with C++</li>
                      <li onClick={() => onSelectSubject?.('ict-ed-435')} className="hover:text-white cursor-pointer transition-colors">Data Structure and Algo</li>
                      <li onClick={() => onSelectSubject?.('ict-ed-437')} className="hover:text-white cursor-pointer transition-colors">Web Technology</li>
                      <li onClick={() => onSelectSubject?.('ict-ed-446')} className="hover:text-white cursor-pointer transition-colors">Database Management System</li>
                      <li onClick={onNavigateSemesters} className="hover:text-white cursor-pointer text-xs italic mt-2 opacity-50">+ View All Subjects</li>
                    </ul>
                  </div>
                  
                </div>
              </div>
            </div>

            <div onClick={onNavigateSemesters} className="text-slate-500 hover:text-[#002147] cursor-pointer transition-colors flex items-center h-full">Semesters</div>
            <div onClick={onNavigateResources} className="text-slate-500 hover:text-[#002147] cursor-pointer transition-colors flex items-center h-full">Resources</div>
            <button onClick={onNavigateContribute} className="bg-[#c49b63] hover:bg-[#b38a52] text-white px-6 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors shadow-sm ml-4 border-none">
              Upload Notes
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
