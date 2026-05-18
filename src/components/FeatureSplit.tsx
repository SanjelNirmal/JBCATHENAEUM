import { ArrowRight } from "lucide-react";

export function FeatureSplit({ onNavigateViewer }: { onNavigateViewer?: () => void }) {
  return (
    <section className="w-full flex flex-col md:flex-row shadow-sm border border-slate-200 bg-white overflow-hidden mb-24">
      {/* Left: Image */}
      <div className="w-full md:w-1/2 h-64 md:h-auto min-h-[400px] relative">
        <img 
          src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=2000&auto=format&fit=crop" 
          alt="Curriculum Study Materials" 
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Right: Content */}
      <div className="w-full md:w-1/2 p-12 md:p-24 flex flex-col justify-center">
        <h2 className="text-3xl md:text-5xl font-serif font-bold text-[#002147] mb-6">
          Explore Your Curriculum
        </h2>
        <p className="text-slate-600 text-lg font-light leading-relaxed mb-10">
          Navigate through our comprehensively structured database of academic materials. 
          Whether you're looking for introductory concepts in Social Work or advanced 
          database management systems in BCA, everything is organized semester by semester 
          for your convenience.
        </p>
        <div>
          <button onClick={onNavigateViewer} className="flex items-center space-x-3 border-2 border-[#002147] text-[#002147] hover:bg-[#002147] hover:text-white px-8 py-3.5 uppercase tracking-widest text-xs font-bold transition-all group">
            <span>Browse Directories</span>
            <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
}
