// Copyright by nirmal sanjel
import { Mail, Upload, FileCheck, Info } from "lucide-react";
import React, { useState } from "react";

import { Subject } from "../lib/api";
import { useResourcesData } from "../lib/api";

export function ContributeView({ initialName }: { initialName?: string }) {
  const { subjects } = useResourcesData();
  const [formData, setFormData] = useState({
    name: initialName || '',
    faculty: 'BCA',
    semester: '1st Semester',
    subject: '',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Note Contribution: ${formData.subject} - ${formData.faculty} ${formData.semester}`);
    const body = encodeURIComponent(`Hello Admin,

I would like to contribute notes for the archive.

Uploader Name: ${formData.name}
Faculty: ${formData.faculty}
Semester: ${formData.semester}
Subject: ${formData.subject}

Description/Remarks: 
${formData.description}

[Please attach your PDF/document files to this email before sending.]

Thank you!`);
    
    // Fallback email, user's email was in the prompt
    const mailto = `mailto:hackingwithnirmal@gmail.com?subject=${subject}&body=${body}`;
    window.location.href = mailto;
  };

  return (
    <div className="py-12 max-w-4xl mx-auto px-4 md:px-12 w-full font-sans">
      <div className="mb-12 border-b border-slate-200 pb-6 text-center">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#002147] mb-4">Contribute Notes</h1>
        <p className="text-slate-500 max-w-2xl mx-auto">Help grow the archive by submitting your class notes, summaries, or past papers.</p>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm p-8 md:p-12 mb-12">
        <div className="flex items-start space-x-4 mb-8 bg-blue-50 p-4 border-l-4 border-[#002147]">
          <Info className="text-[#002147] shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-slate-700">
            <h4 className="font-bold text-[#002147] mb-1">How it works</h4>
            <p>Fill out the details below to generate an email template. Your default email client will open, allowing you to easily attach your PDF files and send them to the administrator for verification. Once approved, they will be published in the archive.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Your Full Name</label>
              <input 
                type="text" 
                required
                className="w-full border border-slate-300 p-3 text-sm focus:outline-none focus:border-[#002147] transition-colors bg-slate-50"
                placeholder="e.g. Nirmal Sanjel"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Subject / Topic</label>
              <select 
                required
                className="w-full border border-slate-300 p-3 text-sm focus:outline-none focus:border-[#002147] transition-colors bg-slate-50 appearance-none rounded-none"
                value={formData.subject}
                onChange={e => setFormData({...formData, subject: e.target.value})}
              >
                <option value="" disabled>Select a subject...</option>
                {subjects
                  .filter(s => s.faculty === formData.faculty && s.semester === formData.semester)
                  .map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Faculty</label>
              <select 
                className="w-full border border-slate-300 p-3 text-sm focus:outline-none focus:border-[#002147] transition-colors bg-slate-50 appearance-none rounded-none"
                value={formData.faculty}
                onChange={e => {
                  const newFaculty = e.target.value;
                  const newSemester = (newFaculty === 'BCA' || newFaculty === 'BICTE') ? '1st Semester' : '1st Year';
                  const defaultSub = subjects.find(s => s.faculty === newFaculty && s.semester === newSemester);
                  setFormData({...formData, faculty: newFaculty, semester: newSemester, subject: defaultSub ? defaultSub.name : ''});
                }}
              >
                <option value="BCA">Computer Applications (BCA)</option>
                <option value="BICTE">Information & Communication Tech (BICTE)</option>
                <option value="BSW">Social Work (BSW)</option>
                <option value="BBS">Business Studies (BBS)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                {(formData.faculty === 'BCA' || formData.faculty === 'BICTE') ? 'Semester' : 'Year'}
              </label>
              <select 
                className="w-full border border-slate-300 p-3 text-sm focus:outline-none focus:border-[#002147] transition-colors bg-slate-50 appearance-none rounded-none"
                value={formData.semester}
                onChange={e => {
                  const newSem = e.target.value;
                  const defaultSub = subjects.find(s => s.faculty === formData.faculty && s.semester === newSem);
                  setFormData({...formData, semester: newSem, subject: defaultSub ? defaultSub.name : ''});
                }}
              >
                {(formData.faculty === 'BCA' || formData.faculty === 'BICTE') ? (
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

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Additional Remarks (Optional)</label>
            <textarea 
              rows={4}
              className="w-full border border-slate-300 p-3 text-sm focus:outline-none focus:border-[#002147] transition-colors bg-slate-50 resize-y"
              placeholder="Any details about the notes like chapters covered, references used, quality, etc."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            ></textarea>
          </div>

          <div className="pt-4 flex justify-end">
            <button 
              type="submit" 
              className="flex items-center space-x-2 bg-[#002147] hover:bg-[#001b3a] text-white px-8 py-4 uppercase tracking-widest text-xs font-bold transition-colors shadow-sm"
            >
              <Mail size={16} />
              <span>Generate Email to Submit</span>
            </button>
          </div>
        </form>
      </div>
      
      {/* Verify Steps visual */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center px-4">
         <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-slate-100 text-[#002147] flex items-center justify-center rounded-full mb-4">
              <Upload size={20} />
            </div>
            <h4 className="font-bold text-slate-800 mb-2">1. Submit Request</h4>
            <p className="text-xs text-slate-500">Email your notes using the form above. PDF files are preferred.</p>
         </div>
         <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-slate-100 text-[#002147] flex items-center justify-center rounded-full mb-4">
              <FileCheck size={20} />
            </div>
            <h4 className="font-bold text-slate-800 mb-2">2. Verification</h4>
            <p className="text-xs text-slate-500">Admins review your notes for quality, relevance, and accuracy.</p>
         </div>
         <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-slate-100 text-[#c49b63] flex items-center justify-center rounded-full mb-4">
              <FileCheck size={20} />
            </div>
            <h4 className="font-bold text-slate-800 mb-2">3. Published</h4>
            <p className="text-xs text-slate-500">Once verified, they are uploaded for all students to access freely.</p>
         </div>
      </div>
    </div>
  );
}
