"use client";

import { motion } from "framer-motion";
import { Users, UploadCloud, Cpu, CheckCircle } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      id: "01",
      title: "Create your group",
      description: "Setup a secure, invite-only group for your roommates, trip, or event.",
      icon: Users,
    },
    {
      id: "02",
      title: "Snap & Upload",
      description: "Take a picture of any receipt. Our ImageKit pipeline uploads it instantly.",
      icon: UploadCloud,
    },
    {
      id: "03",
      title: "AI Auto-Parsing",
      description: "Splitora reads the receipt, extracting items, taxes, and assigning costs automatically.",
      icon: Cpu,
    },
    {
      id: "04",
      title: "Settle Up",
      description: "Our algorithm calculates the minimum number of transactions needed to clear all debts.",
      icon: CheckCircle,
    },
  ];

  return (
    <section className="pt-12 pb-24 bg-transparent relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="text-emerald-500 font-semibold tracking-wider uppercase text-sm mb-4 block">Workflow</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white light:text-slate-900 mb-6">How Splitora Works</h2>
          <p className="text-lg text-slate-400 light:text-slate-600 max-w-2xl mx-auto">
            From physical receipt to settled debts in four simple steps. We handle the math, you handle the memories.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative relative group"
            >
              <div className="p-8 rounded-3xl bg-slate-900/40 light:bg-white border border-slate-800/60 light:border-slate-200 backdrop-blur-md hover:bg-slate-800/40 light:hover:bg-slate-50 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_40px_-10px_rgba(16,185,129,0.15)] light:shadow-lg light:hover:shadow-xl h-full">                
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-500/20 shadow-inner light:shadow-[0_0_10px_rgba(16,185,129,0.1)] group-hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all duration-300">
                  <step.icon className="w-7 h-7 text-emerald-400" />
                </div>
                
                <h3 className="text-2xl font-bold text-white light:text-slate-900 mb-3 group-hover:text-emerald-400 light:group-hover:text-emerald-600 transition-colors duration-300">{step.title}</h3>
                <p className="text-slate-400 light:text-slate-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
