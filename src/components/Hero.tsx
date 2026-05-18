import { ArrowRight } from "lucide-react";

export function Hero({ onNavigateResources }: { onNavigateResources?: () => void }) {
  return (
    <div className="relative w-full mb-32 md:mb-40">
      {/* Background Image Placeholder */}
      <div className="w-full h-[400px] md:h-[540px] bg-slate-300 relative">
        <img 
          src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2190&auto=format&fit=crop" 
          alt="Classic Library Architecture" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#001b3a]/20 mix-blend-multiply"></div>
      </div>

      {/* Alignment Container */}
      <div className="max-w-7xl mx-auto px-4 md:px-12 absolute inset-0 pointer-events-none">
        
        {/* Glassmorphism Content Box */}
        <div className="absolute -bottom-24 md:-bottom-32 left-4 right-4 md:left-12 md:right-auto md:w-[640px] lg:w-[720px] bg-white/75 backdrop-blur-xl border border-white/60 shadow-2xl p-8 md:p-14 pointer-events-auto">
          
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#002147] mb-6 leading-tight">
            The JBC ATHENAEUM
          </h2>
          
          <p className="text-slate-700 text-lg md:text-xl mb-10 font-light leading-relaxed">
            Gain immediate access to premium lecture notes, standardized past examination papers, and peer-reviewed study materials. Built to streamline learning for BCA, BSW, and BBS scholars.
          </p>
          
          <button onClick={onNavigateResources} className="flex items-center space-x-3 bg-[#c49b63] hover:bg-[#b38a52] text-white px-8 py-4 uppercase tracking-widest text-xs font-bold transition-all shadow-sm hover:shadow group line-clamp-none whitespace-nowrap overflow-visible">
            <span>Access Resources</span>
            <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform" />
          </button>
          
        </div>
      </div>
    </div>
  );
}
