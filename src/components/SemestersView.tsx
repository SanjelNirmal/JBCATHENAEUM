import { Subject } from "../lib/api";

export function SemestersView({ onSelectSubject, subjects }: { onSelectSubject: (id: string) => void, subjects: Subject[] }) {
  // Group by faculty, then by semester
  const grouped = subjects.reduce((acc, sub) => {
    if (!acc[sub.faculty]) acc[sub.faculty] = {};
    if (!acc[sub.faculty][sub.semester]) acc[sub.faculty][sub.semester] = [];
    acc[sub.faculty][sub.semester].push(sub);
    return acc;
  }, {} as Record<string, Record<string, Subject[]>>);

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 md:px-12 w-full">
      <div className="mb-12 border-b border-slate-200 pb-6 text-center">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#002147] mb-4">Course Structure</h1>
        <p className="text-slate-500 max-w-2xl mx-auto">Explore all subjects organized by faculty and semester.</p>
      </div>

      <div className="space-y-16">
        {Object.entries(grouped).map(([faculty, semesters]) => (
          <div key={faculty}>
            <h2 className="text-2xl font-serif font-bold text-[#002147] mb-6 flex items-center">
              <span className="w-8 h-8 rounded bg-[#c49b63] text-white flex items-center justify-center mr-3 text-sm">{faculty[0]}</span>
              {faculty} Faculty
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(semesters).sort(([a], [b]) => a.localeCompare(b)).map(([semester, subjects]) => (
                <div key={semester} className="bg-white border border-slate-200 rounded p-6 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 pb-2 border-b border-slate-100">{semester}</h3>
                  <ul className="space-y-2">
                    {subjects.map(sub => (
                      <li 
                        key={sub.id} 
                        className="group flex items-center justify-between cursor-pointer p-2 -mx-2 hover:bg-slate-50 rounded transition-colors"
                        onClick={() => onSelectSubject(sub.id)}
                      >
                        <span className="font-medium text-slate-700 group-hover:text-[#002147]">{sub.name}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{sub.notes.length} notes</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
