// Copyright by nirmal sanjel
import { FileText, Download, Search } from "lucide-react";
import { Subject } from "../lib/api";
import { useState } from "react";

export function ResourcesView({ onSelectSubject, subjects }: { onSelectSubject: (id: string) => void, subjects: Subject[] }) {
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
    <div className="py-12 max-w-7xl mx-auto px-4 md:px-12 w-full">
      <div className="mb-12 border-b border-slate-200 pb-12 flex flex-col items-center">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#002147] mb-4 text-center">All Resources</h1>
        <p className="text-slate-500 max-w-2xl mx-auto text-center mb-8">Browse the latest uploaded notes and study materials across all disciplines.</p>
        
        <div className="w-full max-w-xl relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search all notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-xl focus:border-[#c49b63] outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allNotes.map(note => (
          <div 
            key={note.id} 
            className="bg-white border border-slate-200 rounded p-5 flex flex-col hover:border-[#c49b63] transition-colors cursor-pointer group shadow-sm"
            onClick={() => onSelectSubject(note.subjectId)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 bg-slate-50 rounded text-[#002147] group-hover:bg-[#002147] group-hover:text-white transition-colors">
                <FileText size={20} />
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium tracking-wide">
                {note.faculty} &bull; {note.semester}
              </span>
            </div>
            
            <h3 className="font-bold text-slate-800 mb-1 group-hover:text-[#002147] transition-colors line-clamp-2">{note.title}</h3>
            <p className="text-xs text-[#c49b63] font-medium mb-4">{note.subjectName}</p>
            
            <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>By {note.author}</span>
              <span className="flex items-center space-x-1">
                <span>{note.size}</span>
              </span>
            </div>
          </div>
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
