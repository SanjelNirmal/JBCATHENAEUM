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
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#002147] mb-4">EduPilot Workspace Comming Soon.</h1>
        
      </div>
    </div>
  );
}
