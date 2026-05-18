import { ArrowRight, Search, SlidersHorizontal, ChevronDown } from "lucide-react";
import { useState } from "react";

export function Hero({ onNavigateResources }: { onNavigateResources?: () => void }) {
  const [searchFocused, setSearchFocused] = useState(false);

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
          <div className={`flex flex-col gap-4 p-2 bg-white/10 backdrop-blur-md rounded-2xl border transition-all pointer-events-auto ${searchFocused ? 'border-white/40 ring-4 ring-white/10' : 'border-white/20'}`}>
            <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-2 shadow-inner">
              <Search className="text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="Search by subject, semester, teacher, or keyword..." 
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="flex-1 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none font-medium"
              />
              <button 
                onClick={onNavigateResources}
                className="hidden md:flex items-center gap-2 bg-[#002147] text-white px-6 py-2.5 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-[#001b3a] transition-all"
              >
                Find Notes
              </button>
            </div>
            
            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-3 px-2 pb-1">
              <span className="text-[10px] text-white/60 uppercase tracking-[0.2em] font-bold mr-2">Quick Filters:</span>
              <button className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-[10px] text-white font-bold uppercase transition-all tracking-wider">
                BCA <ChevronDown size={10} />
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-[10px] text-white font-bold uppercase transition-all tracking-wider">
                Semester-wise <ChevronDown size={10} />
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-[10px] text-white font-bold uppercase transition-all tracking-wider">
                Past Questions <ChevronDown size={10} />
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1 bg-[#c49b63] hover:bg-[#b38a52] rounded-full text-[10px] text-white font-bold uppercase transition-all tracking-wider ml-auto">
                <SlidersHorizontal size={10} /> Advanced
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
