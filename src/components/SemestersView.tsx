// Copyright by nirmal sanjel
import { Subject } from "../lib/api";
import { motion } from "motion/react";

export function SemestersView({ onSelectSubject, subjects }: { onSelectSubject: (id: string) => void, subjects: Subject[] }) {
  // Group by faculty, then by semester
  const grouped = subjects.reduce((acc, sub) => {
    if (!acc[sub.faculty]) acc[sub.faculty] = {};
    if (!acc[sub.faculty][sub.semester]) acc[sub.faculty][sub.semester] = [];
    acc[sub.faculty][sub.semester].push(sub);
    return acc;
  }, {} as Record<string, Record<string, Subject[]>>);

  return (
    <div className="py-24 max-w-7xl mx-auto px-6 md:px-12 w-full animate-in fade-in duration-700">
      <div className="mb-20 text-center">
        <div className="inline-block px-3 py-1 bg-[#c49b63]/10 text-[#c49b63] text-[10px] font-black uppercase tracking-[0.35em] rounded-full mb-6">
          Systematic Inventory
        </div>
        <h1 className="text-5xl md:text-7xl font-serif font-black text-[#002147] mb-6 tracking-tighter">Academic Index</h1>
        <p className="text-slate-500 max-w-2xl mx-auto text-lg md:text-xl font-light">Explore a comprehensively structured knowledge base, mapped to your specific degree track.</p>
      </div>

      <div className="space-y-24">
        {Object.entries(grouped).map(([faculty, semesters], fIndex) => (
          <motion.div 
            key={faculty}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: fIndex * 0.1 }}
          >
            <div className="flex flex-col md:flex-row items-center gap-6 mb-12">
               <div className="h-px flex-1 bg-slate-100 hidden md:block"></div>
               <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#002147] flex items-center shrink-0 flex-col md:flex-row text-center md:text-left">
                <span className="w-12 h-12 rounded-2xl bg-[#002147] text-white flex items-center justify-center md:mr-5 mb-4 md:mb-0 text-lg font-black shadow-lg shadow-[#002147]/20">{faculty[0]}</span>
                <span>{faculty} <span className="ml-1 md:ml-3 font-light text-slate-400">Archives</span></span>
              </h2>
              <div className="h-px flex-1 bg-slate-100 hidden md:block"></div>
              <div className="h-px w-full bg-slate-100 md:hidden"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {Object.entries(semesters).sort(([a], [b]) => a.localeCompare(b)).map(([semester, subjects], sIndex) => (
                <div key={semester} className="relative group">
                  <div className="absolute inset-0 bg-[#c49b63] opacity-0 group-hover:opacity-5 rounded-[2rem] translate-y-2 translate-x-2 transition-all duration-500"></div>
                  <div className="relative bg-white border border-slate-100 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgba(196,155,99,0.1)] transition-all duration-500 hover:-translate-y-2">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#c49b63] mb-6 pb-4 border-b border-slate-50 flex justify-between items-center">
                      <span>{semester}</span>
                      <span className="bg-slate-50 px-2 py-1 rounded text-slate-400">{subjects.length} Units</span>
                    </h3>
                    <ul className="space-y-4">
                      {subjects.map(sub => (
                        <li 
                          key={sub.id} 
                          className="group/item flex items-center justify-between cursor-pointer p-4 -mx-2 hover:bg-slate-50 rounded-xl transition-all"
                          onClick={() => onSelectSubject(sub.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover/item:bg-[#002147] group-hover/item:scale-125 transition-all"></div>
                            <span className="font-bold text-slate-700 text-sm group-hover/item:text-[#002147] group-hover/item:translate-x-1 transition-all">{sub.name}</span>
                          </div>
                          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{sub.notes.length} Files</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
