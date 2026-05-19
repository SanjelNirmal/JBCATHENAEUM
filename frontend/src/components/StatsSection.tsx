// Copyright by nirmal sanjel | hackingwithnirmal@gmail.com | +977 9848744321
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
    <div className="pt-20 pb-32 bg-[#002147] relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#c49b63]/10 blur-[150px] rounded-full"></div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
          {stats.map((stat, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="flex flex-col items-center md:items-start group"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#c49b63]/20 group-hover:border-[#c49b63]/30 transition-all duration-500">
                  {stat.icon}
                </div>
                <div className="h-px w-12 bg-white/10 group-hover:bg-[#c49b63]/50 transition-all duration-500 hidden md:block"></div>
              </div>
              
              <div className="text-5xl md:text-6xl font-serif font-black text-white mb-3 group-hover:text-[#c49b63] transition-colors duration-500 tracking-tighter">
                {stat.value}
              </div>
              
              <div className="text-xs font-black text-white/40 uppercase tracking-[0.3em] group-hover:text-white/60 transition-colors duration-500">
                {stat.label}
              </div>
              
              {/* Subtle progression bar placeholder */}
              <div className="w-full h-0.5 bg-white/5 mt-8 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: '100%' }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + (index * 0.1), duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-[#c49b63]"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
