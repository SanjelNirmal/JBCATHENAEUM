import { Mail, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export function Footer({ onNavigateInfo }: { onNavigateInfo?: (page: string) => void }) {
  return (
    <footer className="w-full font-sans">
      {/* Newsletter Strip */}
      <div className="bg-white border-y border-slate-200 px-4 md:px-12 py-16">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-serif font-bold text-[#002147] mb-2">Subscribe to the Archives</h3>
            <p className="text-slate-500 font-light text-sm">Receive monthly summaries of new thesis uploads and faculty notes.</p>
          </div>
          <div className="flex w-full md:w-auto max-w-md">
            <div className="relative w-full">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="email" 
                placeholder="Your academic email..." 
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#002147] transition-colors text-sm"
              />
            </div>
            <button className="bg-[#002147] hover:bg-[#001b3a] text-white px-6 py-3 uppercase tracking-widest text-xs font-bold transition-colors whitespace-nowrap">
              Subscribe
            </button>
          </div>
        </div>
      </div>

      {/* Main Dark Footer */}
      <div className="bg-[#001b3a] text-slate-300 pt-20 pb-8 px-4 md:px-12">
        <div className="max-w-7xl mx-auto">
          
          {/* Centered Quote & Socials */}
          <div className="flex flex-col items-center text-center mb-20">
            <p className="text-3xl md:text-4xl font-serif italic text-white max-w-3xl leading-snug mb-8">
               "The foundation of every state is the education of its youth."
            </p>
            <div className="flex space-x-6">
              <a href="#" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 hover:border-white/40 transition-colors">
                <Facebook size={18} className="text-white" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 hover:border-white/40 transition-colors">
                <Twitter size={18} className="text-white" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 hover:border-white/40 transition-colors">
                <Instagram size={18} className="text-white" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 hover:border-white/40 transition-colors">
                <Linkedin size={18} className="text-white" />
              </a>
            </div>
          </div>

          {/* Utility Links Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16 border-t border-white/10 pt-16">
            <div className="text-center md:text-left">
              <h4 className="text-[#c49b63] font-serif text-lg italic mb-6">Policies</h4>
              <ul className="space-y-3 text-sm font-light">
                <li><button onClick={() => onNavigateInfo?.('Terms of Service')} className="hover:text-white transition-colors">Terms of Service</button></li>
                <li><button onClick={() => onNavigateInfo?.('Privacy Policy')} className="hover:text-white transition-colors">Privacy Policy</button></li>
                <li><button onClick={() => onNavigateInfo?.('Academic Integrity')} className="hover:text-white transition-colors">Academic Integrity</button></li>
                <li><button onClick={() => onNavigateInfo?.('Copyright Guidelines')} className="hover:text-white transition-colors">Copyright Guidelines</button></li>
              </ul>
            </div>
            <div className="text-center md:text-center md:border-x md:border-white/10 px-8">
              <h4 className="text-[#c49b63] font-serif text-lg italic mb-6">Contacts</h4>
              <ul className="space-y-3 text-sm font-light">
                <li><button onClick={() => onNavigateInfo?.('Faculty Directory')} className="hover:text-white transition-colors">Faculty Directory</button></li>
                <li><button onClick={() => onNavigateInfo?.('Library Administration')} className="hover:text-white transition-colors">Library Administration</button></li>
                <li><button onClick={() => onNavigateInfo?.('IT Support Desk')} className="hover:text-white transition-colors">IT Support Desk</button></li>
                <li><button onClick={() => onNavigateInfo?.('Submit Feedback')} className="hover:text-white transition-colors">Submit Feedback</button></li>
              </ul>
            </div>
            <div className="text-center md:text-right">
              <h4 className="text-[#c49b63] font-serif text-lg italic mb-6">Support</h4>
              <ul className="space-y-3 text-sm font-light">
                <li><button onClick={() => onNavigateInfo?.('FAQ & Guides')} className="hover:text-white transition-colors">FAQ & Guides</button></li>
                <li><button onClick={() => onNavigateInfo?.('Upload Instructions')} className="hover:text-white transition-colors">Upload Instructions</button></li>
                <li><button onClick={() => onNavigateInfo?.('Report an Error')} className="hover:text-white transition-colors">Report an Error</button></li>
                <li><button onClick={() => onNavigateInfo?.('Sitemap')} className="hover:text-white transition-colors">Sitemap</button></li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 font-light tracking-widest uppercase">
            <p>&copy; 2026 JBC ATHENAEUM</p>
            <p className="mt-2 md:mt-0">Designed for Scholars</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
