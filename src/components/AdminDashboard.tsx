import React, { useState, useEffect } from "react";
import { Users, FileText, Settings, Database, Edit, Trash2, Terminal, AlertTriangle, Play, X, Plus } from "lucide-react";
import { Subject, Note, createResource, deleteResource } from "../lib/api";
import { useResourcesData } from "../lib/api";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'notes' | 'users' | 'sql' | 'settings'>('notes');
  const { resources, subjects } = useResourcesData();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newResource, setNewResource] = useState({
    title: '', subject: '', faculty: 'BCA', semester: '1st Semester', author_name: 'Admin', file_url: '', file_size: '2MB', resource_type: 'PDF'
  });
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this resource?")) return;
    setIsDeleting(id);
    try {
      await deleteResource(id);
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      if (err?.code === '42501' || err?.message?.includes('row-level security')) {
         alert("Permission Denied: To allow deleting resources, please execute the SQL setup query shown in the 'Database SQL Schema' tab in your Supabase SQL Editor to grant DELETE permissions.");
      } else {
         alert("Failed to delete resource");
      }
      setIsDeleting(null);
    }
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createResource(newResource);
      setShowAddModal(false);
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      if (err?.code === '42501' || err?.message?.includes('row-level security')) {
         alert("Permission Denied: To allow creating resources, please execute the SQL setup query shown in the 'Database SQL Schema' tab in your Supabase SQL Editor to grant INSERT permissions.");
      } else {
         alert("Failed to create resource");
      }
    }
  };

  const [sqlQuery, setSqlQuery] = useState(`-- Complete Database Schema Setup
-- Run this in your Supabase SQL Editor

-- 1. Profiles Table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  faculty TEXT,
  role TEXT DEFAULT 'scholar', -- 'scholar' or 'admin'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Resources (Notes) Table
CREATE TABLE IF NOT EXISTS resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  faculty TEXT NOT NULL,
  semester TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  file_url TEXT NOT NULL,
  file_size TEXT,
  resource_type TEXT DEFAULT 'PDF',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Contributions Table (Pending Notes)
CREATE TABLE IF NOT EXISTS contributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  faculty TEXT NOT NULL,
  semester TEXT NOT NULL,
  contributor_name TEXT NOT NULL,
  contributor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  file_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- 5. Basic Security Policies
DROP POLICY IF EXISTS "Public resources are viewable by everyone" ON resources;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Allow insert resources for everyone" ON resources;
DROP POLICY IF EXISTS "Allow delete resources for everyone" ON resources;
DROP POLICY IF EXISTS "Allow update resources for everyone" ON resources;

-- Everyone can read resources and approved contributions
CREATE POLICY "Public resources are viewable by everyone" ON resources FOR SELECT USING (true);
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Allow insert resources for everyone" ON resources FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow delete resources for everyone" ON resources FOR DELETE USING (true);
CREATE POLICY "Allow update resources for everyone" ON resources FOR UPDATE USING (true);
`);
  const [sqlResult, setSqlResult] = useState<any>(null);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const handleExecuteSql = async () => {
    setIsExecuting(true);
    setSqlResult(null);
    setSqlError(null);
    try {
      setSqlError("Executing raw DDL SQL directly from the browser is restricted. Use Supabase Dashboard.");
    } catch (err: any) {
      setSqlError(err.message || "An error occurred");
    } finally {
      setIsExecuting(false);
    }
  };

  const allNotes = subjects.flatMap(subject => 
    subject.notes.map(note => ({ ...note, subjectName: subject.name }))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 border-b border-slate-200 pb-5">
        <h1 className="text-3xl font-serif font-bold text-[#002147]">Admin Dashboard</h1>
        <p className="text-slate-500 mt-2">Manage library archives, users, and system settings.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0 space-y-2">
          <button 
            onClick={() => setActiveTab('notes')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
              activeTab === 'notes' ? 'bg-[#002147] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Database size={18} />
            <span className="font-medium text-sm">Review Notes</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
              activeTab === 'users' ? 'bg-[#002147] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users size={18} />
            <span className="font-medium text-sm">Manage Users</span>
          </button>

          <button 
            onClick={() => setActiveTab('sql')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
              activeTab === 'sql' ? 'bg-[#002147] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Terminal size={18} />
            <span className="font-medium text-sm">SQL Editor</span>
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
              activeTab === 'settings' ? 'bg-[#002147] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Settings size={18} />
            <span className="font-medium text-sm">System Settings</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          {activeTab === 'notes' && (
            <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-lg font-bold text-[#002147] flex items-center gap-2">
                  <FileText size={20} className="text-[#c1121f]" />
                  Uploaded Resources
                </h2>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-[#002147] text-white text-sm font-medium rounded hover:bg-[#001530] transition-colors flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add New Resource
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Title</th>
                      <th className="px-6 py-4">Subject</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {resources.map((resource) => (
                      <tr key={resource.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-800">{resource.title}</div>
                          <div className="text-xs text-slate-400 mt-1">{resource.author_name} • {new Date(resource.created_at).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{resource.subject}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600 uppercase tracking-widest">
                            {resource.resource_type || 'PDF'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button className="p-2 text-slate-400 hover:text-[#002147] hover:bg-blue-50 rounded transition-colors" title="Edit Resource">
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(resource.id)}
                              className="p-2 text-slate-400 hover:text-[#c1121f] hover:bg-red-50 rounded transition-colors" 
                              title="Delete Resource"
                              disabled={isDeleting === resource.id}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {resources.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500 italic">No resources uploaded yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white border border-slate-200 shadow-sm p-8 text-center rounded-lg">
              <Users size={32} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-800 mb-2">User Management</h3>
              <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                User management will be available once the database integration is complete.
              </p>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden flex flex-col h-[600px]">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h2 className="text-lg font-bold text-[#002147] flex items-center gap-2">
                  <Terminal size={20} className="text-[#c1121f]" />
                  SQL Editor (Supabase)
                </h2>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleExecuteSql}
                    disabled={isExecuting}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <Play size={14} />
                    {isExecuting ? 'Executing...' : 'Run Query'}
                  </button>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col p-4 gap-4 bg-slate-50">
                <div className="bg-[#1e1e1e] rounded-lg overflow-hidden flex-1 flex flex-col border border-slate-300 shadow-inner">
                  <div className="px-4 py-2 bg-[#2d2d2d] flex items-center gap-2 text-xs text-slate-400 font-mono">
                    query.sql
                  </div>
                  <textarea 
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    className="w-full flex-1 bg-transparent text-slate-300 font-mono p-4 focus:outline-none resize-none text-sm leading-relaxed"
                    spellCheck="false"
                  />
                </div>
                
                <div className="h-48 bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col">
                  <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center justify-between">
                    <span>Results</span>
                  </div>
                  <div className="p-4 overflow-auto flex-1 font-mono text-sm">
                    {sqlError ? (
                      <div className="text-red-600 flex gap-2">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                        <span>{sqlError}</span>
                      </div>
                    ) : sqlResult ? (
                      <pre className="text-slate-700">{JSON.stringify(sqlResult, null, 2)}</pre>
                    ) : (
                      <div className="text-slate-400 italic">No results yet. Run a query to see output.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-lg space-y-8">
              <div className="pt-2">
                <h3 className="text-lg font-bold text-[#002147] mb-1 flex items-center gap-2">
                  <Settings size={18} />
                  General Settings
                </h3>
                <p className="text-sm text-slate-500 mb-4">Configure global platform options.</p>
                
                <div className="space-y-4 max-w-md">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Platform Name</label>
                    <input type="text" className="w-full border border-slate-300 p-3 text-sm focus:outline-none focus:border-[#002147] bg-slate-50" defaultValue="Jana Bhawana E-Library" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Admin Contact Email</label>
                    <input type="email" className="w-full border border-slate-300 p-3 text-sm focus:outline-none focus:border-[#002147] bg-slate-50" defaultValue="hackingwithnirmal@gmail.com" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-[#002147] text-lg">Add New Resource</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="addResourceForm" onSubmit={handleAddResource} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Title</label>
                  <input 
                    required type="text" 
                    className="w-full border border-slate-300 p-3 text-sm focus:outline-none focus:border-[#002147] bg-slate-50" 
                    value={newResource.title}
                    onChange={e => setNewResource({...newResource, title: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Faculty</label>
                    <select 
                      required 
                      className="w-full border border-slate-300 p-3 text-sm focus:outline-none focus:border-[#002147] bg-slate-50" 
                      value={newResource.faculty}
                      onChange={e => {
                        const newFaculty = e.target.value;
                        const newSemester = (newFaculty === 'BCA' || newFaculty === 'BICTE') ? '1st Semester' : '1st Year';
                        const defaultSub = subjects.find(s => s.faculty === newFaculty && s.semester === newSemester);
                        setNewResource({...newResource, faculty: newFaculty, semester: newSemester, subject: defaultSub ? defaultSub.name : ''});
                      }}
                    >
                      <option value="BCA">BCA</option>
                      <option value="BICTE">BICTE</option>
                      <option value="BSW">BSW</option>
                      <option value="BBS">BBS</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                      {(newResource.faculty === 'BCA' || newResource.faculty === 'BICTE') ? 'Semester' : 'Year'}
                    </label>
                    <select 
                      required 
                      className="w-full border border-slate-300 p-3 text-sm focus:outline-none focus:border-[#002147] bg-slate-50" 
                      value={newResource.semester}
                      onChange={e => {
                        const newSem = e.target.value;
                        const defaultSub = subjects.find(s => s.faculty === newResource.faculty && s.semester === newSem);
                        setNewResource({...newResource, semester: newSem, subject: defaultSub ? defaultSub.name : ''});
                      }}
                    >
                      {(newResource.faculty === 'BCA' || newResource.faculty === 'BICTE') ? (
                        <>
                          <option value="1st Semester">1st Semester</option>
                          <option value="2nd Semester">2nd Semester</option>
                          <option value="3rd Semester">3rd Semester</option>
                          <option value="4th Semester">4th Semester</option>
                          <option value="5th Semester">5th Semester</option>
                          <option value="6th Semester">6th Semester</option>
                          <option value="7th Semester">7th Semester</option>
                          <option value="8th Semester">8th Semester</option>
                        </>
                      ) : (
                        <>
                          <option value="1st Year">1st Year</option>
                          <option value="2nd Year">2nd Year</option>
                          <option value="3rd Year">3rd Year</option>
                          <option value="4th Year">4th Year</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Subject</label>
                  <select 
                    required 
                    className="w-full border border-slate-300 p-3 text-sm focus:outline-none focus:border-[#002147] bg-slate-50" 
                    value={newResource.subject}
                    onChange={e => setNewResource({...newResource, subject: e.target.value})}
                  >
                    <option value="" disabled>Select a subject...</option>
                    {subjects
                      .filter(s => s.faculty === newResource.faculty && s.semester === newResource.semester)
                      .map(s => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">File URL (Google Drive)</label>
                  <input 
                    required type="url" 
                    className="w-full border border-slate-300 p-3 text-sm focus:outline-none focus:border-[#002147] bg-slate-50" 
                    value={newResource.file_url}
                    onChange={e => setNewResource({...newResource, file_url: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Author Name</label>
                    <input 
                      required type="text" 
                      className="w-full border border-slate-300 p-3 text-sm focus:outline-none focus:border-[#002147] bg-slate-50" 
                      value={newResource.author_name}
                      onChange={e => setNewResource({...newResource, author_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">File Size</label>
                    <input 
                      required type="text" placeholder="e.g. 2.5MB"
                      className="w-full border border-slate-300 p-3 text-sm focus:outline-none focus:border-[#002147] bg-slate-50" 
                      value={newResource.file_size}
                      onChange={e => setNewResource({...newResource, file_size: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Resource Type</label>
                    <select 
                      required 
                      className="w-full border border-slate-300 p-3 text-sm focus:outline-none focus:border-[#002147] bg-slate-50" 
                      value={newResource.resource_type}
                      onChange={e => setNewResource({...newResource, resource_type: e.target.value})}
                    >
                      <option value="PDF">PDF</option>
                      <option value="DOCX">DOCX</option>
                      <option value="PPTX">PPTX</option>
                      <option value="LINK">LINK</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-slate-600 font-medium text-sm hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                form="addResourceForm"
                className="px-4 py-2 bg-[#002147] text-white font-medium text-sm rounded hover:bg-[#001530] transition-colors"
              >
                Save Resource
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
