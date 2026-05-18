// Copyright by nirmal sanjel
import React from 'react';
import { Code, Database, Cpu, BarChart, Users, Calculator, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

const collections = [
  { id: 'bca-c-programming', name: 'BCA Programming', icon: <Code size={20} />, color: 'bg-blue-50 text-blue-600 border-blue-100' },
  { id: 'bca-dbms', name: 'Database Systems', icon: <Database size={20} />, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  { id: 'bca-microprocessor', name: 'Microprocessors', icon: <Cpu size={20} />, color: 'bg-purple-50 text-purple-600 border-purple-100' },
  { id: 'bca-probability', name: 'Statistics', icon: <BarChart size={20} />, color: 'bg-amber-50 text-amber-600 border-amber-100' },
  { id: 'bsw-intro-social-work', name: 'Social Work', icon: <Users size={20} />, color: 'bg-rose-50 text-rose-600 border-rose-100' },
  { id: 'mgt-211', name: 'Accountancy', icon: <Calculator size={20} />, color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
];

export function PopularCollections({ onSelect, onViewAll }: { onSelect: (id: string) => void, onViewAll: () => void }) {
  return (
    <section className="py-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h2 className="text-3xl font-serif font-bold text-[#002147] mb-2">Popular Collections</h2>
          <p className="text-slate-500 font-light">Direct access to our most frequently accessed academic archives.</p>
        </div>
        <button 
          onClick={onViewAll}
          className="text-sm font-bold text-[#c49b63] hover:text-[#002147] transition-colors flex items-center gap-2 group"
        >
          View All Subjects <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((item, index) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelect(item.id)}
            className="flex items-center gap-5 p-6 bg-white border border-slate-200 rounded-xl hover:border-[#c49b63] hover:shadow-xl hover:shadow-amber-500/5 transition-all text-left"
          >
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center border ${item.color} shrink-0`}>
              {item.icon}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-[#002147] leading-tight truncate">{item.name}</h3>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-medium">Archive</p>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
