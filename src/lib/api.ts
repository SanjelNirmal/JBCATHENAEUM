import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export interface Resource {
  id: string;
  title: string;
  subject: string;
  faculty: string;
  semester: string;
  author_name: string;
  author_id?: string;
  file_url: string;
  file_size: string;
  resource_type: string;
  created_at: string;
}

export interface Note {
  id: string;
  title: string;
  author: string;
  date: string;
  size: string;
  url: string;
  totalPages: number;
}

export interface Subject {
  id: string;
  faculty: string;
  semester: string;
  name: string;
  notes: Note[];
}

export async function createResource(resource: Partial<Resource>) {
  const { data, error } = await supabase
    .from('resources')
    .insert([resource])
    .select();

  if (error) {
    throw error;
  }
  return data;
}

export async function deleteResource(id: string) {
  const { error } = await supabase
    .from('resources')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }
}

export function useResourcesData() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFromSupabase() {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('resources')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }
        setResources(data as Resource[] || []);
      } catch (err: any) {
        console.error("Error fetching resources:", err);
        setError(err.message || "Failed to load resources");
      } finally {
        setLoading(false);
      }
    }

    fetchFromSupabase();
  }, []);

  const toggleMockData = () => {
    // Deprecated
  };
  
  // Transform flat resources into Subject based hierarchy
  let subjects: Subject[] = [];
  
  // Generate subjects from unique subjects found in resources
  const subjectMap: Record<string, Subject> = {};
  
  // Define base subjects to show even if empty
  const baseSubjects = [
    { name: "Programming in C", faculty: "BCA", semester: "1st Semester" },
    { name: "Data Structures & Algo", faculty: "BCA", semester: "3rd Semester" },
    { name: "Database Management", faculty: "BCA", semester: "4th Semester" },
    { name: "Web Technology", faculty: "BCA", semester: "4th Semester" },
    { name: "Software Engineering", faculty: "BCA", semester: "5th Semester" },
    { name: "System Architecture", faculty: "BCA", semester: "4th Semester" },
    { name: "Intro to Social Work", faculty: "BSW", semester: "1st Year" },
    { name: "Sociology Concepts", faculty: "BSW", semester: "2nd Year" },
    { name: "Basic Psychology", faculty: "BSW", semester: "2nd Year" },
    { name: "Community Organization", faculty: "BSW", semester: "3rd Year" },
    { name: "Field Work Practicum", faculty: "BSW", semester: "4th Year" },
    { name: "Microeconomics", faculty: "BBS", semester: "1st Year" },
    { name: "Principles of Management", faculty: "BBS", semester: "1st Year" },
    { name: "Financial Accounting", faculty: "BBS", semester: "2nd Year" },
    { name: "Business Statistics", faculty: "BBS", semester: "3rd Year" },
    { name: "Marketing Strategy", faculty: "BBS", semester: "4th Year" },
    { name: "Advanced Project", faculty: "BCA", semester: "8th Semester" },
    { name: "Information Security", faculty: "BICTE", semester: "8th Semester" },
  ];

  baseSubjects.forEach(mockSub => {
    subjectMap[mockSub.name] = {
      id: `preset-${mockSub.name.toLowerCase().replace(/\s+/g, '-')}`,
      name: mockSub.name,
      faculty: mockSub.faculty,
      semester: mockSub.semester,
      notes: [],
    };
  });

  // Populate with real notes
  resources.forEach(r => {
    if (!subjectMap[r.subject]) {
      // If subject doesn't exist in our preset, we create it dynamically
      subjectMap[r.subject] = {
        id: `dynamic-${r.subject.toLowerCase().replace(/\s+/g, '-')}`,
        faculty: r.faculty,
        semester: r.semester,
        name: r.subject,
        notes: []
      };
    }
    
    subjectMap[r.subject].notes.push({
      id: r.id,
      title: r.title,
      author: r.author_name,
      date: new Date(r.created_at).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' }),
      size: r.file_size || "Unknown",
      url: r.file_url,
      totalPages: 0,
    });
  });

  subjects = Object.values(subjectMap);

  return {
    useMockData: false,
    toggleMockData,
    loading,
    error,
    resources,
    subjects,
    getSubjectByName: (name: string) => subjects.find(s => s.name === name) || subjects[0]
  };
}