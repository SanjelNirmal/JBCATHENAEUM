// Copyright by nirmal sanjel | hackingwithnirmal@gmail.com | +977 9848744321
import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { User } from "@supabase/supabase-js";

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

export interface UserProfile {
  id: string;
  name: string;
  faculty: string;
  role: 'scholar' | 'admin';
  created_at: string;
}

// Auth Functions
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  
  // Get profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();
    
  if (profileError) {
    if (profileError.code === 'PGRST116') {
      // Profile doesn't exist, create one
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([{ 
          id: data.user.id, 
          name: email.split('@')[0], 
          faculty: 'Unknown',
          role: 'scholar' 
        }])
        .select()
        .single();
      
      if (createError) throw createError;
      return { user: data.user, profile: newProfile };
    }
    throw profileError;
  }

  return { user: data.user, profile };
}

export async function signUp(email: string, password: string, name: string, faculty: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;

  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: data.user.id,
          name,
          faculty,
          role: 'scholar',
        },
      ]);

    if (profileError) throw profileError;
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  return { user, profile, loading };
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

export async function fetchUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    // If table doesn't exist yet, return mock users
    if (error.code === 'PGRST116' || error.message.includes('relation "profiles" does not exist')) {
      console.warn("Profiles table not found, using mock data");
      return [
        { id: '1', name: 'Nirmal Sanjel', faculty: 'Admin', role: 'admin', created_at: new Date().toISOString() },
        { id: '2', name: 'Nirmal Sanjel (BCA)', faculty: 'BCA', role: 'scholar', created_at: new Date(Date.now() - 86400000).toISOString() },
        { id: '3', name: 'Nirmal Sanjel (BBS)', faculty: 'BBS', role: 'scholar', created_at: new Date(Date.now() - 172800000).toISOString() },
      ] as UserProfile[];
    }
    throw error;
  }
  return data as UserProfile[];
}

