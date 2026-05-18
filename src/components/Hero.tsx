// Copyright by nirmal sanjel
import { ArrowRight, SlidersHorizontal } from "lucide-react";
import { Subject } from "../lib/api";

export function Hero({ 
  onNavigateResources, 
  onNavigateSemesters,
}: { 
  onNavigateResources?: () => void,
  onSelectSubject?: (id: string) => void,
  onNavigateSemesters?: () => void,
  subjects?: Subject[],
  resources?: any[]
}) {
  return (
    <div className="relative w-full overflow-hidden">
      {/* Background with deepened contrast for high readability */}
      <div className="w-full h-[600px] md:h-[800px] bg-[#001021] relative overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=2282&auto=format&fit=crop" 
          alt="Premium Library" 
          className="w-full h-full object-cover opacity-50 scale-105"
        />
        {/* Layered high-contrast gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#001b3a] via-[#001b3a]/90 to-[#001b3a]/40"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#001021] via-transparent to-[#001021]/80"></div>
        
        {/* Decorative elements for depth */}
        <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-[#c49b63]/10 blur-[140px] rounded-full animate-pulse opacity-60"></div>
        <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-blue-500/10 blur-[120px] rounded-full"></div>
      </div>

      {/* Content Overlay - Centered and High Contrast */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 absolute inset-0 pt-28 md:pt-44 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/90 text-[10px] sm:text-[11px] uppercase tracking-[0.4em] font-black mb-10 backdrop-blur-md shadow-2xl">
          <span className="w-2 h-2 rounded-full bg-[#c49b63] shadow-[0_0_15px_#c49b63]"></span>
          Jana Bhawana Digital Repository
        </div>

        <h1 className="text-5xl sm:text-7xl md:text-[8.5rem] font-serif text-white mb-8 leading-[0.85] tracking-tighter drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
          Excel in <span className="text-[#c49b63] italic">Academia.</span>
        </h1>
        
        <p className="text-white/85 text-base md:text-2xl mb-14 font-light leading-relaxed max-w-3xl mx-auto drop-shadow-lg">
          The elite archive for curated academic resources, 
          precision-built for the scholars of Jana Bhawana Campus.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-6 mt-4">
          <button 
            onClick={() => onNavigateResources?.()}
            className="group relative flex items-center justify-center gap-4 bg-[#c49b63] hover:bg-[#b38a52] text-white px-10 py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.35em] transition-all duration-500 shadow-[0_20px_50px_rgba(196,155,99,0.3)] hover:-translate-y-1 hover:shadow-[0_25px_60px_rgba(196,155,99,0.4)] overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            <span className="relative z-10">Access Repository</span>
            <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
          </button>

          <button 
            onClick={() => onNavigateSemesters?.()}
            className="group flex items-center justify-center gap-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border-2 border-white/20 hover:border-white/40 text-white px-10 py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.35em] transition-all duration-500 hover:-translate-y-1"
          >
            <span>Course Structure</span>
            <SlidersHorizontal size={18} className="text-[#c49b63] group-hover:rotate-90 transition-transform duration-500" />
          </button>
        </div>
      </div>
    </div>
  );
}
