// Copyright by nirmal sanjel | hackingwithnirmal@gmail.com | +977 9848744321
import React from "react";
import {
  Code,
  Database,
  Cpu,
  BarChart,
  Users,
  Calculator,
  ArrowRight,
} from "lucide-react";
import { motion } from "motion/react";

const collections = [
  {
    id: "bca-c-programming",
    name: "BCA Programming",
    icon: <Code size={20} />,
    color: "bg-blue-50 text-blue-600 border-blue-100",
  },
  {
    id: "bca-dbms",
    name: "Database Systems",
    icon: <Database size={20} />,
    color: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  {
    id: "bca-microprocessor",
    name: "Microprocessors",
    icon: <Cpu size={20} />,
    color: "bg-purple-50 text-purple-600 border-purple-100",
  },
  {
    id: "bca-probability",
    name: "Statistics",
    icon: <BarChart size={20} />,
    color: "bg-amber-50 text-amber-600 border-amber-100",
  },
  {
    id: "bsw-intro-social-work",
    name: "Social Work",
    icon: <Users size={20} />,
    color: "bg-rose-50 text-rose-600 border-rose-100",
  },
  {
    id: "mgt-211",
    name: "Accountancy",
    icon: <Calculator size={20} />,
    color: "bg-indigo-50 text-indigo-600 border-indigo-100",
  },
];

export function PopularCollections({
  onSelect,
  onViewAll,
}: {
  onSelect: (id: string) => void;
  onViewAll: () => void;
}) {
  return (
    <section className="py-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
        <div className="max-w-xl text-center md:text-left">
          <div className="inline-block px-3 py-1 bg-[#c49b63]/10 text-[#c49b63] text-[10px] font-black uppercase tracking-[0.3em] rounded-full mb-5">
            Curated Archives
          </div>
          <h2 className="text-3xl md:text-6xl font-serif font-bold text-[#002147] mb-6 tracking-tight">
            Focus Areas
          </h2>
          <p className="text-slate-500 font-light text-base md:text-xl leading-relaxed">
            Explore our most distinguished collections, meticulously indexed for
            serious academic research.
          </p>
        </div>
        <button
          onClick={onViewAll}
          className="group flex items-center justify-center gap-4 bg-slate-50 hover:bg-[#002147] px-8 py-4 rounded-2xl transition-all border border-slate-200 hover:border-[#002147] shadow-sm hover:shadow-2xl active:scale-95 w-full md:w-auto"
        >
          <span className="text-xs font-black text-[#002147] group-hover:text-white uppercase tracking-[0.2em] transition-colors">
            Full Directory
          </span>
          <ArrowRight
            size={20}
            className="text-[#c49b63] group-hover:translate-x-1 transition-all"
          />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {collections.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            onClick={() => onSelect(item.id)}
            className="group relative cursor-pointer block"
          >
            {/* Shadow decoration */}
            <div className="absolute inset-0 bg-[#002147] rounded-[2.5rem] translate-y-3 translate-x-3 opacity-0 group-hover:opacity-5 transition-all duration-700"></div>

            <div className="relative h-full bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.03)] hover:shadow-[0_40px_80px_-20px_rgba(196,155,99,0.15)] hover:-translate-y-3 transition-all duration-700 flex flex-col items-start overflow-hidden group">
              {/* Subtle background flair */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-slate-50 rounded-full translate-x-20 -translate-y-20 group-hover:scale-150 transition-all duration-1000 ease-out opacity-50"></div>

              <div
                className={`p-5 rounded-2xl ${item.color} border mb-10 relative z-10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}
              >
                {item.icon}
              </div>

              <h3 className="text-2xl font-bold text-[#002147] mb-3 relative z-10 group-hover:text-[#c49b63] transition-colors duration-300 tracking-tight">
                {item.name}
              </h3>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-12 relative z-10">
                Archive Index No. 0{index + 1}
              </p>

              <div className="mt-auto flex items-center gap-3 text-[11px] font-black text-[#c49b63] uppercase tracking-[0.25em] relative z-10 group-hover:gap-5 transition-all duration-500">
                Explore Repository <ArrowRight size={16} strokeWidth={3} />
              </div>

              {/* Interaction border flair */}
              <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#002147] to-[#c49b63] scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-700 ease-in-out"></div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
