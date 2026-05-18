// Copyright by nirmal sanjel
import { ArrowRight, Search, SlidersHorizontal, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Subject } from "../lib/api";

export function Hero({ 
  onNavigateResources, 
  onSelectSubject,
  onNavigateSemesters,
  subjects = [],
  resources = []
}: { 
  onNavigateResources?: () => void,
  onSelectSubject?: (id: string) => void,
  onNavigateSemesters?: () => void,
  subjects?: Subject[],
  resources?: any[]
}) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const subjectResults = debouncedQuery.length > 2 
    ? subjects.filter(sub => 
        sub.name.toLowerCase().includes(debouncedQuery.toLowerCase()) || 
        sub.faculty.toLowerCase().includes(debouncedQuery.toLowerCase())
      ).slice(0, 4)
    : [];

  const noteResults = debouncedQuery.length > 2
    ? resources.filter(res => 
        res.title.toLowerCase().includes(debouncedQuery.toLowerCase())
      ).slice(0, 4)
    : [];

  const showDropdown = searchFocused && debouncedQuery.length > 2;

  return (
    <div className="relative w-full mb-32 md:mb-40">
      {/* Background Image Placeholder */}
      <div className="w-full h-[500px] md:h-[640px] bg-slate-300 relative overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2190&auto=format&fit=crop" 
          alt="Classic Library Architecture" 
          className="w-full h-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-[#001b3a]/30 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-50"></div>
      </div>

      {/* Alignment Container */}
      <div className="max-w-7xl mx-auto px-4 md:px-12 absolute inset-0 pt-20 md:pt-32">
        
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 leading-tight drop-shadow-sm">
            Jana Bhawana <br/>
            <span className="text-[#c49b63]">ATHENAEUM</span>
          </h1>
          <p className="text-white/80 text-xl md:text-2xl mb-12 font-light leading-relaxed max-w-2xl">
            The definitive digital hub for Jana Bhawana Campus scholars. Access thousands of verified notes and past examination papers.
          </p>

          {/* Search Box */}
          <div ref={dropdownRef} className={`relative flex flex-col gap-4 p-2 bg-white/10 backdrop-blur-md rounded-2xl border transition-all pointer-events-auto ${searchFocused ? 'border-white/40 ring-4 ring-white/10' : 'border-white/20'}`}>
            <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-2 shadow-inner">
              <Search className="text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="Search by subject, semester, teacher, or keyword..." 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                className="flex-1 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none font-medium"
              />
              <button 
                onClick={() => {
                  if (query.trim()) {
                    onNavigateResources?.();
                  }
                }}
                className="hidden md:flex items-center gap-2 bg-[#002147] text-white px-6 py-2.5 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-[#001b3a] transition-all"
              >
                Find Notes
              </button>
            </div>

            {/* Hero Auto-suggestions Dropdown */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                {(subjectResults.length > 0 || noteResults.length > 0) ? (
                  <div className="flex flex-col">
                    {subjectResults.length > 0 && (
                      <div className="p-2">
                        <div className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Suggested Subjects</div>
                        {subjectResults.map(sub => (
                          <button 
                            key={sub.id}
                            onClick={() => {
                              onSelectSubject?.(sub.id);
                              setSearchFocused(false);
                              setQuery("");
                            }}
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors rounded-xl text-left"
                          >
                            <div>
                              <div className="font-bold text-[#002147]">{sub.name}</div>
                              <div className="text-xs text-slate-500 uppercase tracking-wider">{sub.faculty} &bull; {sub.semester}</div>
                            </div>
                            <ChevronDown size={14} className="-rotate-90 text-slate-200" />
                          </button>
                        ))}
                      </div>
                    )}
                    {noteResults.length > 0 && (
                      <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                        <div className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Matching Documents</div>
                        {noteResults.map(note => (
                          <button 
                            key={note.id}
                            onClick={() => {
                              onSelectSubject?.(note.subject);
                              setSearchFocused(false);
                              setQuery("");
                            }}
                            className="w-full flex flex-col p-4 hover:bg-white transition-colors rounded-xl text-left border border-transparent hover:border-slate-200"
                          >
                            <div className="font-medium text-[#002147] truncate">{note.title}</div>
                            <div className="text-[10px] text-slate-400 uppercase font-light mt-1">{note.faculty} &bull; {note.semester}</div>
                          </button>
                        ))}
                      </div>
                    )}
                    <button 
                      onClick={() => { 
                        setSearchFocused(false); 
                        onNavigateResources?.(); 
                      }}
                      className="p-4 bg-[#002147] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#001b3a] transition-colors text-center"
                    >
                      See all results for "{debouncedQuery}"
                    </button>
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <Search size={48} className="mx-auto text-slate-100 mb-4" />
                    <p className="text-slate-500 font-medium">No results found for "{debouncedQuery}"</p>
                    <p className="text-xs text-slate-400 mt-2">Try searching for a broad term like "English" or "BCA"</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-3 px-2 pb-1">
              <span className="text-[10px] text-white/60 uppercase tracking-[0.2em] font-bold mr-2">Quick Filters:</span>
              <button 
                onClick={() => { setQuery("BCA"); setSearchFocused(true); }}
                className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-[10px] text-white font-bold uppercase transition-all tracking-wider"
              >
                BCA <ChevronDown size={10} />
              </button>
              <button 
                onClick={() => onNavigateSemesters?.()}
                className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-[10px] text-white font-bold uppercase transition-all tracking-wider"
              >
                Semester-wise <ChevronDown size={10} />
              </button>
              <button 
                onClick={() => { setQuery("Past Question"); setSearchFocused(true); }}
                className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-[10px] text-white font-bold uppercase transition-all tracking-wider"
              >
                Past Questions <ChevronDown size={10} />
              </button>
              <button 
                onClick={() => onNavigateResources?.()}
                className="flex items-center gap-1.5 px-3 py-1 bg-[#c49b63] hover:bg-[#b38a52] rounded-full text-[10px] text-white font-bold uppercase transition-all tracking-wider ml-auto"
              >
                <SlidersHorizontal size={10} /> Advanced
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
