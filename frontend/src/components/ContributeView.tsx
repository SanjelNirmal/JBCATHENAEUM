// Copyright by nirmal sanjel | hackingwithnirmal@gmail.com | +977 9848744321
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
    <div className="py-24 max-w-5xl mx-auto px-6 md:px-12 w-full font-sans animate-in fade-in duration-1000">
      <div className="mb-20 text-center">
        <div className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-[0.3em] rounded-full mb-6">
          Academic Stewardship
        </div>
        <h1 className="text-5xl md:text-7xl font-serif font-black text-[#002147] mb-6 tracking-tighter">Submit Archive</h1>
        <p className="text-slate-500 max-w-2xl mx-auto text-lg font-light leading-relaxed">Join a legacy of shared knowledge. Your contributions help future scholars navigate their academic journey with clarity.</p>
      </div>

      <div className="bg-white border-2 border-slate-100 rounded-[3rem] p-10 md:p-20 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.05)] mb-20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#c49b63]/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-[#c49b63]/10 transition-all duration-1000"></div>

        <div className="flex items-start space-x-6 mb-16 bg-slate-50 p-8 rounded-[2rem] border border-slate-100 relative z-10">
          <div className="w-12 h-12 bg-[#002147] text-white flex items-center justify-center rounded-2xl shrink-0 shadow-lg shadow-[#002147]/20">
            <Info size={24} />
          </div>
          <div className="text-sm text-slate-600">
            <h4 className="font-black text-[#002147] text-base uppercase tracking-tight mb-2">Pedagogical Verification</h4>
            <p className="leading-relaxed font-light italic text-lg text-slate-400">"Quality is the soul of JBC Athenaeum."</p>
            <p className="mt-4 leading-relaxed">Fill the parameters below to draft your submission. We verify every document for academic rigor before indexing into the master repository.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-3 group/field">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#c49b63] group-focus-within/field:text-[#002147] transition-colors">Contributor Identity</label>
              <input 
                type="text" 
                required
                className="w-full border-b-2 border-slate-100 py-4 text-lg font-medium text-[#002147] placeholder:text-slate-200 focus:outline-none focus:border-[#c49b63] transition-all bg-transparent"
                placeholder="Nirmal Sanjel"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div className="space-y-3 group/field">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#c49b63] group-focus-within/field:text-[#002147] transition-colors">Taxonomy Unit (Subject)</label>
              <select 
                required
                className="w-full border-b-2 border-slate-100 py-4 text-lg font-medium text-[#002147] focus:outline-none focus:border-[#c49b63] transition-all bg-transparent appearance-none"
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

            <div className="space-y-3 group/field">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#c49b63] group-focus-within/field:text-[#002147] transition-colors">Faculty Branch</label>
              <select 
                className="w-full border-b-2 border-slate-100 py-4 text-lg font-medium text-[#002147] focus:outline-none focus:border-[#c49b63] transition-all bg-transparent appearance-none"
                value={formData.faculty}
                onChange={e => {
                  const newFaculty = e.target.value;
                  const newSemester = (newFaculty === 'BCA' || newFaculty === 'BICTE') ? '1st Semester' : '1st Year';
                  const defaultSub = subjects.find(s => s.faculty === newFaculty && s.semester === newSemester);
                  setFormData({...formData, faculty: newFaculty, semester: newSemester, subject: defaultSub ? defaultSub.name : ''});
                }}
              >
                <option value="BCA">Comp Applications (BCA)</option>
                <option value="BICTE">ICT Ed (BICTE)</option>
                <option value="BSW">Social Work (BSW)</option>
                <option value="BBS">Business (BBS)</option>
              </select>
            </div>

            <div className="space-y-3 group/field">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#c49b63] group-focus-within/field:text-[#002147] transition-colors">
                Academic Tier ({(formData.faculty === 'BCA' || formData.faculty === 'BICTE') ? 'Semester' : 'Year'})
              </label>
              <select 
                className="w-full border-b-2 border-slate-100 py-4 text-lg font-medium text-[#002147] focus:outline-none focus:border-[#c49b63] transition-all bg-transparent appearance-none"
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

          <div className="space-y-3 group/field">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#c49b63] group-focus-within/field:text-[#002147] transition-colors">Manifest Description</label>
            <textarea 
              rows={4}
              className="w-full border-2 border-slate-50 p-8 rounded-[2rem] text-sm font-medium text-[#002147] focus:outline-none focus:border-[#c49b63] transition-all bg-slate-50/50 placeholder:text-slate-300 resize-none"
              placeholder="What makes these notes valuable? List chapters, specific exam variants, or unique summaries provided."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            ></textarea>
          </div>

          <div className="pt-10 flex justify-center">
            <button 
              type="submit" 
              className="group flex items-center justify-center gap-6 bg-[#002147] hover:bg-[#c49b63] text-white px-12 py-6 uppercase tracking-[0.35em] text-[10px] font-black transition-all duration-500 rounded-2xl shadow-2xl hover:shadow-[#c49b63]/20 hover:-translate-y-1"
            >
              <Mail size={18} strokeWidth={3} className="group-hover:rotate-12 transition-transform" />
              <span>Broadcast Submission</span>
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
