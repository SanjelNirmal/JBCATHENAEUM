// Copyright by nirmal sanjel | hackingwithnirmal@gmail.com | +977 9848744321
import { Search, ExternalLink, BookOpen } from "lucide-react";
import React, { useState } from "react";

export function LibraryArchivesView() {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.open(`https://scholar.google.com/scholar?q=${encodeURIComponent(searchQuery)}`, '_blank');
    }
  };

  return (
    <div className="py-12 max-w-4xl mx-auto px-4 md:px-12 w-full font-sans min-h-[60vh] flex flex-col items-center">
      <div className="mb-12 border-b border-slate-200 pb-6 text-center w-full">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#002147] mb-4">Library Archives</h1>
        <p className="text-slate-500 max-w-2xl mx-auto">Search for academic articles, books, and research papers across global databases.</p>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm p-8 md:p-16 w-full max-w-3xl rounded">
        <div className="flex flex-col items-center justify-center text-center w-full">
          <BookOpen size={64} className="text-[#c49b63] mb-6" />
          <h2 className="text-2xl font-serif font-bold text-[#002147] mb-4">Global Academic Search</h2>
          <p className="text-slate-600 mb-8">
            Access millions of scholarly articles, theses, books, and court opinions from academic publishers, professional societies, online repositories, universities, and other web sites.
          </p>

          <form onSubmit={handleSearch} className="w-full relative shadow-sm">
            <input 
              type="text"
              placeholder="Search by title, author, or keywords..."
              className="w-full border-2 border-slate-200 p-4 pl-6 pr-32 text-lg focus:outline-none focus:border-[#002147] transition-colors rounded-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              required
            />
            <button 
              type="submit"
              className="absolute right-2 top-2 bottom-2 bg-[#002147] hover:bg-[#001b3a] text-white px-6 rounded-full transition-colors flex items-center justify-center space-x-2 font-bold uppercase tracking-wider text-xs"
            >
              <span>Search</span>
              <Search size={16} />
            </button>
          </form>

          <p className="text-xs text-slate-400 font-medium tracking-wide uppercase mt-8 flex items-center justify-center">
            Results provided via Google Scholar <ExternalLink size={12} className="ml-1.5" />
          </p>
        </div>
      </div>
    </div>
  );
}
