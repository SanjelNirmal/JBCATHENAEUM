export type PriorityLevel = 'High' | 'Medium' | 'Low';
export type SubjectStatus = 'Not Started' | 'In Progress' | 'Revision' | 'Completed';

export interface EduPilotSubject {
  id: string;
  title: string;
  courseCode: string;
  semester: string;
  instructor: string;
  creditHours: number;
  priority: PriorityLevel;
  examDate: string;
  status: SubjectStatus;
}

export type ResourceType = 'Notes' | 'Past Questions' | 'Research';

export interface ResourceArchiveItem {
  id: string;
  title: string;
  subjectId: string;
  resourceType: ResourceType;
  semester: string;
  fileLink: string;
  source: string;
  tags: string[];
  dateAdded: string;
}

export type ExamImportance = 'High' | 'Medium' | 'Low';
export type RevisionStatus = 'To Write' | 'Drafted' | 'Revised';

export interface RevisionNote {
  id: string;
  title: string;
  subjectId: string;
  sourceResourceId?: string;
  examImportance: ExamImportance;
  status: RevisionStatus;
  lastReviewedDate: string;
}

export type ConfidenceLevel = 'Easy' | 'Medium' | 'Hard';

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  subjectId: string;
  topic: string;
  confidence: ConfidenceLevel;
  lastReviewed: string;
  nextReview: string;
}

export type QuizDifficulty = 'Easy' | 'Medium' | 'Hard';
export type QuizAnswer = 'A' | 'B' | 'C' | 'D';

export interface QuizQuestion {
  id: string;
  question: string;
  subjectId: string;
  options: Record<QuizAnswer, string>;
  correctAnswer: QuizAnswer;
  difficulty: QuizDifficulty;
  explanation: string;
  topic: string;
}

export type SessionType = 'Reading' | 'Practice' | 'Revision' | 'Mock Test';
export type SessionStatus = 'Planned' | 'In Progress' | 'Done';

export interface StudySession {
  id: string;
  title: string;
  subjectId: string;
  date: string;
  durationMinutes: number;
  type: SessionType;
  priority: PriorityLevel;
  status: SessionStatus;
}

export type EduPilotTab =
  | 'Dashboard'
  | 'Subjects'
  | 'Resources'
  | 'Notes'
  | 'Flashcards'
  | 'Quizzes'
  | 'Scheduler';

export interface EduPilotWorkspaceState {
  subjects: EduPilotSubject[];
  resources: ResourceArchiveItem[];
  revisionNotes: RevisionNote[];
  flashcards: Flashcard[];
  quizzes: QuizQuestion[];
  sessions: StudySession[];
}
