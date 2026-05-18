// Copyright by nirmal sanjel
import React from 'react';
import { FileText, HelpCircle, Users, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';

const stats = [
  { label: 'Notes Archived', value: '12,000+', icon: <FileText className="text-[#c49b63]" size={24} /> },
  { label: 'Past Questions', value: '350+', icon: <HelpCircle className="text-[#c49b63]" size={24} /> },
  { label: 'Faculties Covered', value: '18+', icon: <BookOpen className="text-[#c49b63]" size={24} /> },
  { label: 'Student Contributors', value: '4,200+', icon: <Users className="text-[#c49b63]" size={24} /> },
];

export function StatsSection() {
  return (
    <div className="py-20 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 md:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col items-center text-center group"
            >
              <div className="mb-4 p-4 rounded-full bg-amber-50 group-hover:bg-[#c49b63]/10 transition-colors">
                {stat.icon}
              </div>
              <div className="text-3xl md:text-4xl font-serif font-bold text-[#002147] mb-1">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-slate-500 uppercase tracking-widest px-2">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
