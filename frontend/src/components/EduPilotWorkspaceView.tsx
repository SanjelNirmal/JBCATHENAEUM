import { CalendarDays, CheckCircle2, Database, Layers3, Sparkles } from "lucide-react";

type Property = { name: string; type: string; notes?: string };

type DatabasePlan = {
  title: string;
  purpose: string;
  properties: Property[];
  views: string[];
};

const databases: DatabasePlan[] = [
  {
    title: "Subjects / Courses",
    purpose: "Backbone relation hub for all archive and study entities.",
    properties: [
      { name: "Subject Name", type: "Title" },
      { name: "Course Code", type: "Text" },
      { name: "Semester / Year", type: "Select" },
      { name: "Instructor", type: "Text", notes: "Optional" },
      { name: "Credit Hours", type: "Number", notes: "Optional" },
      { name: "Priority", type: "Select" },
      { name: "Exam Date", type: "Date" },
      { name: "Status", type: "Status" },
    ],
    views: ["Board by Semester", "Table by Priority", "Calendar by Exam Date"],
  },
  {
    title: "Resource Archive",
    purpose: "Central JBC Athenaeum store for notes, past questions, and research.",
    properties: [
      { name: "Title", type: "Title" },
      { name: "Subject", type: "Relation → Subjects" },
      { name: "Resource Type", type: "Select" },
      { name: "Semester / Year", type: "Select" },
      { name: "File / Link", type: "Files & media + URL" },
      { name: "Source", type: "Text" },
      { name: "Tags", type: "Multi-select" },
      { name: "Date Added", type: "Created time" },
    ],
    views: ["Gallery by Resource Type", "Table by Semester", "Board by Subject", "Past Questions only"],
  },
  {
    title: "Revision Notes",
    purpose: "Exam-focused summary notes linked back to source resources.",
    properties: [
      { name: "Note Title", type: "Title" },
      { name: "Subject", type: "Relation → Subjects" },
      { name: "Source Resource", type: "Relation → Resource Archive", notes: "Optional" },
      { name: "Exam Importance", type: "Select" },
      { name: "Status", type: "Status" },
      { name: "Last Reviewed", type: "Date" },
    ],
    views: ["To write queue", "Drafted notes", "Revised notes"],
  },
  {
    title: "Flashcards",
    purpose: "Quick recall deck for spaced repetition and confidence tracking.",
    properties: [
      { name: "Question (Front)", type: "Title" },
      { name: "Answer (Back)", type: "Text" },
      { name: "Subject", type: "Relation → Subjects" },
      { name: "Topic", type: "Multi-select" },
      { name: "Confidence", type: "Select" },
      { name: "Last Reviewed", type: "Date" },
      { name: "Next Review", type: "Date" },
    ],
    views: ["Gallery cards", "Weak cards filter", "Board by Subject"],
  },
  {
    title: "Quiz / MCQ Bank",
    purpose: "Exam-level objective question bank with explanations.",
    properties: [
      { name: "Question", type: "Title" },
      { name: "Subject", type: "Relation → Subjects" },
      { name: "Option A-D", type: "Text (4 props)" },
      { name: "Correct Answer", type: "Select" },
      { name: "Difficulty", type: "Select" },
      { name: "Explanation", type: "Text" },
      { name: "Topic", type: "Multi-select" },
    ],
    views: ["Table by Subject", "Difficulty filters", "Quiz mode"],
  },
  {
    title: "Study Plan & Sessions",
    purpose: "Revision scheduler for daily sessions and exam readiness.",
    properties: [
      { name: "Session", type: "Title" },
      { name: "Subject", type: "Relation → Subjects" },
      { name: "Date", type: "Date" },
      { name: "Duration", type: "Number", notes: "Duration in minutes" },
      { name: "Type", type: "Select" },
      { name: "Priority", type: "Select" },
      { name: "Status", type: "Status" },
    ],
    views: ["Calendar planner", "Today / This Week", "Board by Status"],
  },
];

const starterItems = [
  "Connect all relations to the Subjects database",
  "Add rollups for note/card/quiz counts and nearest exam date",
  "Add 2–3 sample subjects to populate all linked views",
  "Create EduPilot revision-note page template",
  "Create one sample final-exam revision plan",
  "Add a short 'How to use EduPilot' guide in Home",
];

export function EduPilotWorkspaceView() {
  return (
    <div className="py-12 max-w-6xl mx-auto px-4 md:px-12 w-full font-sans min-h-[60vh]">
      <div className="mb-8 border-b border-slate-200 pb-6">
        <p className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] font-black text-[#c49b63] mb-4">
          <Sparkles size={14} /> EduPilot Layer
        </p>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#002147] mb-4">EduPilot Workspace Blueprint</h1>
        <p className="text-slate-600 max-w-4xl">
          A connected implementation plan combining the JBC Athenaeum archive with exam-focused study tooling, all linked by a shared Subjects database.
        </p>
      </div>

      <section className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 mb-8">
        <h2 className="text-2xl font-serif font-bold text-[#002147] mb-4 flex items-center gap-2">
          <Layers3 size={20} className="text-[#c49b63]" /> EduPilot Home Dashboard
        </h2>
        <ul className="space-y-2 text-sm text-slate-700 list-disc pl-5">
          <li>Mission callout and quick-use instructions</li>
          <li>Exam countdown block tied to upcoming exam dates</li>
          <li>Quick links to each database layer</li>
          <li>Linked views: Due this week, Cards to review, Recently added notes</li>
          <li>Compact revision tips section for rapid review sessions</li>
        </ul>
      </section>

      <section className="space-y-6">
        {databases.map((database) => (
          <article key={database.title} className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8">
            <h3 className="text-2xl font-serif font-bold text-[#002147] mb-2 flex items-center gap-2">
              <Database size={18} className="text-[#c49b63]" /> {database.title}
            </h3>
            <p className="text-slate-600 text-sm mb-5">{database.purpose}</p>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left">
                  <tr>
                    <th className="p-3 font-bold text-[#002147]">Property</th>
                    <th className="p-3 font-bold text-[#002147]">Type</th>
                    <th className="p-3 font-bold text-[#002147]">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {database.properties.map((property) => (
                    <tr key={`${database.title}-${property.name}`} className="border-t border-slate-100">
                      <td className="p-3 text-slate-700">{property.name}</td>
                      <td className="p-3 text-slate-700">{property.type}</td>
                      <td className="p-3 text-slate-500">{property.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5">
              <h4 className="text-xs uppercase tracking-[0.2em] font-black text-slate-400 mb-3">Views</h4>
              <div className="flex flex-wrap gap-2">
                {database.views.map((view) => (
                  <span key={`${database.title}-${view}`} className="text-xs bg-[#002147]/5 text-[#002147] px-3 py-1 rounded-full border border-[#002147]/10">
                    {view}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-8 bg-[#002147] text-white rounded-2xl p-6 md:p-8">
        <h2 className="text-2xl font-serif font-bold mb-4 flex items-center gap-2">
          <CalendarDays size={20} className="text-[#c49b63]" /> Final Wiring & Starter Content
        </h2>
        <ul className="space-y-3 text-sm">
          {starterItems.map((item) => (
            <li key={item} className="flex gap-2 items-start">
              <CheckCircle2 size={16} className="text-[#c49b63] mt-0.5 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
