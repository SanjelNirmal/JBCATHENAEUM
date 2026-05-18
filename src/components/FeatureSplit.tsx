// Copyright by nirmal sanjel
import { ArrowRight } from "lucide-react";

export function FeatureSplit({ onNavigateViewer }: { onNavigateViewer?: () => void }) {
  return (
    <section className="px-4 md:px-12 py-12 md:py-32">
      <div className="max-w-7xl mx-auto">
        <div className="relative w-full min-h-[650px] md:h-[750px] overflow-hidden flex flex-col md:flex-row bg-[#001b3a] rounded-[3rem] md:rounded-[4rem] shadow-[0_40px_1000px_-20px_rgba(0,0,0,0.35)] group">
          
          {/* Decorative Orbs for Atmospheric Depth */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#c49b63]/10 rounded-full blur-[120px] -ml-40 -mt-40 group-hover:bg-[#c49b63]/20 transition-all duration-1000"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] -mr-40 -mb-40"></div>

          {/* Left Column: Visual Impact with Rounded Frame */}
          <div className="w-full md:w-1/2 h-[400px] md:h-full relative overflow-hidden order-2 md:order-1">
            <div className="absolute inset-0 md:inset-10 overflow-hidden rounded-none md:rounded-[3rem] shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=2000&auto=format&fit=crop" 
                alt="Curriculum Study Materials" 
                className="absolute inset-0 w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-[3s] ease-out opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#001b3a]/90 via-transparent to-transparent"></div>
              
              {/* Floating Badge */}
              <div className="absolute bottom-10 left-10 p-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 hidden md:block">
                 <div className="text-[10px] font-black text-[#c49b63] uppercase tracking-[0.4em] mb-2">Authenticated</div>
                 <div className="text-white font-serif text-xl italic drop-shadow-md">Primary Academic Resource</div>
              </div>
            </div>
          </div>

          {/* Right Column: Narrative & Action */}
          <div className="w-full md:w-1/2 flex flex-col justify-center p-10 md:p-16 lg:p-24 relative z-10 order-1 md:order-2 text-center md:text-left">
            <div className="mb-10">
              <div className="inline-flex items-center gap-3 mb-8 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                 <span className="w-2 h-2 rounded-full bg-[#c49b63] shadow-[0_0_15px_rgba(196,155,99,0.8)] animate-pulse"></span>
                 <span className="text-[10px] font-black text-[#c49b63] uppercase tracking-[0.4em]">Scholarly Standard</span>
              </div>
              
              <h2 className="text-5xl sm:text-7xl lg:text-[8rem] font-serif text-white mb-8 leading-[0.85] tracking-tighter drop-shadow-2xl">
                Built <span className="font-light italic text-[#c49b63]">for</span> <br/>
                <span className="italic block mt-2">Intellect.</span>
              </h2>
              
              <div className="h-1 shadow-2xl w-20 bg-[#c49b63] mb-12 mx-auto md:mx-0"></div>
              
              <p className="text-white/70 text-lg sm:text-xl font-light leading-relaxed max-w-lg mb-14 italic mx-auto md:mx-0">
                Our archives are not merely storage; they are a high-fidelity knowledge network calibrated for the academic rigor of Jana Bhawana Campus.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center md:items-start gap-8">
              <button 
                onClick={onNavigateViewer} 
                className="group relative flex items-center justify-between gap-12 bg-transparent border-2 border-[#c49b63]/40 text-[#c49b63] hover:text-[#001b3a] px-12 py-7 uppercase tracking-[0.35em] text-[11px] font-black transition-all duration-700 rounded-2xl overflow-hidden shadow-2xl hover:shadow-[#c49b63]/30 hover:-translate-y-1 w-full sm:w-auto"
              >
                <div className="absolute inset-0 bg-[#c49b63] -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                <span className="relative z-10">Enter Repository</span>
                <div className="relative z-10 p-2 bg-[#c49b63]/10 rounded-xl group-hover:bg-[#001b3a]/10 transition-colors">
                  <ArrowRight size={20} strokeWidth={3} className="group-hover:translate-x-2 transition-transform duration-500" />
                </div>
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
