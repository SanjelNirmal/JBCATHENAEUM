// Copyright by nirmal sanjel | hackingwithnirmal@gmail.com | +977 9848744321
import { X, Mail, Lock } from "lucide-react";
import React, { useState } from "react";

export function LoginModal({ 
  onClose, 
  onSuccess 
}: { 
  onClose: () => void; 
  onSuccess: (user: { name: string, faculty: string }) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
      const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;

      if (email === adminEmail && password === adminPassword) {
        onSuccess({
          name: "Nirmal Sanjel",
          faculty: "Admin"
        });
      } else {
        setError("Invalid credentials. Please contact the admin for access.");
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 font-sans animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-[#002147] p-10 text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#c49b63]/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-serif font-bold text-[#c49b63]">Academic Login</h2>
            <p className="text-xs text-white/50 mt-2 uppercase tracking-widest font-black">Authorized Access Only</p>
          </div>
          <button 
            onClick={onClose} 
            className="absolute top-8 right-8 text-white/30 hover:text-white transition-all hover:rotate-90"
          >
            <X size={28} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 md:p-12 space-y-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 text-xs font-bold rounded-2xl border border-red-100 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
              {error}
            </div>
          )}
          
          <div className="space-y-3 group/field">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 group-focus-within/field:text-[#002147] transition-all">Scholarly Identity (Email)</label>
            <div className="relative">
              <Mail className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/field:text-[#c49b63] transition-all" size={20} />
              <input 
                type="email" 
                required
                className="w-full border-b-2 border-slate-100 py-4 pl-8 text-lg font-medium text-[#002147] placeholder:text-slate-200 focus:outline-none focus:border-[#c49b63] transition-all bg-transparent"
                placeholder="nirmal@jbc.edu.np"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-3 group/field">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 group-focus-within/field:text-[#002147] transition-all">Secure Key (Password)</label>
            <div className="relative">
              <Lock className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/field:text-[#c49b63] transition-all" size={20} />
              <input 
                type="password" 
                required
                className="w-full border-b-2 border-slate-100 py-4 pl-8 text-lg font-medium text-[#002147] placeholder:text-slate-200 focus:outline-none focus:border-[#c49b63] transition-all bg-transparent"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-6">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#002147] hover:bg-[#c49b63] text-white py-5 rounded-2xl uppercase tracking-[0.3em] text-[10px] font-black transition-all duration-500 shadow-xl hover:shadow-[#c49b63]/20 hover:-translate-y-1"
            >
              {loading ? "Authenticating Authority..." : "Initialize Session"}
            </button>
          </div>
          
          <div className="text-center">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">
              Restricted Archive. <span className="text-[#002147] font-black cursor-pointer hover:text-[#c49b63] transition-colors">Request Credentials</span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