export async function updateUserRole(id: string, role: 'scholar' | 'admin') {
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteUser(id: string) {
  // Usually we delete the profile, actual user deletion requires admin API
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export function useResourcesData() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFromSupabase = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // Handle case where table doesn't exist yet
        if (error.code === 'PGRST116' || error.message.includes('relation "resources" does not exist')) {
          console.warn("Resources table not found, using base subject structure");
          setResources([]);
          return;
        }
        throw error;
      }
      setResources(data as Resource[] || []);
    } catch (err: any) {
      console.error("Error fetching resources:", err);
      setError(err.message || "Failed to load resources");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
  {
    "id": "bca-cfa",
    "name": "Computer Fundamentals & Applications",
    "faculty": "BCA",
    "semester": "1st Semester",
    "notes": []
  },
  {
    "id": "bca-society-tech",
    "name": "Society & Technology",
    "faculty": "BCA",
    "semester": "1st Semester",
    "notes": []
  },
  {
    "id": "bca-eng1",
    "name": "English I",
    "faculty": "BCA",
    "semester": "1st Semester",
    "notes": []
  },
  {
    "id": "bca-math1",
    "name": "Mathematics I",
    "faculty": "BCA",
    "semester": "1st Semester",
    "notes": []
  },
  {
    "id": "bca-digital-logic",
    "name": "Digital Logic",
    "faculty": "BCA",
    "semester": "1st Semester",
    "notes": []
  },
  {
    "id": "bca-c-programming",
    "name": "C Programming",
    "faculty": "BCA",
    "semester": "2nd Semester",
    "notes": []
  },
  {
    "id": "bca-financial-accounting",
    "name": "Financial Accounting",
    "faculty": "BCA",
    "semester": "2nd Semester",
    "notes": []
  },
  {
    "id": "bca-eng2",
    "name": "English II",
    "faculty": "BCA",
    "semester": "2nd Semester",
    "notes": []
  },
  {
    "id": "bca-math2",
    "name": "Mathematics II",
    "faculty": "BCA",
    "semester": "2nd Semester",
    "notes": []
  },
  {
    "id": "bca-microprocessor",
    "name": "Microprocessor and Computer Architecture",
    "faculty": "BCA",
    "semester": "2nd Semester",
    "notes": []
  },
  {
    "id": "bca-dsa",
    "name": "Data Structures & Algorithms",
    "faculty": "BCA",
    "semester": "3rd Semester",
    "notes": []
  },
  {
    "id": "bca-probability",
    "name": "Probability and Statistics",
    "faculty": "BCA",
    "semester": "3rd Semester",
    "notes": []
  },
  {
    "id": "bca-sad",
    "name": "System Analysis and Design",
    "faculty": "BCA",
    "semester": "3rd Semester",
    "notes": []
  },
  {
    "id": "bca-java",
    "name": "Object-Oriented Programming in Java",
    "faculty": "BCA",
    "semester": "3rd Semester",
    "notes": []
  },
  {
    "id": "bca-web-tech",
    "name": "Web Technology",
    "faculty": "BCA",
    "semester": "3rd Semester",
    "notes": []
  },
  {
    "id": "bca-os",
    "name": "Operating Systems",
    "faculty": "BCA",
    "semester": "4th Semester",
    "notes": []
  },
  {
    "id": "bca-dbms",
    "name": "Database Management System",
    "faculty": "BCA",
    "semester": "4th Semester",
    "notes": []
  },
  {
    "id": "bca-numerical",
    "name": "Numerical Methods",
    "faculty": "BCA",
    "semester": "4th Semester",
    "notes": []
  },
  {
    "id": "bca-se",
    "name": "Software Engineering",
    "faculty": "BCA",
    "semester": "4th Semester",
    "notes": []
  },
  {
    "id": "bca-scripting",
    "name": "Scripting Language",
    "faculty": "BCA",
    "semester": "4th Semester",
    "notes": []
  },
  {
    "id": "bca-network",
    "name": "Computer Networks",
    "faculty": "BCA",
    "semester": "5th Semester",
    "notes": []
  },
  {
    "id": "bca-graphics",
    "name": "Computer Graphics & Animation",
    "faculty": "BCA",
    "semester": "5th Semester",
    "notes": []
  },
  {
    "id": "bca-mis",
    "name": "Management Information System",
    "faculty": "BCA",
    "semester": "5th Semester",
    "notes": []
  },
  {
    "id": "bca-dotnet",
    "name": "Dot Net Technology",
    "faculty": "BCA",
    "semester": "5th Semester",
    "notes": []
  },
  {
    "id": "bca-mobile",
    "name": "Mobile Application Development",
    "faculty": "BCA",
    "semester": "5th Semester",
    "notes": []
  },
  {
    "id": "bca-network-admin",
    "name": "Network Administration",
    "faculty": "BCA",
    "semester": "6th Semester",
    "notes": []
  },
  {
    "id": "bca-cyber-law",
    "name": "Cyber Law & Professional Ethics",
    "faculty": "BCA",
    "semester": "6th Semester",
    "notes": []
  },
  {
    "id": "bca-cloud",
    "name": "Cloud Computing",
    "faculty": "BCA",
    "semester": "6th Semester",
    "notes": []
  },
  {
    "id": "bca-project2",
    "name": "Project II (Minor Project)",
    "faculty": "BCA",
    "semester": "6th Semester",
    "notes": []
  },
  {
    "id": "bca-elective1",
    "name": "Elective I",
    "faculty": "BCA",
    "semester": "6th Semester",
    "notes": []
  },
  {
    "id": "bca-ai",
    "name": "Artificial Intelligence",
    "faculty": "BCA",
    "semester": "7th Semester",
    "notes": []
  },
  {
    "id": "bca-ecommerce",
    "name": "E-Commerce",
    "faculty": "BCA",
    "semester": "7th Semester",
    "notes": []
  },
  {
    "id": "bca-dwdm",
    "name": "Data Warehousing & Data Mining",
    "faculty": "BCA",
    "semester": "7th Semester",
    "notes": []
  },
  {
    "id": "bca-project3",
    "name": "Project III (Major Project)",
    "faculty": "BCA",
    "semester": "7th Semester",
    "notes": []
  },
  {
    "id": "bca-elective2",
    "name": "Elective II",
    "faculty": "BCA",
    "semester": "7th Semester",
    "notes": []
  },
  {
    "id": "bca-internship",
    "name": "Internship",
    "faculty": "BCA",
    "semester": "8th Semester",
    "notes": []
  },
  {
    "id": "bca-project4",
    "name": "Project IV (Term Paper/Seminar)",
    "faculty": "BCA",
    "semester": "8th Semester",
    "notes": []
  },
  {
    "id": "bsw-intro-social-work",
    "name": "Introduction to Social Work",
    "faculty": "BSW",
    "semester": "1st Year",
    "notes": []
  },
  {
    "id": "bsw-basic-sociology",
    "name": "Basic Sociology for Social Work",
    "faculty": "BSW",
    "semester": "1st Year",
    "notes": []
  },
  {
    "id": "bsw-academic-english",
    "name": "Academic English",
    "faculty": "BSW",
    "semester": "1st Year",
    "notes": []
  },
  {
    "id": "bsw-nepali",
    "name": "Compulsory Nepali",
    "faculty": "BSW",
    "semester": "1st Year",
    "notes": []
  },
  {
    "id": "bsw-field-practicum1",
    "name": "Social Work Field Practicum & Skills Lab",
    "faculty": "BSW",
    "semester": "1st Year",
    "notes": []
  },
  {
    "id": "bsw-basic-psychology",
    "name": "Basic Psychology for Social Work",
    "faculty": "BSW",
    "semester": "2nd Year",
    "notes": []
  },
  {
    "id": "bsw-case-work",
    "name": "Social Case Work Practice",
    "faculty": "BSW",
    "semester": "2nd Year",
    "notes": []
  },
  {
    "id": "bsw-group-work",
    "name": "Social Work Practice with Groups",
    "faculty": "BSW",
    "semester": "2nd Year",
    "notes": []
  },
  {
    "id": "bsw-fieldwork2",
    "name": "Fieldwork, Observation Visits, and Skills Lab",
    "faculty": "BSW",
    "semester": "2nd Year",
    "notes": []
  },
  {
    "id": "bsw-community-development",
    "name": "Community Organization and Development",
    "faculty": "BSW",
    "semester": "3rd Year",
    "notes": []
  },
  {
    "id": "bsw-social-policy",
    "name": "Social Policy, Welfare Administration, and Human Rights",
    "faculty": "BSW",
    "semester": "3rd Year",
    "notes": []
  },
  {
    "id": "bsw-social-action",
    "name": "Social Action and Leadership Development",
    "faculty": "BSW",
    "semester": "3rd Year",
    "notes": []
  },
  {
    "id": "bsw-rural-urban-camp",
    "name": "Rural/Urban Camp and Field Practicum",
    "faculty": "BSW",
    "semester": "3rd Year",
    "notes": []
  },
  {
    "id": "bsw-social-problems",
    "name": "Social Problems, Identification, and Interventions",
    "faculty": "BSW",
    "semester": "4th Year",
    "notes": []
  },
  {
    "id": "bsw-ideologies",
    "name": "Theoretical Ideologies of Social Work & Contemporary Issues",
    "faculty": "BSW",
    "semester": "4th Year",
    "notes": []
  },
  {
    "id": "bsw-research-writing",
    "name": "Social Work Research and Academic Writing",
    "faculty": "BSW",
    "semester": "4th Year",
    "notes": []
  },
  {
    "id": "bsw-dissertation",
    "name": "Research Dissertation/Report and Block Fieldwork Placement",
    "faculty": "BSW",
    "semester": "4th Year",
    "notes": []
  },
  {
    "id": "mgt-201",
    "name": "Business English",
    "faculty": "BBS",
    "semester": "1st Year",
    "notes": []
  },
  {
    "id": "mgt-202",
    "name": "Business Statistics",
    "faculty": "BBS",
    "semester": "1st Year",
    "notes": []
  },
  {
    "id": "mgt-207",
    "name": "Microeconomics for Business",
    "faculty": "BBS",
    "semester": "1st Year",
    "notes": []
  },
  {
    "id": "mgt-211",
    "name": "Financial Accounting and Analysis",
    "faculty": "BBS",
    "semester": "1st Year",
    "notes": []
  },
  {
    "id": "mgt-213",
    "name": "Principles of Management",
    "faculty": "BBS",
    "semester": "1st Year",
    "notes": []
  },
  {
    "id": "mgt-205",
    "name": "Business Communication",
    "faculty": "BBS",
    "semester": "2nd Year",
    "notes": []
  },
  {
    "id": "mgt-209",
    "name": "Macroeconomics for Business",
    "faculty": "BBS",
    "semester": "2nd Year",
    "notes": []
  },
  {
    "id": "mgt-212",
    "name": "Cost and Management Accounting",
    "faculty": "BBS",
    "semester": "2nd Year",
    "notes": []
  },
  {
    "id": "mgt-223",
    "name": "Organizational Behavior & Human Resource Management",
    "faculty": "BBS",
    "semester": "2nd Year",
    "notes": []
  },
  {
    "id": "mgt-215",
    "name": "Fundamentals of Financial Management",
    "faculty": "BBS",
    "semester": "2nd Year",
    "notes": []
  },
  {
    "id": "mgt-204",
    "name": "Business Law",
    "faculty": "BBS",
    "semester": "3rd Year",
    "notes": []
  },
  {
    "id": "mgt-226",
    "name": "Foundation of Financial Systems",
    "faculty": "BBS",
    "semester": "3rd Year",
    "notes": []
  },
  {
    "id": "mgt-217",
    "name": "Business Environment and Strategy",
    "faculty": "BBS",
    "semester": "3rd Year",
    "notes": []
  },
  {
    "id": "mgt-224",
    "name": "Taxation in Nepal",
    "faculty": "BBS",
    "semester": "3rd Year",
    "notes": []
  },
  {
    "id": "mgt-214",
    "name": "Fundamentals of Marketing",
    "faculty": "BBS",
    "semester": "3rd Year",
    "notes": []
  },
  {
    "id": "mgt-225",
    "name": "Entrepreneurship",
    "faculty": "BBS",
    "semester": "4th Year",
    "notes": []
  },
  {
    "id": "mgt-concentration-1",
    "name": "Concentration I",
    "faculty": "BBS",
    "semester": "4th Year",
    "notes": []
  },
  {
    "id": "mgt-concentration-2",
    "name": "Concentration II",
    "faculty": "BBS",
    "semester": "4th Year",
    "notes": []
  },
  {
    "id": "mgt-concentration-3",
    "name": "Concentration III",
    "faculty": "BBS",
    "semester": "4th Year",
    "notes": []
  },
  {
    "id": "mgt-221",
    "name": "Business Research Methods",
    "faculty": "BBS",
    "semester": "4th Year",
    "notes": []
  },
  {
    "id": "mgt-401",
    "name": "Final Project",
    "faculty": "BBS",
    "semester": "4th Year",
    "notes": []
  },
  {
    "id": "eng-ed-411",
    "name": "English Language I",
    "faculty": "BICTE",
    "semester": "1st Semester",
    "notes": []
  },
  {
    "id": "nep-ed-411",
    "name": "General Nepali I",
    "faculty": "BICTE",
    "semester": "1st Semester",
    "notes": []
  },
  {
    "id": "ed-411",
    "name": "Fundamentals of Education",
    "faculty": "BICTE",
    "semester": "1st Semester",
    "notes": []
  },
  {
    "id": "math-ed-416",
    "name": "Mathematics I",
    "faculty": "BICTE",
    "semester": "1st Semester",
    "notes": []
  },
  {
    "id": "ict-ed-415",
    "name": "Introduction to Information Technology",
    "faculty": "BICTE",
    "semester": "1st Semester",
    "notes": []
  },
  {
    "id": "ict-ed-416",
    "name": "Programming Concept with C",
    "faculty": "BICTE",
    "semester": "1st Semester",
    "notes": []
  },
  {
    "id": "eng-ed-421",
    "name": "English Language II",
    "faculty": "BICTE",
    "semester": "2nd Semester",
    "notes": []
  },
  {
    "id": "nep-ed-421",
    "name": "General Nepali II",
    "faculty": "BICTE",
    "semester": "2nd Semester",
    "notes": []
  },
  {
    "id": "ed-422",
    "name": "Developmental Psychology",
    "faculty": "BICTE",
    "semester": "2nd Semester",
    "notes": []
  },
  {
    "id": "math-ed-426",
    "name": "Mathematics II",
    "faculty": "BICTE",
    "semester": "2nd Semester",
    "notes": []
  },
  {
    "id": "ict-ed-425",
    "name": "Digital Logic",
    "faculty": "BICTE",
    "semester": "2nd Semester",
    "notes": []
  },
  {
    "id": "ict-ed-426",
    "name": "Object Oriented Programming with C++",
    "faculty": "BICTE",
    "semester": "2nd Semester",
    "notes": []
  },
  {
    "id": "ed-432",
    "name": "Learning Psychology",
    "faculty": "BICTE",
    "semester": "3rd Semester",
    "notes": []
  },
  {
    "id": "ict-ed-435",
    "name": "Data Structure and Algorithm",
    "faculty": "BICTE",
    "semester": "3rd Semester",
    "notes": []
  },
  {
    "id": "ict-ed-436",
    "name": "Computer Architecture and Organization",
    "faculty": "BICTE",
    "semester": "3rd Semester",
    "notes": []
  },
  {
    "id": "ict-ed-437",
    "name": "Web Technology",
    "faculty": "BICTE",
    "semester": "3rd Semester",
    "notes": []
  },
  {
    "id": "math-ed-436",
    "name": "Probability and Statistics",
    "faculty": "BICTE",
    "semester": "3rd Semester",
    "notes": []
  },
  {
    "id": "ict-ed-438",
    "name": "21st Century Life Skills",
    "faculty": "BICTE",
    "semester": "3rd Semester",
    "notes": []
  },
  {
    "id": "ed-442",
    "name": "Fundamentals of Curriculum",
    "faculty": "BICTE",
    "semester": "4th Semester",
    "notes": []
  },
  {
    "id": "ict-ed-445",
    "name": "Operating System",
    "faculty": "BICTE",
    "semester": "4th Semester",
    "notes": []
  },
  {
    "id": "ict-ed-446",
    "name": "Database Management System",
    "faculty": "BICTE",
    "semester": "4th Semester",
    "notes": []
  },
  {
    "id": "ed-447",
    "name": "System Analysis and Design",
    "faculty": "BICTE",
    "semester": "4th Semester",
    "notes": []
  },
  {
    "id": "math-ed-446",
    "name": "Numerical Analysis",
    "faculty": "BICTE",
    "semester": "4th Semester",
    "notes": []
  },
  {
    "id": "ed-448",
    "name": "Leadership and Management",
    "faculty": "BICTE",
    "semester": "4th Semester",
    "notes": []
  },
  {
    "id": "ed-452",
    "name": "Assessment in Teaching and Learning",
    "faculty": "BICTE",
    "semester": "5th Semester",
    "notes": []
  },
  {
    "id": "ict-ed-455",
    "name": "Java Programming Language",
    "faculty": "BICTE",
    "semester": "5th Semester",
    "notes": []
  },
  {
    "id": "ict-ed-456",
    "name": "Data Communication and Networks",
    "faculty": "BICTE",
    "semester": "5th Semester",
    "notes": []
  },
  {
    "id": "ict-ed-457",
    "name": "Software Engineering and Project Management",
    "faculty": "BICTE",
    "semester": "5th Semester",
    "notes": []
  },
  {
    "id": "math-ed-456",
    "name": "Discrete Mathematics",
    "faculty": "BICTE",
    "semester": "5th Semester",
    "notes": []
  },
  {
    "id": "ed-462",
    "name": "Research Methods in Education",
    "faculty": "BICTE",
    "semester": "6th Semester",
    "notes": []
  },
  {
    "id": "ict-ed-465",
    "name": "Visual Programming",
    "faculty": "BICTE",
    "semester": "6th Semester",
    "notes": []
  },
  {
    "id": "ict-ed-466",
    "name": "Computer Graphics",
    "faculty": "BICTE",
    "semester": "6th Semester",
    "notes": []
  },
  {
    "id": "ed-467",
    "name": "Digital Pedagogy",
    "faculty": "BICTE",
    "semester": "6th Semester",
    "notes": []
  },
  {
    "id": "ict-ed-475",
    "name": "Network and Information Security",
    "faculty": "BICTE",
    "semester": "6th Semester",
    "notes": []
  },
  {
    "id": "ed-472",
    "name": "Research Project",
    "faculty": "BICTE",
    "semester": "7th Semester",
    "notes": []
  },
  {
    "id": "ed-476",
    "name": "Artificial Intelligence in Education",
    "faculty": "BICTE",
    "semester": "7th Semester",
    "notes": []
  },
  {
    "id": "ict-ed-477",
    "name": "Teaching Methods for ICT",
    "faculty": "BICTE",
    "semester": "7th Semester",
    "notes": []
  },
  {
    "id": "ict-ed-478",
    "name": "Geographical Information System",
    "faculty": "BICTE",
    "semester": "7th Semester",
    "notes": []
  },
  {
    "id": "ict-ed-479",
    "name": "Big Data Analysis",
    "faculty": "BICTE",
    "semester": "7th Semester",
    "notes": []
  },
  {
    "id": "ed-482",
    "name": "Classroom Pedagogy",
    "faculty": "BICTE",
    "semester": "8th Semester",
    "notes": []
  },
  {
    "id": "ict-ed-486",
    "name": "System Administrator with Linux",
    "faculty": "BICTE",
    "semester": "8th Semester",
    "notes": []
  },
  {
    "id": "ict-ed-487",
    "name": "Python Programming",
    "faculty": "BICTE",
    "semester": "8th Semester",
    "notes": []
  },
  {
    "id": "ict-ed-488",
    "name": "Cloud Computing",
    "faculty": "BICTE",
    "semester": "8th Semester",
    "notes": []
  },
  {
    "id": "ict-ed-489",
    "name": "Multimedia Technology",
    "faculty": "BICTE",
    "semester": "8th Semester",
    "notes": []
  },
  {
    "id": "ed-490",
    "name": "Teaching Practicum in ICT",
    "faculty": "BICTE",
    "semester": "8th Semester",
    "notes": []
  }
];

  baseSubjects.forEach(mockSub => {
    subjectMap[`${mockSub.faculty}-${mockSub.name}`] = {
      id: mockSub.id,
      name: mockSub.name,
      faculty: mockSub.faculty,
      semester: mockSub.semester,
      notes: [],
    };
  });

  // Populate with real notes
  resources.forEach(r => {
    const key = `${r.faculty}-${r.subject}`;
    if (!subjectMap[key]) {
      // If subject doesn't exist in our preset, we create it dynamically
      subjectMap[key] = {
        id: `dynamic-${r.subject.toLowerCase().replace(/\s+/g, '-')}`,
        faculty: r.faculty,
        semester: r.semester,
        name: r.subject,
        notes: []
      };
    }
    
    subjectMap[key].notes.push({
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
    refresh: fetchFromSupabase,
    getSubjectById: (id: string) => subjects.find(s => s.id === id) || subjects[0]
  };
}

export async function subscribeToNewsletter(email: string) {
  const { data, error } = await supabase
    .from('newsletter_subscriptions')
    .insert([{ email, created_at: new Date().toISOString() }]);

  if (error) {
    if (error.code === '23505') {
      throw new Error("This email is already subscribed!");
    }
    throw error;
  }
  return data;
}

export async function fetchSubscribers() {
  const { data, error } = await supabase
    .from('newsletter_subscriptions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
