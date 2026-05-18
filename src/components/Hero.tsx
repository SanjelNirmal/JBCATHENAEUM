// Copyright by nirmal sanjel | hackingwithnirmal@gmail.com | +977 9848744321
import { ArrowRight, SlidersHorizontal } from "lucide-react";
import { Subject } from "../lib/api";
import { motion } from "motion/react";

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
    <div className="relative w-full overflow-hidden bg-[#001021]">
      {/* Background with deepened contrast for high readability */}
      <div className="w-full h-[650px] md:h-[850px] relative overflow-hidden">
        <motion.img 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1.05, opacity: 0.5 }}
          transition={{ duration: 2, ease: "easeOut" }}
          src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=2282&auto=format&fit=crop" 
          alt="Premium Library" 
          className="w-full h-full object-cover"
        />
        
        {/* Multilayered cinematic overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#001021] via-[#001021]/80 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#001021] via-transparent to-[#001021]/60"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(196,155,99,0.15),transparent_70%)]"></div>
        
        {/* Decorative elements for depth */}
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.4, 0.6, 0.4]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 -left-20 w-[600px] h-[600px] bg-[#c49b63]/10 blur-[140px] rounded-full"
        ></motion.div>
        <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-blue-500/10 blur-[120px] rounded-full"></div>
      </div>

      {/* Content Overlay - Centered and High Contrast */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 absolute inset-0 pt-32 md:pt-48 flex flex-col items-center text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-white/90 text-[10px] sm:text-[11px] uppercase tracking-[0.5em] font-black mb-10 backdrop-blur-md shadow-2xl"
        >
          <span className="w-2 h-2 rounded-full bg-[#c49b63] shadow-[0_0_15px_#c49b63]"></span>
          Jana Bhawana Digital Repository
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-5xl sm:text-7xl md:text-8xl lg:text-[10rem] font-serif text-white mb-8 leading-[0.85] tracking-tighter drop-shadow-[0_15px_45px_rgba(0,0,0,0.9)]"
        >
          Excel in <span className="text-[#c49b63] italic">Academia.</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="text-white/80 text-base md:text-2xl mb-16 font-light leading-relaxed max-w-5xl mx-auto drop-shadow-lg"
        >
          The elite archive for curated academic resources, 
          precision-built for the discerning scholars of Jana Bhawana Campus.
        </motion.p>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto px-4 sm:px-0"
        >
          <button 
            onClick={() => onNavigateResources?.()}
            className="group relative flex items-center justify-center gap-5 bg-[#c49b63] hover:bg-[#b58c55] text-white px-12 py-7 rounded-2xl text-[11px] font-black uppercase tracking-[0.4em] transition-all duration-500 shadow-[0_20px_50px_rgba(196,155,99,0.3)] hover:-translate-y-1.5 hover:shadow-[0_30px_70px_rgba(196,155,99,0.5)] overflow-hidden w-full sm:w-auto"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            <span className="relative z-10">Access Repository</span>
            <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1.5 transition-transform duration-500" />
          </button>

          <button 
            onClick={() => onNavigateSemesters?.()}
            className="group flex items-center justify-center gap-5 bg-white/5 hover:bg-white/10 backdrop-blur-xl border-2 border-white/10 hover:border-[#c49b63]/50 text-white px-12 py-7 rounded-2xl text-[11px] font-black uppercase tracking-[0.4em] transition-all duration-500 hover:-translate-y-1.5 shadow-xl hover:shadow-[#c49b63]/5 w-full sm:w-auto"
          >
            <span>Course Structure</span>
            <SlidersHorizontal size={20} className="text-[#c49b63] group-hover:rotate-90 transition-transform duration-700 ease-in-out" />
          </button>
        </motion.div>
      </div>
      
      {/* Scroll indicator for premium feel */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
      >
        <div className="w-px h-12 bg-gradient-to-b from-[#c49b63] to-transparent"></div>
      </motion.div>
    </div>
  );
}
