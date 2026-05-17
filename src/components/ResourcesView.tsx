import { FileText, Download } from "lucide-react";
import { Subject } from "../lib/api";

export function ResourcesView({ onSelectSubject, subjects }: { onSelectSubject: (name: string) => void, subjects: Subject[] }) {
  // Flatten all notes
  const allNotes = subjects.flatMap(sub => 
    sub.notes.map(note => ({
      ...note,
      subjectName: sub.name,
      faculty: sub.faculty,
      semester: sub.semester
    }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 md:px-12 w-full">
      <div className="mb-12 border-b border-slate-200 pb-6 text-center">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#002147] mb-4">All Resources</h1>
        <p className="text-slate-500 max-w-2xl mx-auto">Browse the latest uploaded notes and study materials across all disciplines.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allNotes.map(note => (
          <div 
            key={note.id} 
            className="bg-white border border-slate-200 rounded p-5 flex flex-col hover:border-[#c49b63] transition-colors cursor-pointer group shadow-sm"
            onClick={() => onSelectSubject(note.subjectName)}
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
