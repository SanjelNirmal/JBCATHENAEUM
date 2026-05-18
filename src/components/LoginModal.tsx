// Copyright by nirmal sanjel
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 font-sans">
      <div className="bg-white rounded shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-[#002147] p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-serif font-bold text-[#c49b63]">Student Login</h2>
            <p className="text-xs text-white/70 mt-1">Access member features and saved nodes</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 text-sm rounded border border-red-100">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
              <input 
                type="email" 
                required
                className="w-full border border-slate-300 p-3 pl-10 text-sm focus:outline-none focus:border-[#002147] bg-slate-50"
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
              <input 
                type="password" 
                required
                className="w-full border border-slate-300 p-3 pl-10 text-sm focus:outline-none focus:border-[#002147] bg-slate-50"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#c49b63] hover:bg-[#b38a52] text-white p-3 uppercase tracking-widest text-xs font-bold transition-colors disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Sign In"}
            </button>
          </div>
          
          <div className="text-center mt-4">
            <p className="text-xs text-slate-500">
              Don't have an account? <span className="text-[#002147] font-bold cursor-pointer hover:underline">Contact IT Desk</span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
