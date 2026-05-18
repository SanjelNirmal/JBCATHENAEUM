import { Info, Mail, Phone, MapPin, Send, AlertTriangle } from "lucide-react";
import { useState } from "react";

const InfoContent = ({ pageTitle }: { pageTitle: string }) => {
  const [submitted, setSubmitted] = useState(false);

  switch (pageTitle) {
    case 'Terms of Service':
      return (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-[#002147]">1. Acceptance of Terms</h2>
          <p className="text-slate-600 leading-relaxed">By accessing and using the JBC ATHENAEUM, you accept and agree to be bound by the terms and provision of this agreement. These terms apply to all visitors, students, and faculty who access or use the Service.</p>
          
          <h2 className="text-xl font-bold text-[#002147] pt-4">2. Academic Use Only</h2>
          <p className="text-slate-600 leading-relaxed">The resources provided herein are strictly for educational and non-commercial purposes. You may not sell, redistribute for profit, or commercialize any notes, documents, or materials obtained from this archive.</p>

          <h2 className="text-xl font-bold text-[#002147] pt-4">3. User Contributions</h2>
          <p className="text-slate-600 leading-relaxed">By submitting notes through our contribution system, you grant the Archive a non-exclusive, royalty-free license to distribute and display the content for academic purposes. You ensure that you are the original creator or have permission to share the material.</p>
        </div>
      );

    case 'Privacy Policy':
      return (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-[#002147]">Data Collection</h2>
          <p className="text-slate-600 leading-relaxed">We collect limited information required to provide and improve the JBC ATHENAEUM services. This may include your academic email (if logged in), IP address for security purposes, and usage metrics to determine popular subjects.</p>
          
          <h2 className="text-xl font-bold text-[#002147] pt-4">Data Usage</h2>
          <p className="text-slate-600 leading-relaxed">Your data is never sold to third parties. We use it solely to maintain the integrity of our platform, communicate regarding your contributions, and send requested newsletter updates.</p>
        </div>
      );

    case 'Academic Integrity':
      return (
        <div className="space-y-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-8">
            <p className="text-yellow-800 font-medium">Plagiarism and unauthorized copying strictly violate our core principles.</p>
          </div>
          <p className="text-slate-600 leading-relaxed">The JBC ATHENAEUM is a supplementary study tool. Notes and assignments found here should be used to understand concepts, not to be copied and passed off as your own work. Always cite your sources and adhere strictly to the university's academic honesty policies.</p>
        </div>
      );

    case 'Copyright Guidelines':
      return (
        <div className="space-y-6">
          <p className="text-slate-600 leading-relaxed">We respect intellectual property. Do not upload commercially published textbooks, copyrighted research papers (without open-access licenses), or premium paid study materials.</p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600 mt-4">
            <li>Only upload your own handwritten/typed notes or assignments.</li>
            <li>Professors' slides can only be uploaded if they have given explicit permission.</li>
            <li>Past examination papers are generally considered public academic records and are permitted.</li>
          </ul>
        </div>
      );

    case 'Faculty Directory':
      return (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-slate-200 p-6 rounded">
              <h3 className="font-bold text-[#002147] text-lg mb-1">Prof. Ram Sharma</h3>
              <p className="text-[#c49b63] text-sm mb-4">Head of BCA Department</p>
              <div className="space-y-2 text-sm text-slate-600">
                <p className="flex items-center"><Mail size={14} className="mr-2" /> r.sharma@janabhawana.edu.np</p>
                <p className="flex items-center"><Phone size={14} className="mr-2" /> Ext. 104</p>
              </div>
            </div>
            <div className="border border-slate-200 p-6 rounded">
              <h3 className="font-bold text-[#002147] text-lg mb-1">Dr. Sita Karki</h3>
              <p className="text-[#c49b63] text-sm mb-4">Head of BSW Department</p>
              <div className="space-y-2 text-sm text-slate-600">
                <p className="flex items-center"><Mail size={14} className="mr-2" /> s.karki@janabhawana.edu.np</p>
                <p className="flex items-center"><Phone size={14} className="mr-2" /> Ext. 108</p>
              </div>
            </div>
          </div>
        </div>
      );

    case 'Library Administration':
      return (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-[#002147]">Central Library Contact</h2>
          <div className="bg-slate-50 p-6 border border-slate-200 rounded text-slate-700 space-y-4">
            <p className="flex items-center"><MapPin size={16} className="mr-3 text-[#c49b63]" /> Main Campus Building, Ground Floor</p>
            <p className="flex items-center"><Mail size={16} className="mr-3 text-[#c49b63]" /> library@janabhawana.edu.np</p>
            <p className="flex items-center"><Phone size={16} className="mr-3 text-[#c49b63]" /> +977-1-5555555</p>
          </div>
          <p className="text-slate-600 text-sm mt-4">Working Hours: Sunday to Friday, 7:00 AM - 5:00 PM</p>
        </div>
      );

    case 'IT Support Desk':
      return (
        <div className="space-y-6">
           <p className="text-slate-600 leading-relaxed">Having trouble logging in or accessing a resource? Our IT team is here to help.</p>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
             <div className="bg-blue-50 border border-blue-100 p-6 rounded text-center">
               <Mail className="mx-auto text-[#002147] mb-3" size={24} />
               <h3 className="font-bold text-[#002147] mb-2">Email Support</h3>
               <p className="text-sm text-slate-600">it.support@janabhawana.edu.np</p>
             </div>
             <div className="bg-blue-50 border border-blue-100 p-6 rounded text-center">
               <Phone className="mx-auto text-[#002147] mb-3" size={24} />
               <h3 className="font-bold text-[#002147] mb-2">Call Helpdesk</h3>
               <p className="text-sm text-slate-600">+977-1-4444444</p>
             </div>
           </div>
        </div>
      );

    case 'Submit Feedback':
    case 'Report an Error':
      return submitted ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send size={24} />
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#002147] mb-2">Thank You!</h2>
          <p className="text-slate-600">Your message has been received.</p>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-6 max-w-xl">
          <p className="text-slate-600">{pageTitle === 'Report an Error' ? 'Found a broken link or incorrect document? Let us know.' : 'We love hearing how we can improve the platform.'}</p>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Your Name (Optional)</label>
            <input type="text" className="w-full border border-slate-300 p-3 text-sm focus:outline-none focus:border-[#002147] bg-slate-50" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Message</label>
            <textarea rows={5} required className="w-full border border-slate-300 p-3 text-sm focus:outline-none focus:border-[#002147] bg-slate-50"></textarea>
          </div>
          <button type="submit" className="bg-[#002147] hover:bg-[#001b3a] text-white px-8 py-3 uppercase tracking-widest text-xs font-bold transition-colors">
            Submit
          </button>
        </form>
      );

    case 'FAQ & Guides':
      return (
        <div className="space-y-6 text-slate-600">
          <div className="border-b border-slate-200 pb-4">
            <h3 className="font-bold text-[#002147] mb-2">Q: How do I download a PDF?</h3>
            <p className="text-sm">A: Open the document in the NoteViewer and click the "Download PDF" button at the top right of the viewer header.</p>
          </div>
          <div className="border-b border-slate-200 pb-4">
            <h3 className="font-bold text-[#002147] mb-2">Q: Why isn't the document loading?</h3>
            <p className="text-sm">A: Some networks block Google Drive iframes. If this happens, try accessing from a different network or wait for the fallback link to appear.</p>
          </div>
          <div className="pb-4">
            <h3 className="font-bold text-[#002147] mb-2">Q: Who can upload notes?</h3>
            <p className="text-sm">A: Any student can submit notes via the "Contribute" page. They will be reviewed by an admin before becoming public.</p>
          </div>
        </div>
      );

    case 'Upload Instructions':
      return (
        <div className="space-y-6 text-slate-600">
          <h2 className="text-xl font-bold text-[#002147]">Step-by-Step Guide</h2>
          <ol className="list-decimal pl-5 space-y-4">
            <li>Navigate to the <strong>Contribute</strong> page from the top navigation menu.</li>
            <li>Fill out the form with accurate details regarding the Faculty, Semester, and Subject.</li>
            <li>Click "Generate Email to Submit". This will open your default email client.</li>
            <li><strong>Crucial:</strong> Attach your PDF files to the email before sending.</li>
            <li>The admins will review your submission and upload it within 48 hours.</li>
          </ol>
        </div>
      );

    case 'Sitemap':
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
           <div>
             <h4 className="font-bold text-[#002147] mb-4 border-b border-slate-200 pb-2">Main</h4>
             <ul className="space-y-2 text-sm text-slate-600">
               <li>Home</li>
               <li>Semesters Overview</li>
               <li>All Resources</li>
               <li>Contribute Notes</li>
             </ul>
           </div>
           <div>
             <h4 className="font-bold text-[#002147] mb-4 border-b border-slate-200 pb-2">Faculties</h4>
             <ul className="space-y-2 text-sm text-slate-600">
               <li>BCA (Computing)</li>
               <li>BSW (Social Work)</li>
               <li>BBS (Business)</li>
             </ul>
           </div>
        </div>
      );

    default:
      return (
        <div className="prose prose-slate max-w-none prose-headings:font-serif prose-headings:text-[#002147] prose-a:text-[#c49b63]">
          <AlertTriangle className="text-yellow-500 mb-4" size={32} />
          <h2 className="text-2xl font-bold mb-4">Under Construction</h2>
          <p className="mb-4">
            The full details for <strong>{pageTitle}</strong> are currently being drafted and reviewed by the administration.
            Please check back later for the complete document.
          </p>
        </div>
      );
  }
};

export function InfoView({ pageTitle }: { pageTitle: string }) {
  return (
    <div className="py-12 max-w-3xl mx-auto px-4 md:px-12 w-full font-sans min-h-[60vh]">
      <div className="mb-8 border-b border-slate-200 pb-6">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#002147] mb-4">{pageTitle}</h1>
        <p className="text-slate-500">Information, policies, and guidelines</p>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm p-8 md:p-12 mb-12">
        <div className="flex items-start space-x-4 mb-8 bg-blue-50 p-4 border-l-4 border-[#002147]">
          <Info className="text-[#002147] shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-slate-700">
            <h4 className="font-bold text-[#002147] mb-1">Status</h4>
            <p>This document is current and applies to all users of the JBC ATHENAEUM.</p>
          </div>
        </div>

        <InfoContent pageTitle={pageTitle} />
      </div>
    </div>
  );
}
