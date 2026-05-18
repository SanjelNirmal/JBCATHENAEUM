// Copyright by nirmal sanjel | hackingwithnirmal@gmail.com | +977 9848744321
import { FileText, Download, Search } from "lucide-react";
import { Subject } from "../lib/api";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export function ResourcesView({ onSelectSubject, subjects }: { onSelectSubject: (id: string, noteId?: string) => void, subjects: Subject[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  // Flatten all notes
  const allNotes = subjects.flatMap(sub => 
    sub.notes.map(note => ({
      ...note,
      subjectName: sub.name,
      subjectId: sub.id,
      faculty: sub.faculty,
      semester: sub.semester
    }))
  ).filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.faculty.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="py-24 max-w-7xl mx-auto px-6 md:px-12 w-full animate-in fade-in duration-700">
      <div className="mb-24 text-center">
        <div className="inline-block px-3 py-1 bg-[#c49b63]/10 text-[#c49b63] text-[10px] font-black uppercase tracking-[0.3em] rounded-full mb-6">
          Global Repository
        </div>
        <h1 className="text-5xl md:text-7xl font-serif font-black text-[#002147] mb-6 tracking-tighter">Resources</h1>
        <p className="text-slate-500 max-w-2xl mx-auto text-lg md:text-xl font-light">Explore the complete catalog of peer-contributed academic artifacts, sorted for high-precision retrieval.</p>
        
        <div className="w-full max-w-3xl mx-auto relative mt-12 md:mt-16 group">
          <div className="absolute inset-0 bg-[#002147] blur-3xl opacity-0 group-focus-within:opacity-5 transition-opacity pointer-events-none"></div>
          <Search className="absolute left-5 md:left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#c49b63] transition-colors" size={22} />
          <input 
            type="text" 
            placeholder="Search within the master archive..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 md:pl-16 pr-6 md:pr-8 py-5 md:py-7 bg-white border-2 border-slate-100 rounded-2xl md:rounded-[2.5rem] text-base md:text-lg font-medium text-[#002147] placeholder:text-slate-300 focus:border-[#c49b63] outline-none transition-all shadow-[0_20px_50px_-15px_rgba(0,0,0,0.03)] focus:shadow-[0_40px_80px_-20px_rgba(196,155,99,0.15)]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
        {allNotes.map((note, index) => (
          <motion.div 
            key={note.id} 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: (index % 6) * 0.05 }}
            className="group relative cursor-pointer"
            onClick={() => onSelectSubject(note.subjectId, note.id)}
          >
            <div className="absolute inset-0 bg-[#002147] rounded-[2rem] translate-y-2 translate-x-2 opacity-0 group-hover:opacity-5 transition-all duration-500"></div>
            <div className="relative bg-white border border-slate-100 rounded-[2rem] p-8 shadow-[0_5px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_25px_60px_rgba(0,33,71,0.08)] transition-all duration-500 flex flex-col h-full hover:-translate-y-2">
              
              <div className="flex items-center justify-between mb-8">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[#002147] border border-slate-100 group-hover:bg-[#002147] group-hover:text-white group-hover:border-[#002147] transition-all duration-500">
                  <FileText size={20} />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#c49b63]">
                    {note.faculty} Branch
                  </span>
                  <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mt-1">
                    {note.semester}
                  </span>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-[#002147] mb-2 group-hover:text-[#c49b63] transition-colors duration-300 line-clamp-2 leading-tight">
                {note.title}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-8">{note.subjectName}</p>
              
              <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-black text-[#002147]">
                    {note.author.charAt(0)}
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">{note.author}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-[#c49b63] uppercase tracking-wider">
                  <Download size={12} strokeWidth={3} />
                  <span>{note.size}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {allNotes.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500">
            No resources found.
          </div>
        )}
      </div>
    </div>
  );
}
